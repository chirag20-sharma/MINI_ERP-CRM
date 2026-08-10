# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM portal for wholesale/distribution companies.

**Stack:** React + TypeScript (frontend) | Node.js + Express + TypeScript (backend) | PostgreSQL + Prisma (database)

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

---

### Run the Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at: http://localhost:5000

Health check: GET http://localhost:5000/api/health

---

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Project Structure

```
mini-erp-crm/
├── backend/        # Express + TypeScript API
├── frontend/       # React + TypeScript + Vite UI
├── docs/           # Architecture and planning docs
├── README.md
└── .gitignore
```

---

## Parts

- **Part 1** — Project setup, health check, homepage ✅
- **Part 2** — Database + Prisma setup ✅
- **Part 3** — Customer management ✅
- **Part 4** — Product/inventory management ✅
- **Part 5** — Inventory movements (stock IN/OUT, audit trail) ✅
- **Part 6** — Auth (JWT, role-based access control) ✅
- **Part 7** — Sales Challan workflow (draft → confirm → stock deduction) ✅
- Part 8 — Dashboard & analytics
- ...and more
