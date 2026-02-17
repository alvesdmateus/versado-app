import type { ZodSchema, ZodError } from "zod";
import { AppError } from "../middleware/error-handler";

/** Parse input with a Zod schema, throwing AppError on failure */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = formatZodError(result.error);
    throw new AppError(400, message, "VALIDATION_ERROR");
  }
  return result.data;
}

function formatZodError(error: ZodError): string {
  return error.issues.map((i) => i.message).join(", ");
}
