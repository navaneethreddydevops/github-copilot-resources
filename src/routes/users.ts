import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireRole } from '../middleware/auth';
import { parse } from '../middleware/validate';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from '../schemas/users';
import type { UserService } from '../services/UserService';

export function usersRouter(users: UserService, authenticate: RequestHandler): Router {
  const router = Router();
  const adminOnly = requireRole('admin');

  router.get(
    '/',
    authenticate,
    asyncHandler(async (req, res) => {
      res.json(await users.list(parse(listUsersQuerySchema, req.query)));
    }),
  );

  router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req, res) => {
      res.json(await users.get(req.params.id));
    }),
  );

  router.post(
    '/',
    authenticate,
    adminOnly,
    asyncHandler(async (req, res) => {
      const user = await users.create(parse(createUserSchema, req.body));
      res.status(201).location(`/api/users/${user.id}`).json(user);
    }),
  );

  router.patch(
    '/:id',
    authenticate,
    adminOnly,
    asyncHandler(async (req, res) => {
      res.json(await users.update(req.params.id, parse(updateUserSchema, req.body)));
    }),
  );

  router.delete(
    '/:id',
    authenticate,
    adminOnly,
    asyncHandler(async (req, res) => {
      await users.remove(req.params.id);
      res.status(204).end();
    }),
  );

  return router;
}
