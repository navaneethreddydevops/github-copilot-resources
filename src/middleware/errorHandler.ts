import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorCode, type ErrorDetail } from '../errors';
import '../types';

interface ErrorEnvelope {
  error: { code: ErrorCode; message: string; details?: ErrorDetail[] };
  requestId: string;
}

interface HttpLikeError {
  status?: number;
  statusCode?: number;
  type?: string;
  expose?: boolean;
  message?: string;
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof ZodError) {
    return new AppError(
      400,
      'VALIDATION_ERROR',
      'Request validation failed',
      err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message, code: issue.code })),
    );
  }
  const httpErr = err as HttpLikeError;
  // body-parser errors (malformed JSON, payload too large, ...)
  if (httpErr && httpErr.type === 'entity.parse.failed') {
    return new AppError(400, 'VALIDATION_ERROR', 'Malformed JSON body');
  }
  const status = httpErr?.status ?? httpErr?.statusCode;
  if (status && status >= 400 && status < 500 && httpErr.expose) {
    return new AppError(status, 'VALIDATION_ERROR', httpErr.message ?? 'Bad request');
  }
  return new AppError(500, 'INTERNAL', 'Internal server error');
}

/** Single error middleware producing the `{ error: {...}, requestId }` envelope. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appError = toAppError(err);
  if (appError.status >= 500) {
    req.log?.error({ err }, 'Unhandled error');
  }
  const body: ErrorEnvelope = {
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details ? { details: appError.details } : {}),
    },
    requestId: req.requestId,
  };
  res.status(appError.status).json(body);
};
