import "server-only";
import { z } from "zod";
import {
  modelSelectionSchema,
  selectionJsonSchema,
} from "../../features/ai/schema.ts";
import { ProviderError } from "./provider.ts";

// Narrow the transport schema to the server-authored turn contract.
// Existing semantic validation still checks every returned value, ID and source.
export function selectionSchemaForTurn(contextJson: string) {
  try {
    const context = z
      .object({
        task: z.string().optional(),
        responseContract: z.unknown().optional(),
        questions: z
          .array(z.object({ id: z.string().min(1).max(120) }))
          .max(2)
          .optional(),
      })
      .parse(JSON.parse(contextJson));
    // Compatibility for low-level callers without an application turn contract.
    if (
      context.responseContract === undefined ||
      context.responseContract === null
    )
      return selectionJsonSchema;
    if (context.task === "explain_recommendations") {
      const contract = z
        .object({
          requiredType: z.enum([
            "recommendations",
            "needs_verification",
            "alternative_permission",
          ]),
          questionId: z.null(),
          answerKey: z.null(),
          proposals: z.array(z.never()).length(0),
        })
        .strict()
        .parse(context.responseContract);
      return z.toJSONSchema(
        modelSelectionSchema.extend({
          type: z.enum([contract.requiredType]),
          questionId: z.null(),
          answerKey: z.null(),
          proposals: modelSelectionSchema.shape.proposals.length(0),
        }),
      );
    }
    if (context.task !== "interpret_message")
      throw new Error("Unsupported turn contract.");
    const contract = z
      .object({
        allowedTypes: z
          .array(
            z.enum([
              "answer",
              "question",
              "needs_verification",
              "out_of_scope",
            ]),
          )
          .min(1),
        allowedQuestionIds: z.array(z.string()).max(2),
        questionIdWhenNoQuestions: z.null(),
      })
      .strict()
      .parse(context.responseContract);
    const ids = context.questions?.map((q) => q.id) ?? [];
    const types = ids.length
      ? (["answer", "question", "needs_verification", "out_of_scope"] as const)
      : (["answer", "needs_verification", "out_of_scope"] as const);
    if (
      JSON.stringify(ids) !== JSON.stringify(contract.allowedQuestionIds) ||
      JSON.stringify(types) !== JSON.stringify(contract.allowedTypes)
    )
      throw new Error("Turn contract mismatch.");
    return z.toJSONSchema(
      modelSelectionSchema.extend({
        type: z.enum(types),
        questionId: ids.length ? z.enum(ids).nullable() : z.null(),
      }),
    );
  } catch {
    throw new ProviderError("INVALID_REQUEST");
  }
}
