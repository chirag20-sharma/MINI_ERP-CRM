import { Request, Response } from 'express';
import { loginSchema } from '../validators/auth.validator';
import { loginUser, getMe } from '../services/auth.service';

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
    res.status(200).json({ success: true, ...data });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err instanceof Error ? err.message : 'Login failed',
    });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    // req.user is attached by the authenticate middleware
    const user = await getMe(req.user!.userId);
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err instanceof Error ? err.message : 'User not found',
    });
  }
}
