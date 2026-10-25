import type { ModelSelection } from "../features/ai/schema.ts";
import type { MatchingOutput } from "../features/matching/schema.ts";

// Fixed synthetic evaluation data, never imported by product code.
export const fullFlowMessages = {
  initial:
    "I want to study computer science. My annual tuition budget is 9000 EUR.",
  budget: "My annual tuition budget is 7000 EUR.",
  country: "For my study, my preferred countries are FR.",
  ambiguous: "My tuition budget is undecided.",
} as const;
export function fullFlowSelection(context: {
  task: string;
  message: string;
  matching: MatchingOutput | null;
}): ModelSelection {
  const base: ModelSelection = {
    type: "answer",
    proposals: [],
    questionId: null,
    answerKey: "profile_review",
    selections: [],
    permissionRequestIds: [],
  };
  if (context.task === "explain_recommendations" && context.matching) {
    const m = context.matching;
    return {
      ...base,
      answerKey: null,
      type: m.options.length
        ? m.options.some((o) => o.kind !== "verified_constraints")
          ? "needs_verification"
          : "recommendations"
        : m.permissionRequests.length
          ? "alternative_permission"
          : "needs_verification",
      selections: m.options.map((o) => ({
        programId: o.programId,
        intakeId: o.intakeId,
        reasonCodes: o.reasons.map((r) => r.code),
        sourceIds: [...new Set(o.reasons.flatMap((r) => r.sourceIds))],
      })),
      permissionRequestIds: m.options.length
        ? []
        : m.permissionRequests.map((p) => p.requestId),
    };
  }
  if (context.task !== "interpret_message")
    throw new Error("Unexpected fixture task.");
  if (context.message === fullFlowMessages.initial)
    base.proposals.push({
      field: "fieldOfStudy",
      valueJson: '"computer science"',
      quote: "computer science",
    });
  if (
    [fullFlowMessages.initial, fullFlowMessages.budget].some(
      (m) => m === context.message,
    )
  ) {
    const amount =
      context.message === fullFlowMessages.initial ? "9000" : "7000";
    base.proposals.push(
      { field: "budgetAmount", valueJson: amount, quote: amount },
      { field: "budgetCurrency", valueJson: '"EUR"', quote: "EUR" },
      { field: "budgetPeriod", valueJson: '"year"', quote: "annual" },
    );
  } else if (context.message === fullFlowMessages.country) {
    base.proposals.push({
      field: "preferredCountries",
      valueJson: '["FR"]',
      quote: "FR",
    });
  } else if (context.message === fullFlowMessages.ambiguous) {
    base.type = "needs_verification";
    base.answerKey = null;
  } else throw new Error("Unexpected fixture message.");
  return base;
}
