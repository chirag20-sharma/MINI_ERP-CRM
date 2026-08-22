# Mini ERP + CRM Operations Portal

A full-stack ERP and CRM operations portal built for wholesale and distribution companies.  
Developed as a **Full Stack Developer Case Study** for **Fundsroom Infotech Pvt. Ltd.**

---

## 🚀 Live Demo

### 🌐 [OPEN LIVE APPLICATION]
🚀 (https://mini-erp-crm-omega-fawn.vercel.app/)

**Frontend:** https://mini-erp-crm-omega-fawn.vercel.app/  
**Backend API:** https://mini-erp-backend-yo32.onrender.com/  
**API Health:** https://mini-erp-backend-yo32.onrender.com/api/health  

---

## Overview

Wholesale and distribution businesses need a unified system to manage customers, track inventory, process sales orders, and monitor stock movements — all with role-based access so each team member sees only what they need.

This portal provides:
- **Customer CRM** with follow-up tracking and lead status management
- **Product Catalog** with real-time stock levels and minimum stock threshold indicators
- **Stock IN / OUT Movements** with batch audit trails and non-negative stock enforcement
- **Sales Challan Workflow** (Draft → Confirm → Cancel) with deadlock-proof atomic stock deduction
- **Delivery Challan & Invoice PDF Generation** on-demand and asynchronously via background workers
- **Enterprise Security** with Helmet HTTP headers, IP rate limiting, and rotating refresh tokens
- **Real-Time Dashboard** with low stock alerts and business metrics

---

## Features

| Module | Description |
|---|---|
| **Authentication & Security** | Short-lived JWTs (15m) + rotating HttpOnly Refresh Tokens, bcrypt hashing, Helmet headers, IP rate limiting |
| **Role-based Access** | `ADMIN` / `SALES` / `WAREHOUSE` / `ACCOUNTS` role separation |
| **Customer CRM** | Full CRUD, customer categorization (Retail, Wholesale, Distributor), follow-up scheduling |
| **Products & Inventory** | Product catalog, SKU tracking, category management, minimum stock alerts |
| **Stock Movements** | Stock IN / OUT with reason tracking, row-level locking, and immutable audit logs |
| **Sales Challans** | Draft → Confirm → Cancel workflow with deadlock-proof atomic inventory deduction |
| **PDF Invoices** | Professional PDF delivery challan / invoice generator with customer details and line-item tables |
| **Worker Queue** | Asynchronous job processing (BullMQ + Redis) for PDF generation and low-stock alerts |
| **Dashboard** | Live analytics — active customers, stock value, challan status, low-stock warnings |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, React Router v7, Vite (Route-level Code Splitting & Vendor Chunks) |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL (Neon cloud / Local Docker) |
| **ORM** | Prisma (Composite Performance Indexes & PostgreSQL Sequences) |
| **Async Queues & Cache** | BullMQ & Redis (with resilient in-process fallback) |
| **Document Generation** | PDFKit |
| **Security & Validation** | Zod, Helmet, Express-Rate-Limit, Cookie-Parser, Bcrypt, JWT |
| **DevOps & Containers** | Docker (Multi-stage Alpine), Docker Compose, GitHub Actions CI/CD |
| **Production Hosting** | Vercel (Frontend), Render (Backend), Neon (PostgreSQL) |

---

## Architecture

```
React 18 SPA (Vite + Route Lazy Loading)
        ↓  HTTPS REST (Authorization: Bearer <JWT> + HttpOnly Refresh Cookie)
Express API Cluster (Node.js + TypeScript + Helmet + Rate Limiting)
        │
        ├──► Prisma ORM ──► PostgreSQL (Composite Indexes, Row-Locks, Sequences)
        │
        └──► BullMQ ──► Redis (Worker Queue for PDF Invoices & Low-Stock Alerts)
```

---

## Role Permissions

| Module | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
|---|---|---|---|---|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ |
| **Customers** | ✅ | ✅ | ❌ | ❌ |
| **Products** | ✅ | ❌ | ✅ | ❌ |
| **Inventory** | ✅ | ❌ | ✅ | ❌ |
| **Challans** | ✅ | ✅ | ❌ | ✅ (view) |
| **Download PDF** | ✅ | ✅ | ❌ | ✅ |

---

## Database Design

### Main Entities

| Table | Purpose |
|---|---|
| `users` | System users with roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`) |
| `customers` | Customer CRM records with composite status indexes |
| `follow_ups` | Follow-up notes and dates per customer |
| `products` | Product catalog with live stock, minimum threshold, and category indexes |
| `stock_movements` | Immutable audit log of every stock change with composite date indexes |
| `challans` | Sales delivery challans with sequence-backed numbering and status indexes |
| `challan_items` | Line items with frozen product snapshot data (`productName`, `sku`, `unitPrice`) |

---

## API Documentation

All routes except `/api/health`, `/api/auth/login`, and `/api/auth/refresh` require:
```
Authorization: Bearer <token>
```

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login with rate limiting, returns access token + HttpOnly cookie |
| `POST` | `/api/auth/refresh` | Silent token refresh endpoint |
| `POST` | `/api/auth/logout` | Clears refresh token cookie |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `GET` | `/api/dashboard` | Dashboard metrics and low-stock alerts |
| `GET` / `POST` | `/api/customers` | List / create customer records |
| `GET` / `PUT` / `DELETE` | `/api/customers/:id` | Customer details / update / delete |
| `POST` | `/api/customers/:id/followups` | Add customer follow-up |
| `GET` / `POST` | `/api/products` | List / create products |
| `GET` / `PUT` / `DELETE` | `/api/products/:id` | Product details / update / delete |
| `GET` / `POST` | `/api/inventory` | Stock movement history / Stock IN / Stock OUT |
| `GET` / `POST` | `/api/challans` | List / create sales challans |
| `GET` / `PUT` | `/api/challans/:id` | Challan detail / update (DRAFT only) |
| `POST` | `/api/challans/:id/confirm` | Atomic confirm + deadlock-proof stock deduction |
| `POST` | `/api/challans/:id/cancel` | Cancel challan (DRAFT only) |
| `GET` | `/api/challans/:id/pdf` | Generate and download delivery challan / invoice PDF |

---

## Local Setup & Development

### Option A: Quickstart with Docker Compose (Recommended)

Run the entire stack (PostgreSQL, Redis, Backend, Frontend) with a single command:

```bash
docker compose up -d
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`

---

### Option B: Manual Local Setup

#### Prerequisites
- Node.js v20+
- PostgreSQL database
- (Optional) Redis server

#### 1. Clone
```bash
git clone https://github.com/chirag20-sharma/MINI_ERP-CRM.git
cd MINI_ERP-CRM
```

#### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing Access Tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan (e.g. `7d`) |
| `FRONTEND_URL` | Allowed frontend origin for CORS |
| `REDIS_URL` | Optional Redis connection string for BullMQ workers |

---

## Demo Credentials

> Development/demo only — never use in production.

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@erp.com` | `Admin@123` |
| **Sales** | `sales@erp.com` | `Sales@123` |
| **Warehouse** | `warehouse@erp.com` | `Warehouse@123` |
| **Accounts** | `accounts@erp.com` | `Accounts@123` |

---

## CI/CD Pipeline

Automated continuous integration is configured via **GitHub Actions** (`.github/workflows/ci.yml`):
- Validates Prisma schema and generates client
- Strict TypeScript compile check on backend (`tsc`)
- Vite production chunk bundling and type verification on frontend
