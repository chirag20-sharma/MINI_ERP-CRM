import { Role } from '../generated/prisma/client';

// Payload stored inside the JWT token
export interface JwtPayload {
  userId: string;
  role: Role;
}

// Extends Express Request so middleware can attach the decoded user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
