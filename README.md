# Mini ERP + CRM Operations Portal

Full-stack case study: Node.js/Express/MySQL backend + React frontend for a wholesale/distribution company's internal operations — customers, inventory, and sales challans, with role-based access for Admin, Sales, Warehouse, and Accounts.

```text
FundsRoom / erp-crm-portal/
├── backend/     Express REST API + MySQL database schema & seeds
└── frontend/    React (Vite + Tailwind CSS) admin UI
```

---

## 🌐 Live Deployment

| Service | URL |
|---|---|
| **Live Backend API** | [https://crm-fundsroom-backend.onrender.com](https://crm-fundsroom-backend.onrender.com) |
| **Health Check** | [https://crm-fundsroom-backend.onrender.com/api/health](https://crm-fundsroom-backend.onrender.com/api/health) |

---

## 🚀 Quick Setup & How to Run

Follow these step-by-step instructions to get the application running on your local machine.

### 📋 Prerequisites

Before starting, ensure you have installed:
1. **Node.js** (v18.x or higher recommended) & **npm**: Check with `node -v` and `npm -v`.
2. **MySQL Server** (v8.0 or MariaDB equivalent):
   - Options: MySQL Community Server, XAMPP, WAMP, MySQL Workbench, or Docker.

---

### Step 1: Set Up MySQL Database

Ensure your MySQL service is running, then create the database and tables using the provided schema.

#### Option A: Command Line / Terminal

- **Windows PowerShell**:
  ```powershell
  Get-Content backend\database\schema.sql | mysql -u root -p
  ```

- **Windows Command Prompt (CMD)**:
  ```cmd
  mysql -u root -p < backend\database\schema.sql
  ```

- **Mac / Linux**:
  ```bash
  mysql -u root -p < backend/database/schema.sql
  ```

#### Option B: MySQL Workbench / phpMyAdmin / DBeaver
1. Open your MySQL client.
2. Open `backend/database/schema.sql`.
3. Execute the entire script. It will automatically create the `erp_crm` database and all required tables.

---

### Step 2: Configure & Start Backend API

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Verify or update your `.env` configuration file:
   - Ensure `DB_PASSWORD` matches your MySQL root password.
   - Adjust `DB_HOST`, `DB_PORT`, `DB_USER` if your MySQL configuration differs.

   ```env
   PORT=5000
   NODE_ENV=development

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=erp_crm

   JWT_SECRET=change_this_to_a_long_random_string
   JWT_EXPIRES_IN=8h
   ```

3. Install backend dependencies (if not already installed):
   ```bash
   npm install
   ```

4. Seed initial demo users into MySQL:
   ```bash
   npm run seed
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   > Server will run at: `http://localhost:5000`

---

### Step 3: Configure & Start Frontend App

1. Open a **NEW / second terminal window** and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   > Frontend will run at: `http://localhost:5173`

---

### Step 4: Login & Demo Accounts

Open your browser and navigate to `http://localhost:5173`. You can log in using any of the seeded accounts:

| Role | Email | Password | Allowed Features |
|---|---|---|---|
| **Admin** | `admin@erp.local` | `Admin@123` | Full access across all modules |
| **Sales** | `sales@erp.local` | `Sales@123` | Customers (CRUD + Followups), Challans (Create/Edit Draft, Confirm, Cancel) |
| **Warehouse** | `warehouse@erp.local` | `Warehouse@123` | Products (CRUD + Stock In/Out movements), Challans (View & Confirm) |
| **Accounts** | `accounts@erp.local` | `Accounts@123` | View-only dashboard, customers, products, and challan metrics |

---

## 🛠️ Architecture & Features

### Backend (Node.js + Express + MySQL)
- **Authentication & RBAC**: JWT tokens stored securely, role-based route middleware (`requireRole`).
- **Customer CRM**: Full CRUD, search, status/type filters, pagination, follow-up timeline sync.
- **Inventory Management**: Products CRUD, stock movement ledger (`IN`/`OUT`), atomic non-negative stock guards (`SELECT FOR UPDATE` inside transactions).
- **Sales Challans**: Multi-item builder, auto-incrementing gapless numbers (`CH-2026-00001`), atomic stock deductions on confirm, stock reversals on cancel, immutable item snapshots.

### Frontend (React + Vite + Tailwind CSS)
- **Role-Gated Navigation**: Automatic UI element hiding/disabling based on user role (`useAuth().hasRole`).
- **Visual Design**: "Warehouse Ledger" aesthetic (industrial palette, monospaced numeric formatting for SKUs/quantities/challans using IBM Plex Mono).
- **Modules**: Dashboard stats, Customer management, Product inventory with stock log modal, Challan creator & lifecyle manager.

---

## ❓ Troubleshooting

- **`ER_ACCESS_DENIED_ERROR`**: Check `DB_USER` and `DB_PASSWORD` in `backend/.env`.
- **`ER_BAD_DB_ERROR`**: The `erp_crm` database was not created. Re-run `schema.sql`.
- **PowerShell `<` Redirection Error**: Use `Get-Content backend\database\schema.sql | mysql -u root -p` instead of `<`.
- **API Connection Failed**: Ensure backend is running on `http://localhost:5000` and `frontend/.env` contains `VITE_API_BASE_URL=http://localhost:5000/api`.

