# Mini ERP + CRM Operations Portal

A full-stack ERP and CRM operations portal built for wholesale and distribution companies.  
Developed as a **Full Stack Developer Case Study** for **Fundsroom Infotech Pvt. Ltd.**

---

## Business Problem

Wholesale and distribution businesses need a unified system to manage customers, track inventory, process sales orders, and monitor stock movements — all with role-based access so each team member sees only what they need.

---

## Core Features

| Module | Description |
|---|---|
| Authentication | JWT login, bcrypt password hashing, role-based access |
| Dashboard | Live stats — customers, products, challans, low stock alerts |
| Customer CRM | Full CRUD, follow-up tracking per customer |
| Product & Inventory | Product catalog, current stock tracking |
| Stock Movements | Stock IN / OUT with full audit trail |
| Sales Challan | Draft → Confirm → Cancel workflow with atomic stock deduction |

### Challan Business Flow

```
LOGIN → DASHBOARD → CUSTOMER → PRODUCT → STOCK IN
  → CREATE CHALLAN → SAVE DRAFT → CONFIRM CHALLAN
  → STOCK REDUCED → STOCK MOVEMENT CREATED
```

Insufficient stock → structured error → no stock change (atomic transaction).

---

## Tech Stack

**Frontend**
- React 18 + TypeScript
- React Router v7
- Vite
- CSS (custom, no UI library)

**Backend**
- Node.js + Express + TypeScript
- Zod (request validation)
- JWT (authentication)
- bcrypt (password hashing)

**Database**
- PostgreSQL (Neon cloud)
- Prisma ORM

---

## Roles & Permissions

| Role | Access |
|---|---|
| `ADMIN` | Full access to all modules |
| `SALES` | Customers, challans, dashboard |
| `WAREHOUSE` | Products, inventory, stock movements |
| `ACCOUNTS` | Dashboard, challan view |

---

## Architecture

```
mini-erp-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB models
│   │   ├── migrations/         # Prisma migrations
│   │   └── seed.ts             # Dev seed users
│   ├── src/
│   │   ├── controllers/        # Route handlers
│   │   ├── routes/             # Express routers
│   │   ├── services/           # Business logic
│   │   ├── middleware/         # Auth + authorization
│   │   ├── validators/         # Zod schemas
│   │   ├── utils/              # JWT, password helpers
│   │   ├── config/             # Prisma client
│   │   └── app.ts              # Express app setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Route-level components
│   │   ├── components/         # Shared UI components
│   │   ├── layouts/            # AppLayout with sidebar
│   │   ├── services/           # API service functions
│   │   ├── context/            # Auth context
│   │   └── types/              # Shared TypeScript types
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js v18+
- npm v9+
- PostgreSQL database (local or [Neon](https://neon.tech) cloud)

---

### 1. Clone the repository

```bash
git clone https://github.com/chirag20-sharma/MINI_ERP-CRM.git
cd MINI_ERP-CRM
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?sslmode=require"
JWT_SECRET="<minimum_32_character_random_string>"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"
```

### 3. Run the backend

```bash
cd backend
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Backend runs at: `http://localhost:5000`  
Health check: `GET http://localhost:5000/api/health`

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Database Setup

Prisma handles all schema and migrations.

```bash
# Apply migrations
npx prisma migrate deploy

# Seed demo users
npm run seed

# View database (optional)
npx prisma studio
```

---

## Demo Credentials

> These are **development/demo credentials only** — for testing and recruiter review.  
> Never use these in a production environment.

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.com | Admin@123 |
| Sales | sales@erp.com | Sales@123 |
| Warehouse | warehouse@erp.com | Warehouse@123 |
| Accounts | accounts@erp.com | Accounts@123 |

Passwords are hashed with **bcrypt (12 rounds)** before being stored in the database.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/dashboard` | Dashboard stats |
| GET/POST | `/api/customers` | List / create customers |
| GET/PUT/DELETE | `/api/customers/:id` | Customer detail / edit / delete |
| GET/POST | `/api/products` | List / create products |
| GET/PUT/DELETE | `/api/products/:id` | Product detail / edit / delete |
| GET/POST | `/api/inventory` | Stock movements |
| GET/POST | `/api/challans` | List / create challans |
| GET/PUT | `/api/challans/:id` | Challan detail / update |
| POST | `/api/challans/:id/confirm` | Confirm challan + deduct stock |
| POST | `/api/challans/:id/cancel` | Cancel challan |

All routes (except `/api/auth/login` and `/api/health`) require `Authorization: Bearer <token>`.

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT signed with secret from environment variable
- All routes protected with authentication middleware
- Role-based authorization enforced server-side
- Zod validation on all request inputs
- Raw SQL parameterized (no injection risk)
- CORS restricted to `FRONTEND_URL` in production
- Request body size limited to 1mb
- No stack traces exposed to client
- `.env` excluded from version control

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
| Part 11 | Deployment documentation | 🔜 Upcoming |
| Part 12 | Final submission audit | 🔜 Upcoming |
