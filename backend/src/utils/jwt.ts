import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/express.d';

function getSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
}

const expiresIn = process.env['JWT_EXPIRES_IN'] ?? '7d';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as unknown as JwtPayload;
}
