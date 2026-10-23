import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import multer from "multer";

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function pathParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const asyncRoute = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = String(req.headers["x-request-id"] ?? randomUUID());
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: error.issues.map((issue) => issue.message).join("; "), requestId } });
    return;
  }
  if (error instanceof multer.MulterError) {
    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    res.status(tooLarge ? 413 : 400).json({ error: { code: tooLarge ? "UPLOAD_TOO_LARGE" : "INVALID_UPLOAD", message: tooLarge ? "This file is larger than the configured upload limit." : "The upload could not be accepted.", requestId } });
    return;
  }
  const status = error instanceof HttpError ? error.status : 500;
  const code = error instanceof HttpError ? error.code : "INTERNAL_ERROR";
  const message = error instanceof HttpError ? error.message : "Something went wrong. Please try again.";
  if (status >= 500) console.error({ requestId, message: error instanceof Error ? error.message : String(error) });
  res.status(status).json({ error: { code, message, requestId } });
}
