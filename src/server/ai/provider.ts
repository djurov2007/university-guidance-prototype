import "server-only";
import { z } from "zod";
import { tokenUsageSchema } from "../../features/ai/schema.ts";
import type { AiErrorCode, TokenUsage } from "../../features/ai/schema.ts";
import { safeDiagnostic, type AiDiagnostic } from "./diagnostics.ts";

export interface ProviderRequest {
  requestId: string;
  contextJson: string;
  instructions: string;
  maxOutputTokens: number;
  timeoutMs: number;
  maxCostUsd: number;
}
export interface ProviderResponse {
  status: "completed" | "refused" | "incomplete";
  text: string | null;
  model: string;
  requestId: string | null;
  usage: TokenUsage | null;
}
export interface AiProvider {
  readonly kind: "mock" | "openai";
  readonly model: string;
  readonly version: string;
  generate(
    request: ProviderRequest,
    signal: AbortSignal,
  ): Promise<ProviderResponse>;
}
export const providerResponseSchema = z.strictObject({
  status: z.enum(["completed", "refused", "incomplete"]),
  text: z.string().max(32000).nullable(),
  model: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/),
  requestId: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/)
    .nullable(),
  usage: tokenUsageSchema.nullable(),
});
export class ProviderError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;
  readonly providerRequestId: string | null;
  readonly diagnostic: AiDiagnostic | null;
  constructor(
    code: AiErrorCode,
    retryable = false,
    requestId: string | null = null,
    diagnostic?: AiDiagnostic,
  ) {
    super(code);
    this.name = "ProviderError";
    this.code = code;
    this.retryable = retryable;
    this.diagnostic = safeDiagnostic(diagnostic);
    this.providerRequestId =
      requestId && /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/.test(requestId)
        ? requestId
        : null;
  }
}
// Future server quota implementation owns reservation/settlement, never the model.
export interface SpendGuard {
  reserve(input: {
    requestId: string;
    maximumUsd: number;
    maximumTokens?: number;
  }): Promise<string | null>;
  settle(input: {
    reservationId: string;
    estimatedUsd: number | null;
    outcome: "completed" | "unknown";
    actualTokens?: number | null;
  }): Promise<void>;
}
