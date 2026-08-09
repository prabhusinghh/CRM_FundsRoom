# ERP + CRM Frontend

React (JavaScript) + Vite + Tailwind CSS, talking to the Express backend in `../backend`.

## Setup

```bash
npm install
cp .env.example .env    # VITE_API_BASE_URL, defaults to http://localhost:5000/api
npm run dev              # http://localhost:5173
```

Requires the backend running and seeded (see `../backend/README.md`) — sign
in with any of the demo accounts it prints.

## Structure

```
src/
├── api/            One file per backend module, thin wrappers over axios
├── context/         AuthContext (session), ToastContext (notifications)
├── components/
│   ├── layout/       Sidebar, Topbar, AppLayout, ProtectedRoute
│   └── common/       Badge, Modal, ConfirmDialog, Pagination, EntityPicker,
│                      FormField primitives, ChallanTag, Spinner, EmptyState
└── pages/
    ├── customers/    List, Form (add/edit), Detail (+ follow-up timeline)
    ├── products/     List, Form, Detail (+ stock log, stock in/out)
    └── challans/     List, Form (multi-item builder), Detail (confirm/cancel)
```

Role-based UI gating uses `useAuth().hasRole(...)` throughout, matching the
backend's RBAC exactly — e.g. only Admin/Warehouse see "Add product", only
Admin/Sales/Warehouse can confirm a challan.

## Design system — "Warehouse Ledger"

This is an internal tool for a distribution company's sales, warehouse, and
accounts teams — not a marketing site — so the design leans into the
paperwork it's replacing (delivery challans, stock ledgers) rather than a
generic SaaS-dashboard look.

**Palette** (`tailwind.config.js`):
| Token | Hex | Used for |
|---|---|---|
| `ink` | `#1B2430` | Sidebar, primary text |
| `kraft` | `#C1793A` | Primary actions, active states — cardboard/shipping-tag color |
| `canvas` | `#F6F3EC` | Page background — paper, not white |
| `slate` | `#5B6B7A` | Secondary text, borders |
| `depot` | `#3F7859` | Confirmed / Active / stock IN |
| `signal` | `#B54334` | Cancelled / low-stock / stock OUT |
| `warn` | `#B8862B` | Lead status, low-stock quantities |

**Type**: Space Grotesk for headings, Inter for body text, and — the
throughline — **IBM Plex Mono for every number**: SKUs, challan numbers,
quantities, prices, phone numbers, timestamps. Tables read like a real
manifest instead of a generic data grid. See the `.num` class in `index.css`.

**Signature element**: challan numbers render as a dashed-border "shipping
tag" (`components/common/ChallanTag.jsx`) everywhere they appear — list,
detail, dashboard — tying the digital record back to the paper document it
replaces.

**Restraint**: the one deliberately "designed" moment is the split-panel
login screen (dark panel with a warehouse-racking motif). Everything else —
tables, forms, the challan builder — stays functional and quiet, since this
is a tool people will use for data entry all day, not admire.
