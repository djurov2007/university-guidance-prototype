import "server-only";
import { z } from "zod";

const configSchema = z.strictObject({
  provider: z.enum(["mock", "openai"]).default("mock"),
  model: z.enum(["gpt-6-luna", "gpt-6.1-sol"]).default("gpt-6-luna"),
  liveApproved: z.boolean().default(false),
  documentAnalysisEnabled: z.literal(false).default(false),
  timeoutMs: z.number().int().min(10).max(30000).default(12000),
  maxOutputTokens: z.number().int().min(128).max(4000).default(1600),
  maxRetries: z.number().int().min(0).max(1).default(0),
  retryDelayMs: z.number().int().min(0).max(1000).default(250),
  maxCostUsd: z.number().positive().max(0.1).default(0.01),
});
export type AiConfig = z.infer<typeof configSchema>;
export function parseAiConfig(input: unknown): AiConfig {
  const result = configSchema.safeParse(input);
  if (!result.success) throw new Error("Invalid AI server configuration.");
  return result.data;
}
export function readAiConfig(): AiConfig {
  const bool = (value: string | undefined) =>
    value === undefined
      ? undefined
      : value === "true"
        ? true
        : value === "false"
          ? false
          : value;
  return parseAiConfig({
    provider: process.env.AI_PROVIDER,
    model: process.env.AI_MODEL,
    liveApproved: bool(process.env.AI_LIVE_APPROVED),
    documentAnalysisEnabled: bool(process.env.AI_DOCUMENT_ANALYSIS),
  });
}
