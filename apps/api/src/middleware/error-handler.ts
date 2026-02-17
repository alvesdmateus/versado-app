import type { ErrorHandler } from "hono";
import { env } from "../env";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
        code: err.code,
      },
      err.statusCode as 400
    );
  }

  // Never leak internal errors in production
  console.error("Unhandled error:", err);
  const message =
    env.NODE_ENV === "development" ? err.message : "Internal server error";

  return c.json({ error: message }, 500);
};
