import { z } from 'zod';
import { limitSchema, pageSchema, queryArray } from './common';

export const userRoleSchema = z.enum(['admin', 'user']);
export const userStatusSchema = z.enum(['active', 'blocked']);

export const listUsersQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  status: queryArray(userStatusSchema),
  sort: z.enum(['name', '-createdAt']).optional(),
});

// NOTE: z.object() strips unknown keys by default (e.g. `{"isAdmin": true}` is silently dropped).
export const createUserSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(72),
  role: userRoleSchema.default('user'),
  status: userStatusSchema.default('active'),
});

// Every field is optional (omitted = untouched) but none is nullable: `{"name": null}` -> 400.
export const updateUserSchema = z.object({
  email: z.string().trim().email().max(255).optional(),
  name: z.string().trim().min(1).max(100).optional(),
  password: z.string().min(8).max(72).optional(),
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
