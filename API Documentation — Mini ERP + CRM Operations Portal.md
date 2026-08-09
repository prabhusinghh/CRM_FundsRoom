# API Documentation — Mini ERP + CRM Operations Portal

This document covers the main API endpoints used by the Mini ERP + CRM Operations Portal, including authentication, customers, products, stock movements, and sales challans.

## Base URLs

**Live API:** `https://crm-fundsroom-backend.onrender.com/api`

**Local:** `http://localhost:5000/api`

> **Note:** The live backend is hosted on Render's free tier. Render may put the server to sleep after some time without requests. Because of this, the first request after a period of inactivity can take around **30–60 seconds** while the server starts again. This is expected behavior.

---

## Authentication

All API endpoints require a JWT token except `POST /auth/login`.

Send the token in the request header like this:

```http
Authorization: Bearer <token>
```

The token is returned when a user logs in and remains valid for **8 hours**.

### User Roles

The application currently has four roles:

- `Admin`
- `Sales`
- `Warehouse`
- `Accounts`

Each endpoint specifies which roles are allowed to access it. If a logged-in user doesn't have permission for an endpoint, the API returns `403 Forbidden`.

### Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@erp.local` | `Admin@123` |
| Sales | `sales@erp.local` | `Sales@123` |
| Warehouse | `warehouse@erp.local` | `Warehouse@123` |
| Accounts | `accounts@erp.local` | `Accounts@123` |

---

## Response Format

All API responses are returned as JSON and include a `success` field.

### Single Resource

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Example"
  }
}
```

### Paginated List

```json
{
  "success": true,
  "data": [],
  "page": 1,
  "limit": 20,
  "total": 47
}
```

### Error Response

```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": [
    {
      "field": "email",
      "message": "A valid email is required"
    }
  ]
}
```

The `errors` array is only included for `400` validation errors.

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Request completed successfully |
| `201` | A new resource was created |
| `400` | Request data failed validation |
| `401` | Token is missing/invalid/expired, or login credentials are incorrect |
| `403` | User is authenticated but doesn't have permission |
| `404` | Requested resource doesn't exist |
| `409` | Request conflicts with the current data, such as a duplicate SKU, insufficient stock, or invalid status change |

---

# Auth

## `POST /auth/login`

**Access:** Public

Used to log a user into the system.

### Request

```json
{
  "email": "admin@erp.local",
  "password": "Admin@123"
}
```

### Successful Response

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@erp.local",
      "role": "Admin"
    }
  }
}
```

Returns `401` if the email or password is incorrect.

---

## `GET /auth/me`

**Access:** Any logged-in user

Returns the details of the user associated with the current JWT token.

