import { Router } from 'express';
import { login, me, refresh, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authLimiter } from '../middleware/rateLimiter';

const authRouter = Router();

// POST /api/auth/login (Rate limited)
authRouter.post('/login', authLimiter, login);

// POST /api/auth/refresh (Rate limited)
authRouter.post('/refresh', authLimiter, refresh);

// POST /api/auth/logout
authRouter.post('/logout', logout);

// GET /api/auth/me — requires valid JWT
authRouter.get('/me', authenticate, me);

export default authRouter;
