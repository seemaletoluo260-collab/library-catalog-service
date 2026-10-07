import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod/v4";

import mongoose from "mongoose";

import type ErrorResponse from "./interfaces/error-response.js";

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function validateBody(schema: ZodType) {
  return (req: Request, res: Response<ErrorResponse>, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "body";
        errors[field] ??= issue.message;
      }
      return res.status(400).json({ message: "Validation failed", errors });
    }
    req.body = result.data;
    next();
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response<ErrorResponse>, _next: NextFunction) {
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err instanceof Error ? err.message : "Internal server error";
  let errors: Record<string, string> | undefined;

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.fromEntries(Object.entries(err.errors).map(([field, error]) => [field, error.message]));
  }
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid value";
    errors = { [err.path]: `Invalid ${err.path}` };
  }
  else if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
    statusCode = 400;
    message = "A record with this value already exists";
    const key = "keyPattern" in err && typeof err.keyPattern === "object" && err.keyPattern !== null
      ? Object.keys(err.keyPattern)[0]
      : "value";
    errors = { [key]: `${key} must be unique` };
  }
  else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON body";
  }

  res.status(statusCode).json({ message, ...(errors ? { errors } : {}) });
}
