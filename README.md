# Mini ERP + CRM Operations Portal

Full-stack case study: Node.js/Express/MySQL backend + React frontend for a
wholesale/distribution company's internal operations — customers, inventory,
and sales challans, with role-based access for Admin, Sales, Warehouse, and
Accounts.

```
erp-crm-portal/
├── backend/     Express REST API + MySQL schema
└── frontend/    React (Vite) admin UI
```

## Quick start (both halves)

**1. Backend** — full instructions in `backend/README.md`, short version:

```bash
cd backend
npm install
cp .env.example .env             # fill in your MySQL credentials
mysql -u root -p < database/schema.sql
npm run seed                     # creates one demo user per role
npm run dev                      # http://localhost:5000
```

**2. Frontend** — in a second terminal:

```bash
cd frontend
npm install
cp .env.example .env             # defaults to http://localhost:5000/api, adjust if needed
npm run dev                      # http://localhost:5173
```

Open `http://localhost:5173` and sign in with any of the seeded accounts
(printed by `npm run seed`), e.g. `admin@erp.local` / `Admin@123`.

## What's implemented

**Backend** (all four modules, transaction-tested against live MySQL):
- JWT auth with 4 roles, enforced per-route
- Customer/CRM: CRUD, search, filters, pagination, follow-up timeline
- Product/Inventory: CRUD, stock movement ledger, atomic negative-stock guard
- Sales Challans: multi-item challans, auto-numbering, Draft/Confirmed/Cancelled
  lifecycle, atomic all-or-nothing stock deduction on confirm, stock reversal
  on cancelling a confirmed challan, immutable product-price snapshots

**Frontend**:
- Login, Dashboard (live stats), Customers, Products, Sales Challans — each
  with list/search/filter/pagination, detail views, and role-gated forms
- The challan builder: search-to-add product line items with live subtotal
  and a stock-availability hint
- A distinct visual identity ("Warehouse Ledger" — see `frontend/README.md`
  for the design rationale) rather than a generic admin-dashboard template

## Verification performed during the build

Both halves were exercised against a **live, running MySQL instance and
Express server** in this environment, not just written and assumed correct:

- Every backend business rule (RBAC, validation, the atomic stock-deduction
  transaction, challan auto-numbering surviving rollbacks, snapshot
  immutability) was tested with real `curl` requests — see `backend/README.md`
  for the specific cases.
- The frontend's production build (`vite build`) compiles clean.
- Every custom Tailwind color class and every `lucide-react` icon import was
  cross-checked against its definition — the classes of bug a successful
  build won't catch.
- A dedicated integration test replayed the **exact request/response shapes**
  every frontend `api/*.js` function and page expects, against the live
  backend: login, the dashboard's 6 parallel calls, customer create → list →
  detail → follow-up, product create → stock movement → stock log, and the
  full challan lifecycle (draft → confirm → verified stock deduction). All
  24 checks passed.

What wasn't possible in this sandbox: a real browser screenshot. Headless
Chromium/Firefox are snap-only on this Ubuntu image (no working snapd here),
and Playwright's browser download is blocked by network egress rules. So the
UI has been verified for correctness (data flow, contracts, no undefined
references) but not visually inspected by a human — worth a first real
click-through before you consider it done.

## Suggested next steps

- Click through the app yourself and sanity-check the visual design.
- Purchase orders / inbound stock as a module (the `stock_movements` ledger
  already supports a `PURCHASE_ORDER` reference type).
- Basic invoicing for the Accounts role.
- Deployment: Docker Compose (app + MySQL) is the simplest path for a
  case-study submission.
