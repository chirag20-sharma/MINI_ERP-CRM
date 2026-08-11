# Deployment Notes — Mini ERP + CRM

---

## Stack

| Layer | Service | URL |
|---|---|---|
| Database | Neon PostgreSQL | https://neon.tech |
| Backend | Render Web Service | https://mini-erp-backend-yo32.onrender.com |
| Frontend | Vercel | https://mini-erp-crm-git-main-chirag-8084.vercel.app |

---

## Backend — Render

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm install && npx prisma generate && npm run build` |
| Start command | `npm start` |
| Node version | 18 |

### Environment Variables (set in Render dashboard)

```
DATABASE_URL=<your_neon_connection_string>
JWT_SECRET=<min_64_char_random_string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://mini-erp-crm-git-main-chirag-8084.vercel.app
NODE_ENV=production
PORT=5000
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Verify backend is live

```
GET https://mini-erp-backend-yo32.onrender.com/api/health
```

Expected response:
```json
{ "success": true, "message": "Mini ERP API is running" }
```

---

## Frontend — Vercel

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 18 |

### Environment Variables (set in Vercel dashboard)

```
VITE_API_URL=https://mini-erp-backend-yo32.onrender.com
```

---

## Database — Neon

1. Create project at https://neon.tech
2. Copy connection string (includes `?sslmode=require`)
3. Set as `DATABASE_URL` in Render environment variables
4. Run migrations from local machine pointing to production DB:

```bash
cd backend
DATABASE_URL="<neon_connection_string>" npx prisma migrate deploy
DATABASE_URL="<neon_connection_string>" npm run seed
```

Or set `DATABASE_URL` in your local `.env` temporarily and run:
```bash
npx prisma migrate deploy
npm run seed
```

---

## CORS

In production, CORS is restricted to `FRONTEND_URL` only.  
Set `FRONTEND_URL` in Render to your exact Vercel URL (no trailing slash).

Example:
```
FRONTEND_URL=https://mini-erp-crm.vercel.app
```

---

## Render Free Tier Note

Render free tier spins down after 15 minutes of inactivity.  
The first request after spin-down may take 30–60 seconds.  
This is expected behaviour on the free tier.
