import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 does NOT forward rejected promises to the error middleware,
 * so every async route handler is wrapped with this helper.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