### Response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@erp.local",
    "role": "Admin",
    "is_active": true,
    "created_at": "..."
  }
}
```

---

# Customers

## `GET /customers`

**Access:** All roles

Returns a list of customers.

### Query Parameters

- `search` — searches by name, mobile number, business name, or email
- `status` — `Lead`, `Active`, or `Inactive`
- `type` — `Retail`, `Wholesale`, or `Distributor`
- `page`
- `limit` — maximum `100`

The `search` parameter supports partial matches.

---

## `POST /customers`

**Access:** Admin, Sales

Creates a new customer.

### Request

```json
{
  "name": "Ramesh Traders",
  "mobile": "9876543210",
  "email": "ramesh@traders.com",
  "business_name": "Ramesh Traders Pvt Ltd",
  "gst_number": "27AAAPL1234C1Z5",
  "customer_type": "Wholesale",
  "address": "MG Road, Jaipur",
  "status": "Lead",
  "follow_up_date": "2026-09-01",
  "notes": "Interested in bulk stationery order"
}
```

Only `name` and `mobile` are required. The remaining fields are optional.

A successful request returns `201` along with the newly created customer.

---

## `GET /customers/:id`

**Access:** All roles

Returns one customer along with their `followups[]` history.

Follow-ups are returned with the newest entry first.

---

## `PUT /customers/:id`

**Access:** Admin, Sales

Updates an existing customer.

This is a partial update, so you only need to send the fields you want to change.

Returns `404` if the customer doesn't exist.

---

## `POST /customers/:id/followups`

**Access:** Admin, Sales

Adds a follow-up entry to a customer.

### Request

```json
{
  "note": "Called, wants a quote by Friday",
  "follow_up_date": "2026-09-05"
}
```

The `note` field is required.

If `follow_up_date` is provided, it also updates the customer's main `follow_up_date` value.

Returns `201` with the newly created follow-up.

---

# Products

## `GET /products`

**Access:** All roles

Returns the list of products.

### Query Parameters

- `search` — searches by product name or SKU
- `category`
- `lowStock` — set to `true` to return products at or below their minimum stock level
- `page`
- `limit`

---

## `POST /products`

**Access:** Admin, Warehouse

Creates a new product.

### Request

```json
{
  "name": "Steel Rod 12mm",
  "sku": "SR-12MM",
  "category": "Steel",
  "unit_price": 450,
  "current_stock": 100,
  "min_stock_alert": 10,
  "warehouse_location": "A1"
}
```

`name`, `sku`, and `unit_price` are required.

The API returns `409` if the SKU already exists.

---

## `GET /products/:id`

**Access:** All roles

Returns the details of a specific product.

---

## `PUT /products/:id`

**Access:** Admin, Warehouse

Updates product information.

The following fields can be updated:

- `name`
- `sku`
- `category`
- `unit_price`
- `min_stock_alert`
- `warehouse_location`

`current_stock` cannot be changed through this endpoint.

Stock changes must go through the stock-movement endpoint instead. This keeps the stock history consistent and makes it possible to see why the current stock changed.

Sending `current_stock` through this endpoint results in a `400` response.

---

## `GET /products/:id/stock-log`

**Access:** All roles

Returns the stock movement history for a product.

The results are paginated and shown with the newest movements first.

### Query Parameters

- `page`
- `limit`

---

## `POST /products/:id/stock-movement`

**Access:** Admin, Warehouse

Used when stock comes into or goes out of the warehouse.

### Request

```json
{
  "quantity_changed": 20,
  "movement_type": "IN",
  "reason": "Purchase order received"
}
```

`movement_type` can be either:

- `IN`
- `OUT`

The `reason` field is required.

Stock updates are handled inside a database transaction with a row lock. If an `OUT` movement would make the stock negative, the API returns `409` and doesn't change anything.

A successful request returns `201` with the movement details and the updated stock count.

---

# Sales Challans

## `GET /challans`

**Access:** All roles

Returns a list of sales challans.

### Query Parameters

- `status` — `Draft`, `Confirmed`, or `Cancelled`
- `customerId`
- `page`
- `limit`

---

## `POST /challans`

**Access:** Admin, Sales

Creates a new sales challan.

### Request

```json
{
  "customer_id": 1,
  "items": [
    {
      "product_id": 1,
      "quantity": 10
    },
    {
      "product_id": 3,
      "quantity": 2
    }
  ],
  "status": "Draft"
}
```

The `status` field is optional.

If it isn't provided, the challan is created as `Draft`.

The other possible value is `Confirmed`.

### Confirming During Creation

If `"Confirmed"` is sent when creating the challan, stock is deducted for all items as part of the same database transaction.

If even one item doesn't have enough stock:

- The request returns `409`
- No stock is deducted
- The challan is not created

This prevents partially completed transactions.

### Product Snapshots

When a challan is created, the product name, SKU, and price are stored in `challan_items`.

This means that if a product's price changes later, old challans still show the price that was used when they were created.

Challan numbers are automatically generated in this format:

```text
CH-YYYY-00001
```

The numbering starts again for each year.

---

## `GET /challans/:id`

**Access:** All roles

Returns a single challan with:

- Customer information
- Challan details
- `items[]`
- Product name, SKU, and price saved at the time the challan was created

---

## `PUT /challans/:id`

**Access:** Admin, Sales

Updates the customer and/or items on a challan.

Only `Draft` challans can be edited.

Trying to update a `Confirmed` or `Cancelled` challan returns `409`.

---

## `POST /challans/:id/confirm`

**Access:** Admin, Sales, Warehouse

Confirms a draft challan and deducts stock for all of its items.

The entire operation runs inside one database transaction.

If there isn't enough stock for any item:

- The request returns `409`
- No stock is deducted
- The other items are not deducted either

In other words, the confirmation either succeeds completely or doesn't happen at all.

The challan must currently be in `Draft` status.

---

## `POST /challans/:id/cancel`

**Access:** Admin, Sales

Cancels a challan.

### Draft Challan

Cancelling a draft does not affect stock.

### Confirmed Challan

If a confirmed challan is cancelled, the stock that was previously deducted is added back.

The system records these changes as compensating `IN` stock movements for each item.

Trying to cancel an already cancelled challan returns `409`.

---

# Example API Flow

The following example shows a basic flow using `curl`.

```bash
BASE=https://crm-fundsroom-backend.onrender.com/api
```

### 1. Log in

```bash
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sales@erp.local","password":"Sales@123"}' | jq -r .data.token)
```

### 2. Create a customer

```bash
curl -s -X POST $BASE/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","mobile":"9000000000"}'
```

### 3. Create a draft challan

```bash
curl -s -X POST $BASE/challans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"items":[{"product_id":1,"quantity":5}]}'
```

### 4. Confirm the challan

```bash
curl -s -X POST $BASE/challans/1/confirm \
  -H "Authorization: Bearer $TOKEN"
```

This flow demonstrates the basic sequence: **login → create customer → create challan → confirm challan**.