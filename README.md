# ERP + CRM Backend — Complete (Phases 1-4)

All four backend modules built and tested end-to-end against live MySQL:
Auth, Customer/CRM, Product/Inventory, and Sales Challans.

## Setup

```bash
cd backend
npm install
cp .env.example .env        # then fill in your MySQL credentials + a JWT_SECRET
```

Create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Seed four demo users (one per role):

```bash
npm run seed
```

This prints the demo logins, e.g.:

```
Admin      admin@erp.local / Admin@123
Sales      sales@erp.local / Sales@123
Warehouse  warehouse@erp.local / Warehouse@123
Accounts   accounts@erp.local / Accounts@123
```

## Run

```bash
npm run dev      # nodemon, auto-restart
# or
npm start
```

Server starts on `http://localhost:5000` (or your `PORT`).

## Try it

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@erp.local","password":"Admin@123"}'

# Use the returned token
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## What's in Phase 1

- `database/schema.sql` — full schema for all four modules (users, customers,
  products, stock movements, challans) so you only run this once.
- `database/seed.js` — demo users only. Add product/customer seed rows here
  later if you want canned demo data.
- JWT auth (`POST /api/auth/login`, `GET /api/auth/me`).
- Reusable middleware other modules will plug into as-is:
  - `middleware/auth.js` — verifies the token, sets `req.user`.
  - `middleware/requireRole.js` — `requireRole('Admin', 'Sales')` on any route.
  - `middleware/validate.js` — turns `express-validator` errors into a
    consistent `400` response.
  - `middleware/errorHandler.js` — `ApiError(statusCode, message, details)`
    thrown anywhere in a controller becomes the right HTTP response.
  - `utils/asyncHandler.js` — wrap async controller functions, no manual
    try/catch needed.

## What's in Phase 2 — Customer / CRM module

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/customers` | All | `?search=&status=&type=&page=&limit=` |
| POST | `/api/customers` | Admin, Sales | |
| GET | `/api/customers/:id` | All | includes `followups[]` |
| PUT | `/api/customers/:id` | Admin, Sales | partial update, only sent fields change |
| POST | `/api/customers/:id/followups` | Admin, Sales | also syncs `customers.follow_up_date` |

- `search` does a partial match across name, mobile, business name, and email.
- List responses are shaped `{ success, data, page, limit, total }`.
- GSTIN, when provided, is checked against the standard 15-character format.
- Tested end-to-end against a live MySQL instance: role checks (403),
  validation (400), not-found (404), search, status/type filters, and the
  follow-up → `follow_up_date` sync all verified working.

## What's in Phase 3 — Product / Inventory module

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/products` | All | `?search=&category=&lowStock=true&page=&limit=` |
| POST | `/api/products` | Admin, Warehouse | rejects duplicate SKU with `409` |
| GET | `/api/products/:id` | All | |
| PUT | `/api/products/:id` | Admin, Warehouse | `current_stock` rejected with `400` — see below |
| GET | `/api/products/:id/stock-log` | All | paginated movement history |
| POST | `/api/products/:id/stock-movement` | Admin, Warehouse | manual IN/OUT, transaction-safe |

**The key design decision:** `current_stock` can never be set directly through
`PUT /api/products/:id` — the validator rejects it outright. The *only* way
stock changes is through `POST /:id/stock-movement`, which:

1. Locks the product row (`SELECT ... FOR UPDATE`) inside a transaction.
2. Computes the new stock and rejects with `409` if an `OUT` would go
   negative — **before** touching the row.
3. Updates `current_stock` and inserts the `stock_movements` row together,
   and rolls back both if either fails.

This guarantees `stock_movements` is always a complete, trustworthy audit
trail of *why* `current_stock` is what it is — there's no code path that lets
the two drift apart. `recordMovement()` also accepts an optional
`reference_type`/`reference_id`/external connection, so Phase 4 (challans)
can reuse it verbatim inside its own transaction instead of duplicating the
locking logic.

**Tested end-to-end**, including the case that matters most: an `OUT`
request for more than available stock returns `409` and leaves both
`current_stock` and the movement log completely untouched (rollback
verified, not just assumed).

## What's in Phase 4 — Sales Challan module

| Method | Endpoint | Roles | Notes |
|---|---|---|---|
| GET | `/api/challans` | All | `?status=&customerId=&page=&limit=` |
| POST | `/api/challans` | Admin, Sales | `status: 'Draft'` (default) or `'Confirmed'` |
| GET | `/api/challans/:id` | All | includes `items[]` with snapshot data |
| PUT | `/api/challans/:id` | Admin, Sales | Draft-only, `409` otherwise |
| POST | `/api/challans/:id/confirm` | Admin, Sales, Warehouse | Draft → Confirmed, deducts stock |
| POST | `/api/challans/:id/cancel` | Admin, Sales | reverses stock if it was Confirmed |

This is the highest-risk module in the system — multiple products, real
money-adjacent stock effects, and several ways for a naive implementation to
leave data half-updated. Design decisions and what was actually verified:

**Auto-numbering (`CH-2026-00001`)** — `challan_counters` is incremented with
`INSERT ... ON DUPLICATE KEY UPDATE` on the *same connection* as the challan
insert, so the row lock serializes concurrent requests. Crucially, this
happens **inside the transaction**: if the challan creation later fails and
rolls back, the counter increment rolls back too, so numbers are never
skipped by a failed attempt. (Note: the challan's own auto-increment `id`
*can* show small gaps after a rollback — that's normal, harmless InnoDB
behavior for internal primary keys. The human-facing `challan_number` is the
one guaranteed gapless, because it's built by hand for exactly this reason.)

**Product snapshots** — `challan_items` stores `product_name_snapshot`,
`product_sku_snapshot`, and `unit_price_snapshot` at creation time. Verified:
changed a product's live price after confirming a challan against it, and
the challan's item still showed the original price.

**All-or-nothing multi-item confirm** — confirming loops over every line item
and calls the same `stockMovementModel.recordMovement()` from Phase 3, on
the transaction's connection. Verified with a 2-item challan where the first
item alone would have succeeded but the second didn't have enough stock: the
whole confirm returned `409` and **neither** item's stock moved — not just
the one that failed.

**Create-directly-as-Confirmed** — `POST /api/challans` with
`"status": "Confirmed"` snapshots the items, deducts stock, and creates the
challan in one transaction. Verified the failure path too: an insufficient-
stock item makes the entire request fail with `409` and **no challan row is
created at all** (not a Draft leftover, not a partial one).

**Cancel reverses Confirmed stock** — cancelling a Draft is a no-op on
stock (nothing was ever deducted). Cancelling a Confirmed challan inserts
compensating `IN` movements for every item. Verified the stock returned to
exactly its pre-confirm value.

**Edit is Draft-only** — `PUT` replaces the item list and recalculates
`total_quantity`; attempting it on a Confirmed or Cancelled challan returns
`409`.

All of the above were exercised against a real running server + MySQL
instance in this build, not just written and assumed correct.

## All four backend modules are complete. From here:

- **Frontend (React)** — Login → Dashboard → Customers → Products → Challan
  builder, wired to these APIs. This is naturally the next thing to build.
- **Purchase orders / inbound stock** as its own module, if scope allows —
  the `stock_movements` ledger with `reference_type` is already set up to
  support it (`reference_type: 'PURCHASE_ORDER'`).
- **Basic invoicing** for the Accounts role.
- **Deployment** — Docker Compose (app + MySQL) is the simplest path for a
  case-study submission; Railway/Render + PlanetScale if you want a live URL.
