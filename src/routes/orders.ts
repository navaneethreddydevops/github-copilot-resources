import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { parse } from '../middleware/validate';
import { listOrdersQuerySchema } from '../schemas/orders';
import type { OrderService } from '../services/OrderService';

export function ordersRouter(orders: OrderService, authenticate: RequestHandler): Router {
  const router = Router();

  router.get(
    '/',
    authenticate,
    asyncHandler(async (req, res) => {
      res.json(await orders.list(parse(listOrdersQuerySchema, req.query), req.user!));
    }),
  );

  router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req, res) => {
      res.json(await orders.get(req.params.id, req.user!));
    }),
  );

  return router;
}
