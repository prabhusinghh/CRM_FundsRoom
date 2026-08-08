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

## Next (Phase 2)

Customer module: `models/customerModel.js`, `controllers/customerController.js`,
`routes/customerRoutes.js`, `validators/customerValidator.js` — CRUD, search,
pagination, and the follow-up notes endpoint, following the same
model/controller/route/validator pattern as auth above.
