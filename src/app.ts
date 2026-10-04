import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import type { AppConfig } from './config';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import type { OrderRepository } from './repositories/OrderRepository';
import type { UserRepository } from './repositories/UserRepository';
import { authRouter } from './routes/auth';
import { healthRouter } from './routes/health';
import { ordersRouter } from './routes/orders';
import { usersRouter } from './routes/users';
import { AuthService } from './services/AuthService';
import { OrderService } from './services/OrderService';
import { UserService } from './services/UserService';
import './types';

export interface AppDeps {
  userRepository: UserRepository;
  orderRepository: OrderRepository;
  config: Pick<AppConfig, 'jwtSecret' | 'jwtExpiresIn' | 'corsOrigin' | 'logLevel'>;
  /** Optional overrides (tests use a low bcrypt cost / silent logger). */
  bcryptRounds?: number;
  logger?: pino.Logger;
}

/**
 * Builds the Express app. Express defaults are intentionally left in place
 * (X-Powered-By, weak ETags, case-insensitive + non-strict routing, default
 * HTML 404 for unknown routes) because they are parity pitfalls for the
 * Spring Boot migration.
 */
export function createApp(deps: AppDeps): Express {
  const logger = deps.logger ?? pino({ level: deps.config.logLevel });
  const authService = new AuthService(deps.userRepository, {
    jwtSecret: deps.config.jwtSecret,
    jwtExpiresIn: deps.config.jwtExpiresIn,
  });
  const userService = new UserService(deps.userRepository, deps.bcryptRounds);
  const orderService = new OrderService(deps.orderRepository);
  const auth = authenticate(authService);

  const app = express();

  app.use(requestId());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as express.Request).requestId,
    }),
  );
  // xPoweredBy: false => helmet does NOT strip Express's `X-Powered-By: Express` header (deliberate).
  app.use(helmet({ xPoweredBy: false }));
  app.use(cors({ origin: deps.config.corsOrigin }));
  app.use(express.json()); // default 100kb limit

  app.use(healthRouter());
  app.use('/api/auth', authRouter(authService));
  app.use('/api/users', usersRouter(userService, auth));
  app.use('/api/orders', ordersRouter(orderService, auth));

  // Deliberately NO catch-all 404 handler: unknown routes get Express's HTML "Cannot GET /x".
  app.use(errorHandler);

  return app;
}
