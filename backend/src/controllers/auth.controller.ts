import { Request, Response } from 'express';
import { loginSchema } from '../validators/auth.validator';
import { loginUser, getMe, refreshUserToken } from '../services/auth.service';
import { AppError } from '../utils/errors';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: (process.env['NODE_ENV'] === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function login(req: Request, res: Response): Promise<void> {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const data = await loginUser(result.data);

    // Set secure HttpOnly cookie for refresh token
    res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      token: data.accessToken,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
      return;
    }
    res.status(401).json({
      success: false,
      message: err instanceof Error ? err.message : 'Login failed',
    });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    res.status(401).json({
      success: false,
      code: 'MISSING_REFRESH_TOKEN',
      message: 'No refresh token provided',
    });
    return;
  }

  try {
    const data = await refreshUserToken(token);
    res.cookie('refreshToken', data.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      token: data.accessToken,
      accessToken: data.accessToken,
      user: data.user,
    });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
      return;
    }
    res.status(401).json({
      success: false,
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Invalid or expired refresh token',
    });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await getMe(req.user!.userId);
    res.status(200).json({ success: true, user });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
      return;
    }
    res.status(404).json({
      success: false,
      message: err instanceof Error ? err.message : 'User not found',
    });
  }
}
