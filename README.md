# ERP + CRM Backend — Phase 1 (Foundations)

Auth + role middleware + DB schema. Customer/Product/Challan modules come in later phases.

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

## Next (Phase 4)

Sales Challan module: multi-line-item challans, Draft/Confirmed/Cancelled
status, auto-generated challan numbers (`challan_counters` table already in
the schema), and the confirm endpoint that calls
`stockMovementModel.recordMovement()` once per line item inside a single
transaction — insufficient stock on *any* item aborts the whole challan, not
just that line.
