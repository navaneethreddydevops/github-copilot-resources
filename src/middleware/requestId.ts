import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import '../types';

export const REQUEST_ID_HEADER = 'x-request-id';
const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;

/** Reuses an incoming `x-request-id` (if well-formed) or generates a UUID, and echoes it back. */
export function requestId(): RequestHandler {
  return (req, res, next) => {
    const incoming = req.header(REQUEST_ID_HEADER);
    const id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
    req.requestId = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    next();
  };
}
