import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { parse } from '../middleware/validate';
import { loginSchema } from '../schemas/auth';
import type { AuthService } from '../services/AuthService';

export function authRouter(auth: AuthService): Router {
  const router = Router();

  router.post(
    '/login',
    asyncHandler(async (req, res) => {
      const { email, password } = parse(loginSchema, req.body);
      res.json(await auth.login(email, password));
    }),
  );

  return router;
}
