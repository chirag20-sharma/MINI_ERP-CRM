import { Router } from 'express';
import { login, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', login);

// GET /api/auth/me  — requires valid JWT
authRouter.get('/me', authenticate, me);

export default authRouter;
