import type { z } from 'zod';

/** Parses `input` with `schema`; throws ZodError (-> 400 VALIDATION_ERROR via the error handler). */
export function parse<S extends z.ZodTypeAny>(schema: S, input: unknown): z.output<S> {
  return schema.parse(input);
}
