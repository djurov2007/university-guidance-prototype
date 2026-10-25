import { z } from "zod";
import { fieldKeySchema, profileValueSchemas } from "../profiles/schema.ts";
import { publicMatchingOutputSchema } from "../matching/schema.ts";

export const AI_MESSAGE_LIMIT = 8000;
export const AI_SCHEMA_VERSION = "education-ai-1";
export const AI_INSTRUCTION_VERSION = "education-instructions-2";
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/);
export const aiRequestSchema = z.strictObject({
  requestId: id,
  profileRevision: z.number().int().nonnegative(),
  task: z.enum([
    "interpret_message",
    "explain_recommendations",
    "analyze_document",
  ]),
  message: z.string().trim().min(1).max(AI_MESSAGE_LIMIT),
});
export type AiRequest = z.infer<typeof aiRequestSchema>;
export const responseTypeSchema = z.enum([
  "question",
  "answer",
  "recommendations",
  "alternative_permission",
  "out_of_scope",
  "needs_verification",
  "error",
]);
export const answerKeySchema = z.enum([
  "education_help",
  "source_transparency",
  "profile_review",
]);
export const modelSelectionSchema = z.strictObject({
  type: responseTypeSchema,
  proposals: z
    .array(
      z.strictObject({
        field: fieldKeySchema,
        valueJson: z.string().min(1).max(6000),
        quote: z.string().min(1).max(1000),
      }),
    )
    .max(8),
  questionId: id.nullable(),
  answerKey: answerKeySchema.nullable(),
  selections: z
    .array(
      z.strictObject({
        programId: id,
        intakeId: id,
        reasonCodes: z.array(id).min(1).max(30),
        sourceIds: z.array(id).max(40),
      }),
    )
    .max(3),
  permissionRequestIds: z.array(id).max(3),
});
export type ModelSelection = z.infer<typeof modelSelectionSchema>;
// Single object root, all fields required, nullable optionals, strict objects.
export const selectionJsonSchema = z.toJSONSchema(modelSelectionSchema);
export const proposalSchema = z
  .strictObject({
    id,
    field: fieldKeySchema,
    value: z.unknown(),
    status: z.literal("extracted_unconfirmed"),
    baseRevision: z.number().int().nonnegative(),
    evidence: z.string().min(1).max(1000),
  })
  .superRefine((p, ctx) => {
    if (!profileValueSchemas[p.field].safeParse(p.value).success)
      ctx.addIssue({
        code: "custom",
        message: "Invalid proposed profile field",
      });
  });
export type AiProposal = z.infer<typeof proposalSchema>;
export const aiErrorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "CONFIGURATION_ERROR",
  "LIVE_DISABLED",
  "DOCUMENT_DISABLED",
  "UNSAFE_REQUEST",
  "TIMEOUT",
  "RATE_LIMIT",
  "PROVIDER_UNAVAILABLE",
  "AUTHENTICATION",
  "MODEL_REFUSAL",
  "INCOMPLETE_RESPONSE",
  "INVALID_OUTPUT",
  "UNSUPPORTED_TASK",
  "BUDGET_EXCEEDED",
]);
export type AiErrorCode = z.infer<typeof aiErrorCodeSchema>;
export const tokenUsageSchema = z
  .strictObject({
    inputTokens: z.number().int().nonnegative().max(10000000),
    cachedInputTokens: z.number().int().nonnegative().max(10000000),
    cacheWriteTokens: z.number().int().nonnegative().max(10000000).optional(),
    outputTokens: z.number().int().nonnegative().max(10000000),
  })
  .refine(
    (v) => v.cachedInputTokens + (v.cacheWriteTokens ?? 0) <= v.inputTokens,
    "Cache read and write usage exceeds total input",
  );
export type TokenUsage = z.infer<typeof tokenUsageSchema>;
export const aiMetadataSchema = z.strictObject({
  requestId: id,
  providerRequestIds: z.array(id).max(2),
  provider: z.enum(["local", "mock", "openai"]),
  requestedModel: id.nullable(),
  returnedModel: id.nullable(),
  providerVersion: id,
  instructionVersion: z.literal(AI_INSTRUCTION_VERSION),
  schemaVersion: z.literal(AI_SCHEMA_VERSION),
  attempts: z.number().int().min(0).max(2),
  usage: tokenUsageSchema.nullable(),
  usageComplete: z.boolean(),
  estimatedCostUsd: z.number().nonnegative().nullable(),
  pricingVersion: id.nullable(),
});
export type AiMetadata = z.infer<typeof aiMetadataSchema>;
export const aiOutputSchema = z
  .strictObject({
    type: responseTypeSchema,
    message: z.string().min(1).max(1200),
    proposals: z.array(proposalSchema).max(8),
    questions: z
      .array(
        z.strictObject({
          id,
          field: fieldKeySchema,
          text: z.string().min(1).max(1000),
        }),
      )
      .max(2),
    matching: publicMatchingOutputSchema.nullable(),
    error: z
      .strictObject({ code: aiErrorCodeSchema, retryable: z.boolean() })
      .nullable(),
    metadata: aiMetadataSchema,
  })
  .superRefine((v, ctx) => {
    if ((v.type === "error") !== (v.error !== null))
      ctx.addIssue({
        code: "custom",
        message: "Error type and payload disagree",
      });
    if (v.type !== "question" && v.questions.length)
      ctx.addIssue({
        code: "custom",
        message: "Questions require question type",
      });
    const matchTypes = [
      "recommendations",
      "alternative_permission",
      "needs_verification",
    ];
    if (!matchTypes.includes(v.type) && v.matching !== null)
      ctx.addIssue({ code: "custom", message: "Unexpected matching payload" });
  });
export type AiOutput = z.infer<typeof aiOutputSchema>;
export interface EducationAiAdapter {
  run(request: unknown): Promise<AiOutput>;
}
