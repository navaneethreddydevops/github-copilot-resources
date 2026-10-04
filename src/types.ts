import type { UserRole } from './entities/User';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by the request-id middleware. */
      requestId: string;
      /** Set by the authenticate middleware. */
      user?: AuthUser;
    }
  }
}

export {};
