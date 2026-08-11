# Mini ERP + CRM Operations Portal

A full-stack ERP and CRM operations portal built for wholesale and distribution companies.  
Developed as a **Full Stack Developer Case Study** for **Fundsroom Infotech Pvt. Ltd.**

---

## Overview

Wholesale and distribution businesses need a unified system to manage customers, track inventory, process sales orders, and monitor stock movements — all with role-based access so each team member sees only what they need.

This portal provides:
- A customer CRM with follow-up tracking
- A product catalog with live stock levels
- Stock IN / OUT movements with a full audit trail
- A sales challan workflow (Draft → Confirm → Cancel) with atomic stock deduction
- A real-time dashboard with low stock alerts

---

## Features

| Module | Description |
|---|---|
| Authentication | JWT login, bcrypt password hashing |
| Role-based Access | ADMIN / SALES / WAREHOUSE / ACCOUNTS |
| Customer CRM | Full CRUD, follow-up notes and scheduling |
| Products & Inventory | Product catalog, current stock tracking |
| Stock Movements | Stock IN / OUT with reason and audit trail |
| Sales Challan | Draft → Confirm → Cancel with atomic stock deduction |
| Dashboard | Live stats — customers, products, challans, low stock alerts |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, React Router v7, Vite |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Database | PostgreSQL (Neon cloud) |
| ORM | Prisma |
| Authentication | JWT + bcrypt |
| Deployment | Vercel (frontend), Render (backend), Neon (database) |

---

## Architecture

```
React (Vite + TypeScript)
        ↓  HTTPS REST  (Authorization: Bearer <JWT>)
Express (Node.js + TypeScript)
        ↓  Routes → Controllers → Services
Prisma ORM
        ↓
PostgreSQL (Neon)
```

See [`docs/architecture.md`](docs/architecture.md) for full detail including auth flow, inventory flow, and challan transaction logic.

---

## Role Permissions

| Module | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ❌ | ❌ |
| Products | ✅ | ❌ | ✅ | ❌ |
| Inventory | ✅ | ❌ | ✅ | ❌ |
| Challans | ✅ | ✅ | ❌ | ✅ (view) |

---

## Database Design

### Main Entities

| Table | Purpose |
|---|---|
| `users` | System users with roles |
| `customers` | Customer CRM records |
| `follow_ups` | Follow-up notes per customer |
| `products` | Product catalog with stock levels |
| `stock_movements` | Immutable audit log of every stock change |
| `challans` | Sales delivery challans |
| `challan_items` | Line items with product snapshot data |

### Key Relationships

```
User → Customer → FollowUp
User → Challan → ChallanItem → Product
User → StockMovement → Product
```

`ChallanItem` stores a **product snapshot** (`productName`, `sku`, `unitPrice`) at the time of challan creation — so historical records remain accurate even if the product is later edited.

---

## Business Logic

### Challan Workflow

```
CREATE DRAFT
  → Items saved with product snapshot
  → No stock change

CONFIRM CHALLAN  (atomic Prisma transaction)
  → SELECT FOR UPDATE locks product rows
  → Validates: currentStock >= requested quantity for every item
  → If any item fails → InsufficientStockError → entire transaction rolls back
  → If all pass → stock deducted + StockMovement records created + status = CONFIRMED

CANCEL CHALLAN
  → Only allowed from DRAFT status
  → No stock change (stock was never deducted for drafts)
```

### Insufficient Stock Response

```json
{
  "success": false,
  "code": "INSUFFICIENT_STOCK",
  "items": [
    { "productName": "Industrial Bolt M10", "available": 5, "requested": 20 }
  ]
}
```

---

## Local Setup

### Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL database ([Neon](https://neon.tech) free tier works)

### 1. Clone

```bash
git clone https://github.com/chirag20-sharma/MINI_ERP-CRM.git
cd MINI_ERP-CRM
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"
JWT_SECRET="<minimum_32_character_random_string>"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
```

### 3. Backend

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Runs at: `http://localhost:5000`  
Health check: `GET http://localhost:5000/api/health`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at: `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d` |
| `FRONTEND_URL` | Frontend origin for CORS in production |

### Frontend

The frontend reads the backend URL from `VITE_API_URL` when set (falls back to `http://localhost:5000` in development).

---

## API Documentation

All routes except `/api/health` and `/api/auth/login` require:

