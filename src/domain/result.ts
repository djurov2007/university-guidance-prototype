import { z } from "zod";

export const appErrorSchema = z
  .object({
    code: z.enum([
      "INVALID_REQUEST",
      "CONFIGURATION_ERROR",
      "NOT_IMPLEMENTED",
      "INTERNAL_ERROR",
    ]),
    message: z.string().min(1).max(240),
  })
  .strict();

export type AppError = z.infer<typeof appErrorSchema>;
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export function failure(
  code: AppError["code"],
  message: string,
): Result<never> {
  return { ok: false, error: { code, message } };
}
