import type { RequestHandler } from 'express';
import type { UserRole } from '../entities/User';
import { ForbiddenError, UnauthorizedError } from '../errors';
import type { AuthService } from '../services/AuthService';
import '../types';

/** Requires `Authorization: Bearer <HS256 JWT>`; populates `req.user`. */
export function authenticate(auth: AuthService): RequestHandler {
  return (req, _res, next) => {
    const header = req.header('authorization');
    const match = header ? /^Bearer\s+(\S+)$/i.exec(header) : null;
    if (!match) {
      next(new UnauthorizedError('Missing bearer token'));
      return;
    }
    try {
      req.user = auth.verify(match[1]);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Must run after `authenticate`. */
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Requires role: ${roles.join(', ')}`));
      return;
    }
    next();
  };
}