```
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/dashboard` | Dashboard stats |
| GET / POST | `/api/customers` | List / create customers |
| GET / PUT / DELETE | `/api/customers/:id` | Customer detail / edit / delete |
| POST | `/api/customers/:id/followups` | Add follow-up |
| GET / POST | `/api/products` | List / create products |
| GET / PUT / DELETE | `/api/products/:id` | Product detail / edit / delete |
| GET / POST | `/api/inventory` | Stock movements list / add |
| GET / POST | `/api/challans` | List / create challans |
| GET / PUT | `/api/challans/:id` | Challan detail / update (DRAFT only) |
| POST | `/api/challans/:id/confirm` | Confirm + deduct stock (atomic) |
| POST | `/api/challans/:id/cancel` | Cancel challan |

### API Collections

Two collection formats are provided — both contain identical requests:

| Tool | File |
|---|---|
| Postman | [`docs/postman-collection.json`](docs/postman-collection.json) |
| VS Code Thunder Client | [`docs/thunder-client-collection.json`](docs/thunder-client-collection.json) |

**How to use (both tools):**
1. Import the collection file
2. Set environment variable `baseUrl` to `http://localhost:5000` (local) or your Render URL (production)
3. Run **Login** — copy the token from the response
4. Set `token` environment variable
5. All other requests use it automatically via `{{token}}`

---

## Deployment

### Database — Neon PostgreSQL

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Set it as `DATABASE_URL` in your backend environment
4. Run migrations: `npx prisma migrate deploy`
5. Run seed: `npm run seed`

### Backend — Render

1. Create a new **Web Service** at [render.com](https://render.com)
2. Connect your GitHub repository
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install && npx prisma generate && npm run build`
   - **Start command:** `npm start`
4. Add environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=7d`
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
   - `NODE_ENV=production`
5. Deploy — health check: `GET https://your-render-url.onrender.com/api/health`

### Frontend — Vercel

1. Import your GitHub repository at [vercel.com](https://vercel.com)
2. Settings:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Add environment variable:
   - `VITE_API_URL=https://your-render-url.onrender.com`
4. Deploy

---

## Demo Credentials

> Development/demo only — never use in production.

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.com | Admin@123 |
| Sales | sales@erp.com | Sales@123 |
| Warehouse | warehouse@erp.com | Warehouse@123 |
| Accounts | accounts@erp.com | Accounts@123 |

Passwords are hashed with **bcrypt (12 rounds)** before storage.

---

## Demo Flow (for evaluators)

```
1.  Login as Admin (admin@erp.com)
2.  View Dashboard — stats and low stock alerts
3.  Create a Customer
4.  Create a Product with stock
5.  Add Stock IN for the product
6.  Create a Challan (DRAFT) — verify stock unchanged
7.  Confirm the Challan — verify stock reduced
8.  View Stock Movement created by confirmation
9.  Create another Challan with quantity > available stock
10. Confirm it — observe INSUFFICIENT_STOCK error, stock unchanged
11. Logout → Login as Sales — verify no Products/Inventory access
12. Logout → Login as Warehouse — verify no Customers/Challans access
```

---

## Known Limitations

- No invoice or PDF generation from challans (planned for future)
- No payment tracking against challans
- No advanced reporting or export (CSV/Excel)
- No product image upload
- No email notifications for follow-ups or low stock
- No Docker setup or CI/CD pipeline
- Single-tenant only (no multi-company support)

---

## Future Improvements

- Invoice PDF generation from confirmed challans
- Payment tracking (paid / partial / outstanding)
- Advanced reports — sales by customer, stock history, revenue
- S3 product image uploads
- Email alerts for low stock and follow-up reminders
- Docker + docker-compose for local development
- GitHub Actions CI/CD pipeline
- Audit logging for all data changes

---

## Current Status

| Part | Description | Status |
|---|---|---|
| Part 1 | Project setup, health check | ✅ Complete |
| Part 2 | Database schema + Prisma | ✅ Complete |
| Part 3 | Authentication + JWT | ✅ Complete |
| Part 4 | Role-based authorization | ✅ Complete |
| Part 5 | Customer CRM module | ✅ Complete |
| Part 6 | Product + inventory module | ✅ Complete |
| Part 7 | Stock movements + challan workflow | ✅ Complete |
| Part 8 | Dashboard + React UI | ✅ Complete |
| Part 9 | Frontend API integration + UX polish | ✅ Complete |
| Part 10 | Final testing, security audit | ✅ Complete |
| Part 11 | Deployment documentation | ✅ Complete |
| Part 12 | Final submission audit | 🔜 Upcoming |
