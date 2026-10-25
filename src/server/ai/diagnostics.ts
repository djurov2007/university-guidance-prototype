import "server-only";
import { z } from "zod";
import { fieldKeySchema } from "../../features/profiles/schema.ts";

// Diagnostics are server-only operational data, never user/provider text.
export const diagnosticReasonSchema = z.enum([
  "RESPONSE_TOO_LARGE",
  "RESPONSE_BODY_MISSING",
  "RESPONSE_NOT_JSON",
  "WIRE_SCHEMA_MISMATCH",
  "MODEL_MISMATCH",
  "USAGE_INCONSISTENT",
  "CACHE_WRITES_UNSUPPORTED",
  "RESPONSE_STATUS_UNEXPECTED",
  "OUTPUT_ITEM_UNEXPECTED",
  "OUTPUT_CONTENT_UNEXPECTED",
  "OUTPUT_TEXT_COUNT",
  "USAGE_EXCEEDS_RESERVATION",
  "HTTP_REJECTED",
  "NETWORK_FAILURE",
  "TRANSPORT_TIMEOUT",
  "PROVIDER_RESPONSE_SCHEMA",
  "SELECTION_TEXT_BOUNDS",
  "SELECTION_NOT_JSON",
  "SELECTION_SCHEMA_MISMATCH",
  "SEMANTIC_SELECTION_REJECTED",
  "MODEL_REFUSAL",
  "RESPONSE_INCOMPLETE",
]);
export type DiagnosticReason = z.infer<typeof diagnosticReasonSchema>;
export const diagnosticFieldSchema = z.enum([
  "model",
  "status",
  "output",
  "usage",
  "other",
]);
export const semanticRuleSchema = z.enum([
  "DUPLICATE_PROPOSAL_FIELDS",
  "DUPLICATE_PERMISSION_IDS",
  "PROPOSALS_FOR_WRONG_TASK",
  "OUT_OF_SCOPE_PAYLOAD",
  "MODEL_OPERATIONAL_ERROR",
  "QUESTION_ID_FOR_WRONG_TYPE",
  "ANSWER_KEY_FOR_WRONG_TYPE",
  "PERMISSIONS_FOR_WRONG_TYPE",
  "SELECTIONS_FOR_WRONG_TYPE",
  "RECOMMENDATIONS_FOR_INTERPRETATION",
  "INACTIVE_PROFILE_FIELD",
  "QUOTE_NOT_IN_MESSAGE",
  "VALUE_NOT_JSON",
  "VALUE_SCHEMA_MISMATCH",
  "NUMBER_NOT_IN_QUOTE",
  "STRING_NOT_IN_QUOTE",
  "BUDGET_PERIOD_NOT_GROUNDED",
  "BOOLEAN_NOT_IN_QUOTE",
  "UNKNOWN_QUESTION",
  "EXPLANATION_TASK_REQUIRED",
  "PERMISSION_SET_MISMATCH",
  "SELECTION_COUNT_MISMATCH",
  "PROGRAM_ID_OR_ORDER_MISMATCH",
  "DUPLICATE_REASON_OR_SOURCE",
  "REASON_CODE_NOT_ALLOWED",
  "SOURCE_NOT_ALLOWED",
  "UNVERIFIED_RECOMMENDATION",
  "MISSING_EXISTING_OPTIONS",
  "ANSWER_KEY_MISSING",
]);
export type SemanticRule = z.infer<typeof semanticRuleSchema>;
export const aiDiagnosticSchema = z
  .strictObject({
    reason: diagnosticReasonSchema,
    httpStatus: z.number().int().min(100).max(599).optional(),
    // Byte counts are capped: never retain the bytes or a body preview/hash.
    responseBytes: z.number().int().min(0).max(65537).optional(),
    invalidFields: z.array(diagnosticFieldSchema).max(5).optional(),
    rule: semanticRuleSchema.optional(),
    field: fieldKeySchema.optional(),
    proposalIndex: z.number().int().min(0).max(7).optional(),
  })
  .superRefine((event, ctx) => {
    if (
      (event.rule !== undefined ||
        event.field !== undefined ||
        event.proposalIndex !== undefined) &&
      event.reason !== "SEMANTIC_SELECTION_REJECTED"
    )
      ctx.addIssue({
        code: "custom",
        message: "Semantic context requires a semantic reason.",
      });
    if (
      (event.field !== undefined && event.rule === undefined) ||
      (event.proposalIndex !== undefined && event.field === undefined)
    )
      ctx.addIssue({ code: "custom", message: "Incomplete semantic context." });
  });
export type AiDiagnostic = z.infer<typeof aiDiagnosticSchema>;
export const aiDiagnosticsSchema = z.array(aiDiagnosticSchema).max(4);
export type DiagnosticSink = (event: AiDiagnostic) => void;

export function safeDiagnostic(value: unknown): AiDiagnostic | null {
  const parsed = aiDiagnosticSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
export function emitDiagnostic(
  sink: DiagnosticSink | undefined,
  event: AiDiagnostic,
) {
  const safe = safeDiagnostic(event);
  if (!safe || !sink) return;
  try {
    sink(safe);
  } catch {
    /* Observability must not change validation or settlement. */
  }
}
