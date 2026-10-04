import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';
import type { UserRepository } from '../repositories/UserRepository';
import type { AuthUser } from '../types';

export interface AuthSettings {
  jwtSecret: string;
  /** Seconds. */
  jwtExpiresIn: number;
}

export interface LoginResult {
  token: string;
  expiresIn: number;
}

interface TokenClaims {
  sub: string;
  email: string;
  role: AuthUser['role'];
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly settings: AuthSettings,
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    // Same error for unknown, deleted, blocked or wrong password - no user enumeration.
    const ok =
      user !== null &&
      user.deletedAt === null &&
      user.status === 'active' &&
      (await bcrypt.compare(password, user.passwordHash));
    if (!ok || !user) throw new UnauthorizedError('Invalid email or password');

    const claims: TokenClaims = { sub: user.id, email: user.email, role: user.role };
    const token = jwt.sign(claims, this.settings.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: this.settings.jwtExpiresIn,
    });
    return { token, expiresIn: this.settings.jwtExpiresIn };
  }

  verify(token: string): AuthUser {
    try {
      const decoded = jwt.verify(token, this.settings.jwtSecret, { algorithms: ['HS256'] });
      if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
        throw new UnauthorizedError('Invalid token');
      }
      const claims = decoded as jwt.JwtPayload & TokenClaims;
      return { id: claims.sub, email: claims.email, role: claims.role };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
