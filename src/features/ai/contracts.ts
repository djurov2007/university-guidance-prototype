import { z } from "zod";
import { appErrorSchema, type Result } from "@/domain/result";

// Diagnostic contract, not a chat/recommendation API. Reject arbitrary input.
export const diagnosticRequestSchema = z
  .object({
    fixtureId: z.literal("SYN-UG-01"),
  })
  .strict();

export const diagnosticDataSchema = z
  .object({
    mode: z.literal("mock"),
    fixtureId: z.literal("SYN-UG-01"),
    synthetic: z.literal(true),
    catalogCount: z.literal(0),
    message: z.literal(
      "Mock adapter is ready. No external AI or database was used.",
    ),
  })
  .strict();

export const diagnosticResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), data: diagnosticDataSchema }).strict(),
  z.object({ ok: z.literal(false), error: appErrorSchema }).strict(),
]);

export type DiagnosticRequest = z.infer<typeof diagnosticRequestSchema>;
export type DiagnosticData = z.infer<typeof diagnosticDataSchema>;
export interface AiAdapter {
  diagnose(request: DiagnosticRequest): Promise<Result<DiagnosticData>>;
}
