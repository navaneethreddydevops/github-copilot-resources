import { z } from 'zod';

/**
 * Express 4 uses the `qs` "extended" parser: `?status[]=a&status[]=b` -> ['a','b'],
 * while `?status=a` -> 'a'. Normalise both to an array.
 */
export function queryArray<T extends z.ZodTypeAny>(item: T) {
  return z.preprocess(
    (value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]),
    z.array(item).optional(),
  );
}

export const pageSchema = z.coerce.number().int().min(1).default(1);
export const limitSchema = z.coerce.number().int().min(1).max(100).default(20);
