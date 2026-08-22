import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/express.d';

function getAccessSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
}

function getRefreshSecret(): string {
  return process.env['JWT_REFRESH_SECRET'] ?? getAccessSecret() + '_refresh';
}

const ACCESS_EXPIRES_IN = process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m';
const REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d';

// Access Token (Short-lived)
export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

// Refresh Token (Long-lived)
export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

// Verify Access Token
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getAccessSecret()) as unknown as JwtPayload;
}

// Verify Refresh Token
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as unknown as JwtPayload;
}

// Backwards compatibility aliases
export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;
