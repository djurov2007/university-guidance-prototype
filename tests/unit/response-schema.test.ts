import { describe, expect, it } from "vitest";
import { selectionSchemaForTurn } from "@/server/ai/response-schema";
import { selectionJsonSchema } from "@/features/ai/schema";
describe("server-owned turn schema", () => {
  it("cannot generate a question on a complete profile with no allowed questions", () => {
    const s = selectionSchemaForTurn(
      JSON.stringify({
        task: "interpret_message",
        questions: [],
        responseContract: {
          allowedTypes: ["answer", "needs_verification", "out_of_scope"],
          allowedQuestionIds: [],
          questionIdWhenNoQuestions: null,
        },
      }),
    );
    const type = s.properties?.type;
    expect(type && typeof type === "object" ? type.enum : []).not.toContain(
      "question",
    );
    expect(s.properties?.questionId).toEqual({ type: "null" });
  });
  it("question IDs are restricted to the provided server question IDs", () => {
    const s = selectionSchemaForTurn(
      JSON.stringify({
        task: "interpret_message",
        questions: [{ id: "study-level" }],
        responseContract: {
          allowedTypes: [
            "answer",
            "question",
            "needs_verification",
            "out_of_scope",
          ],
          allowedQuestionIds: ["study-level"],
          questionIdWhenNoQuestions: null,
        },
      }),
    );
    expect(JSON.stringify(s.properties?.questionId)).toContain('"study-level"');
    expect(JSON.stringify(s.properties?.questionId)).not.toContain(
      '"invented"',
    );
  });
  it.each(["recommendations", "needs_verification", "alternative_permission"])(
    "explanation type is constrained to %s and carries no answer/question/proposals",
    (requiredType) => {
      const s = selectionSchemaForTurn(
        JSON.stringify({
          task: "explain_recommendations",
          responseContract: {
            requiredType,
            questionId: null,
            answerKey: null,
            proposals: [],
          },
        }),
      );
      expect(s.properties?.type).toEqual({
        type: "string",
        enum: [requiredType],
      });
      expect(JSON.stringify(s)).not.toContain('"not"');
      expect(s.properties?.questionId).toEqual({ type: "null" });
      expect(s.properties?.answerKey).toEqual({ type: "null" });
      expect(s.additionalProperties).toBe(false);
    },
  );
  it("mismatched contracts fail before transport and never mutate the base schema", () => {
    const before = JSON.stringify(selectionJsonSchema);
    expect(() =>
      selectionSchemaForTurn(
        JSON.stringify({
          task: "interpret_message",
          questions: [],
          responseContract: {
            allowedTypes: ["question"],
            allowedQuestionIds: ["invented"],
            questionIdWhenNoQuestions: null,
          },
        }),
      ),
    ).toThrow();
    expect(JSON.stringify(selectionJsonSchema)).toBe(before);
  });
  it("low-level historical callers keep their base schema without a contract", () => {
    expect(selectionSchemaForTurn('{"task":"interpret_message"}')).toEqual(
      selectionJsonSchema,
    );
  });
});
