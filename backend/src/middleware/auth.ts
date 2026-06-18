import { NextFunction, Request, Response } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Augment Express's Request type with the authenticated user payload.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/** Restrict a route to a single role. */
export function requireRole(role: 'CUSTOMER' | 'SERVER') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.auth?.role !== role) {
      res.status(403).json({ error: `This action requires the ${role} role` });
      return;
    }
    next();
  };
}
