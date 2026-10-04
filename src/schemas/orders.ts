import { z } from 'zod';
import { limitSchema, pageSchema, queryArray } from './common';

export const orderStatusSchema = z.enum(['pending', 'paid', 'expired']);

const isoDate = z
  .string()
  .refine((value) => /^\d{4}-\d{2}-\d{2}([T ][\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(value) && !Number.isNaN(Date.parse(value)), {
    message: 'Expected an ISO-8601 date or date-time',
  })
  .transform((value) => new Date(value));

export const listOrdersQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  status: queryArray(orderStatusSchema),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
