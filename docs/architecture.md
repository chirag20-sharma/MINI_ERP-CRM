# Architecture — Mini ERP + CRM Operations Portal

---

## Overview

The application follows a standard three-tier architecture:

```
┌─────────────────────────────────────┐
│           React Frontend            │
│   (Vite + TypeScript + React Router)│
└──────────────┬──────────────────────┘
               │ HTTPS REST API
               │ Authorization: Bearer <JWT>
┌──────────────▼──────────────────────┐
│          Express Backend            │
│   Routes → Controllers → Services  │
│   Middleware: Auth + RBAC + Zod     │
└──────────────┬──────────────────────┘
               │ Prisma ORM
┌──────────────▼──────────────────────┐
│        PostgreSQL (Neon)            │
│   users, customers, products,       │
│   stock_movements, challans,        │
│   challan_items, follow_ups         │
└─────────────────────────────────────┘
```

---

## Frontend Architecture

```
frontend/src/
├── pages/          # One component per route (LoginPage, DashboardPage, etc.)
├── components/     # Reusable UI (CustomerForm, FollowUpPanel, UI.tsx)
├── layouts/        # AppLayout — sidebar + mobile hamburger + outlet
├── services/       # API call functions per module (customer.service.ts, etc.)
├── context/        # AuthContext — stores JWT token + user in memory
├── types/          # Shared TypeScript interfaces
└── App.tsx         # React Router route definitions
```

**Key decisions:**
- No UI library — custom CSS only, keeps bundle small
- Auth state in React Context, token stored in `localStorage`
- All API calls go through `services/api.ts` which injects the Bearer token and handles global 401 (auto-logout)
- Role-based UI — sidebar links and page access controlled by user role from JWT payload

---

## Backend Architecture

```
backend/src/
├── routes/         # Express Router — maps HTTP method + path to controller
├── controllers/    # Thin handlers — parse request, call service, return response
├── services/       # Business logic — all DB access lives here
├── middleware/
│   ├── authenticate.ts   # Verifies JWT, attaches user to req
│   └── authorize.ts      # Checks role against allowed roles array
├── validators/     # Zod schemas — validate req.body before controller runs
├── utils/          # jwt.ts (sign/verify), password.ts (hash/compare)
└── config/
    └── prisma.ts   # Single shared PrismaClient instance
```

**Request lifecycle:**
```
HTTP Request
  → CORS check
  → express.json() (body parse, 1mb limit)
  → authenticate middleware (JWT verify)
  → authorize middleware (role check)
  → Zod validator
  → Controller
  → Service (business logic + DB)
  → JSON Response
```

---

## Database Architecture

### Entity Relationships

```
User ──< Customer ──< FollowUp
User ──< Challan ──< ChallanItem >── Product
User ──< StockMovement >── Product
Customer ──< Challan
```

### Key Design Decisions

- **cuid()** primary keys — URL-safe, no sequential ID guessing
- **ChallanItem snapshot fields** (`productName`, `sku`, `unitPrice`) — copied at challan creation time so historical records are accurate even if the product is later edited or deleted
- **currentStock on Product** — maintained by atomic transactions, never calculated on the fly
- **StockMovement audit trail** — every stock change (IN/OUT) creates an immutable record with reason and user

---

## Authentication & Authorization

```
POST /api/auth/login
  → validate email + password (Zod)
  → find user by email (Prisma)
  → bcrypt.compare(plain, hash)
  → jwt.sign({ userId, role }, JWT_SECRET, { expiresIn })
  → return { token, user }
```

All protected routes:
```
Request → authenticate.ts
  → extract Bearer token from Authorization header
  → jwt.verify(token, JWT_SECRET)
  → attach { userId, role } to req.user
  → next()

→ authorize(['ADMIN', 'SALES'])
  → check req.user.role is in allowed list
  → 403 if not
```

---

## Inventory Flow

```
Stock IN:
  POST /api/inventory
  body: { productId, quantity, type: 'IN', reason }
  → validate (Zod)
  → prisma.$transaction([
      update product currentStock += quantity,
      create StockMovement { type: IN }
    ])

Stock OUT (manual):
  Same flow with type: 'OUT', currentStock -= quantity
  → check currentStock >= quantity before deducting
```

---

## Challan Flow & Business Logic

```
CREATE DRAFT:
  POST /api/challans
  → validate items (productId, quantity, unitPrice)
  → snapshot productName + sku from DB at creation time
  → create Challan { status: DRAFT } + ChallanItems
  → NO stock change at this point

CONFIRM CHALLAN:
  POST /api/challans/:id/confirm
  → prisma.$transaction(async (tx) => {
      1. SELECT FOR UPDATE — lock product rows (prevent race conditions)
      2. Validate each item: product.currentStock >= item.quantity
         → if any fail: throw InsufficientStockError (entire tx rolls back)
      3. For each item:
         - UPDATE product SET currentStock -= quantity
         - CREATE StockMovement { type: OUT, reason: 'Challan #...' }
      4. UPDATE challan SET status = CONFIRMED
    })

CANCEL CHALLAN:
  POST /api/challans/:id/cancel
  → only DRAFT challans can be cancelled
  → status → CANCELLED
  → no stock change (stock was never deducted for drafts)

INSUFFICIENT STOCK:
  → structured error response:
    { success: false, code: 'INSUFFICIENT_STOCK',
      items: [{ productName, available, requested }] }
  → transaction rolls back — zero stock change
```

---

## Assumptions

1. Inventory is only deducted when a challan is **confirmed**, not when it is drafted.
2. Draft challans are working documents — they do not reserve or affect stock.
3. Product snapshot data (`productName`, `sku`, `unitPrice`) is stored on `ChallanItem` for historical accuracy — editing a product does not alter past challans.
4. Confirmed challans are treated as immutable historical records — they cannot be edited, only cancelled (and cancellation is only allowed from DRAFT status).
5. All inventory changes are audited through `StockMovement` records — there is no direct stock edit without a movement record.
6. `SELECT FOR UPDATE` is used during challan confirmation to prevent race conditions when multiple users confirm challans simultaneously.
7. The `currentStock` field on `Product` is the single source of truth for available stock.

---

## Security Architecture

| Layer | Mechanism |
|---|---|
| Passwords | bcrypt, 12 salt rounds |
| Authentication | JWT, signed with `JWT_SECRET` from env |
| Authorization | Role check middleware on every protected route |
| Input validation | Zod schemas on all request bodies |
| SQL injection | Prisma ORM + parameterized raw SQL only |
| CORS | Restricted to `FRONTEND_URL` in production |
| Body size | `express.json({ limit: '1mb' })` |
| Secrets | All in `.env`, excluded from git |
| Error responses | No stack traces sent to client |
