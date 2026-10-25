import { describe, expect, it, vi } from "vitest";
import {
  createEducationAdapter,
  stageAiProposals,
  buildAiContext,
  mockSelection,
} from "@/server/ai/education-adapter";
import { createProfile } from "@/features/profiles/schema";
import { aiFixture, fakeAiProvider } from "@/test-fixtures/ai";
import type { ModelSelection } from "@/features/ai/schema";
import type { FieldKey } from "@/features/profiles/schema";
import type { SemanticRule } from "@/server/ai/diagnostics";
import { aiDiagnosticSchema, safeDiagnostic } from "@/server/ai/diagnostics";

const liveMessage =
  "I want to study computer science. My annual tuition budget is 9000 EUR.";
function base(): ModelSelection {
  return {
    type: "answer",
    answerKey: "profile_review",
    questionId: null,
    proposals: [],
    selections: [],
    permissionRequestIds: [],
  };
}
async function interpret(selection: ModelSelection, message = liveMessage) {
  const f = aiFixture();
  const input = { ...f.input, profile: createProfile() };
  const onDiagnostic = vi.fn();
  const result = await createEducationAdapter({
    input,
    provider: fakeAiProvider(selection),
    onDiagnostic,
  }).run({
    ...f.request,
    task: "interpret_message",
    message,
    profileRevision: input.profile.revision,
  });
  return { result, onDiagnostic, profile: input.profile };
}

describe("explicit budget period grounding", () => {
  it.each([
    ["annual", "year"],
    ["annual tuition budget", "year"],
    ["annually", "year"],
    ["yearly tuition", "year"],
    ["per annum", "year"],
    ["monthly", "month"],
    ["each month", "month"],
    ["entire degree", "total_degree"],
    ["whole degree", "total_degree"],
    ["total degree", "total_degree"],
  ])(
    "grounds explicit %s as %s without unit conversion",
    async (quote, value) => {
      const s = base();
      s.proposals = [
        { field: "budgetPeriod", valueJson: JSON.stringify(value), quote },
      ];
      const { result, onDiagnostic } = await interpret(
        s,
        `My study budget is 9000 EUR ${quote}.`,
      );
      expect(result.error).toBeNull();
      expect(result.proposals[0]?.value).toBe(value);
      expect(onDiagnostic).not.toHaveBeenCalled();
    },
  );
  it.each([
    ["monthly", "year"],
    ["annual", "month"],
    ["annual", "total_degree"],
    ["total degree", "year"],
    ["monthly or annually", "month"],
    ["monthly or annually", "year"],
    ["annual or total degree", "year"],
    ["not annual", "year"],
    ["not monthly", "month"],
    ["semester", "year"],
    ["9000 EUR", "year"],
    ["biannual", "year"],
  ])(
    "rejects unsupported, ambiguous or mismatched %s -> %s",
    async (quote, value) => {
      const s = base();
      s.proposals = [
        { field: "budgetPeriod", valueJson: JSON.stringify(value), quote },
      ];
      const { result, onDiagnostic } = await interpret(
        s,
        `My study budget: ${quote}.`,
      );
      expect(result.error?.code).toBe("INVALID_OUTPUT");
      expect(result.proposals).toEqual([]);
      expect(onDiagnostic).toHaveBeenCalledExactlyOnceWith({
        reason: "SEMANTIC_SELECTION_REJECTED",
        rule: "BUDGET_PERIOD_NOT_GROUNDED",
        field: "budgetPeriod",
        proposalIndex: 0,
      });
    },
  );
  it("accepts the literal year period without inferring other profile fields", async () => {
    const s = base();
    s.proposals = [
      { field: "budgetPeriod", valueJson: '"year"', quote: "year" },
    ];
    const { result } = await interpret(
      s,
      "My tuition budget is 9000 EUR per year.",
    );
    expect(result.error).toBeNull();
    expect(result.proposals[0]?.value).toBe("year");
  });
  it("accepts explicit annual wording from the synthetic live message as an unconfirmed year period", async () => {
    const s = base();
    s.proposals = [
      {
        field: "fieldOfStudy",
        valueJson: '"computer science"',
        quote: "computer science",
      },
      { field: "budgetAmount", valueJson: "9000", quote: "9000" },
      { field: "budgetCurrency", valueJson: '"EUR"', quote: "EUR" },
      { field: "budgetPeriod", valueJson: '"year"', quote: "annual" },
    ];
    const { result, profile } = await interpret(s);
    expect(result.error).toBeNull();
    expect(result.proposals).toHaveLength(4);
    expect(profile.fields.budgetPeriod.status).toBe("missing");
    const staged = stageAiProposals(profile, result);
    expect(staged.ok).toBe(true);
    if (staged.ok) {
      expect(staged.state.fields.budgetPeriod.status).toBe(
        "extracted_unconfirmed",
      );
      expect(staged.state.fields.budgetPeriod.value).toBe("year");
    }
  });
});

describe("specific proposal failure rules", () => {
  const cases: [string, FieldKey, string, string, SemanticRule][] = [
    [
      "inactive field",
      "phdTopic",
      '"computer science"',
      "computer science",
      "INACTIVE_PROFILE_FIELD",
    ],
    [
      "invented quote",
      "budgetAmount",
      "9000",
      "PRIVATE_UNQUOTED_SENTINEL",
      "QUOTE_NOT_IN_MESSAGE",
    ],
    [
      "invalid value JSON",
      "budgetAmount",
      "PRIVATE_INVALID_JSON",
      "9000",
      "VALUE_NOT_JSON",
    ],
    [
      "wrong value schema",
      "budgetCurrency",
      '"XYZ"',
      "EUR",
      "VALUE_SCHEMA_MISMATCH",
    ],
    ["invented number", "budgetAmount", "9500", "9000", "NUMBER_NOT_IN_QUOTE"],
    [
      "invented subject",
      "fieldOfStudy",
      '"engineering"',
      "computer science",
      "STRING_NOT_IN_QUOTE",
    ],
    [
      "unsupported boolean",
      "budgetIncludesLiving",
      "true",
      "9000",
      "BOOLEAN_NOT_IN_QUOTE",
    ],
    [
      "no implicit undergraduate synonym",
      "studyLevel",
      '"undergraduate"',
      "computer science",
      "STRING_NOT_IN_QUOTE",
    ],
  ];
  it.each(cases)(
    "names %s and the field without copying payload",
    async (_label, field, valueJson, quote, rule) => {
      const s = base();
      s.proposals = [{ field, valueJson, quote }];
      const { result, onDiagnostic, profile } = await interpret(s);
      expect(result.error?.code).toBe("INVALID_OUTPUT");
      expect(result.proposals).toEqual([]);
      expect(onDiagnostic).toHaveBeenCalledExactlyOnceWith({
        reason: "SEMANTIC_SELECTION_REJECTED",
        rule,
        field,
        proposalIndex: 0,
      });
      expect(JSON.stringify(onDiagnostic.mock.calls)).not.toContain("PRIVATE_");
      expect(profile.fields.budgetAmount.status).toBe("missing");
    },
  );
  it("does not accept an annual quote that is absent from the message", async () => {
    const s = base();
    s.proposals = [
      { field: "budgetPeriod", valueJson: '"year"', quote: "annual" },
    ];
    const { result, onDiagnostic } = await interpret(
      s,
      "My study budget is 9000 EUR.",
    );
    expect(result.error?.code).toBe("INVALID_OUTPUT");
    expect(onDiagnostic).toHaveBeenCalledWith({
      reason: "SEMANTIC_SELECTION_REJECTED",
      rule: "QUOTE_NOT_IN_MESSAGE",
      field: "budgetPeriod",
      proposalIndex: 0,
    });
  });
  it("rejects a mixed batch atomically and identifies the rejected proposal position", async () => {
    const s = base();
    s.proposals = [
      { field: "budgetAmount", valueJson: "9000", quote: "9000" },
      { field: "budgetPeriod", valueJson: '"month"', quote: "annual" },
    ];
    const { result, onDiagnostic, profile } = await interpret(s);
    expect(result.proposals).toEqual([]);
    expect(profile.fields.budgetAmount.status).toBe("missing");
    expect(onDiagnostic).toHaveBeenCalledExactlyOnceWith({
      reason: "SEMANTIC_SELECTION_REJECTED",
      rule: "BUDGET_PERIOD_NOT_GROUNDED",
      field: "budgetPeriod",
      proposalIndex: 1,
    });
  });
});

describe("response coupling and grounding rules", () => {
  it("does not let a model relabel unverified institutional checks as verified recommendations", async () => {
    const f = aiFixture();
    f.input.catalog.programs[0]!.rules[0]!.proof.status = "unknown";
    const context = buildAiContext(f.input);
    expect(context.matching.options).toHaveLength(1);
    expect(context.matching.options[0]!.kind).not.toBe("verified_constraints");
    const s = mockSelection(context, "explain_recommendations");
    s.type = "recommendations";
    const onDiagnostic = vi.fn();
    const result = await createEducationAdapter({
      input: f.input,
      provider: fakeAiProvider(s),
      onDiagnostic,
    }).run(f.request);
    expect(result.error?.code).toBe("INVALID_OUTPUT");
    expect(onDiagnostic).toHaveBeenCalledExactlyOnceWith({
      reason: "SEMANTIC_SELECTION_REJECTED",
      rule: "UNVERIFIED_RECOMMENDATION",
    });
  });
  const cases: [string, (s: ModelSelection) => void, SemanticRule][] = [
    [
      "duplicate proposals",
      (s) => {
        s.proposals = Array.from({ length: 2 }, () => ({
          field: "budgetAmount",
          valueJson: "9000",
          quote: "9000",
        }));
      },
      "DUPLICATE_PROPOSAL_FIELDS",
    ],
    [
      "duplicate permissions",
      (s) => {
        s.permissionRequestIds = ["p", "p"];
      },
      "DUPLICATE_PERMISSION_IDS",
    ],
    [
      "out of scope payload",
      (s) => {
        s.type = "out_of_scope";
        s.answerKey = null;
        s.proposals = [
          { field: "budgetAmount", valueJson: "9000", quote: "9000" },
        ];
      },
      "OUT_OF_SCOPE_PAYLOAD",
    ],
    [
      "operational error",
      (s) => {
        s.type = "error";
        s.answerKey = null;
      },
      "MODEL_OPERATIONAL_ERROR",
    ],
    [
      "question/type mismatch",
      (s) => {
        s.questionId = "private-invalid-question";
      },
      "QUESTION_ID_FOR_WRONG_TYPE",
    ],
    [
      "answer/type mismatch",
      (s) => {
        s.type = "needs_verification";
      },
      "ANSWER_KEY_FOR_WRONG_TYPE",
    ],
    [
      "permission/type mismatch",
      (s) => {
        s.permissionRequestIds = ["ungranted"];
      },
      "PERMISSIONS_FOR_WRONG_TYPE",
    ],
    [
      "selection/type mismatch",
      (s) => {
        s.selections = aiFixture().selection.selections;
      },
      "SELECTIONS_FOR_WRONG_TYPE",
    ],
    [
      "recommendation during interpretation",
      (s) => {
        s.type = "recommendations";
        s.answerKey = null;
      },
      "RECOMMENDATIONS_FOR_INTERPRETATION",
    ],
    [
      "unknown question",
      (s) => {
        s.type = "question";
        s.answerKey = null;
        s.questionId = "unknown-question";
      },
      "UNKNOWN_QUESTION",
    ],
    [
      "missing answer key",
      (s) => {
        s.answerKey = null;
      },
      "ANSWER_KEY_MISSING",
    ],
  ];
  it.each(cases)("identifies %s", async (_label, mutate, rule) => {
    const s = base();
    mutate(s);
    const { result, onDiagnostic } = await interpret(s);
    expect(result.error?.code).toBe("INVALID_OUTPUT");
    expect(onDiagnostic).toHaveBeenCalledExactlyOnceWith({
      reason: "SEMANTIC_SELECTION_REJECTED",
      rule,
    });
  });
  const matchingCases: [string, (s: ModelSelection) => void, SemanticRule][] = [
    [
      "proposal in explanation",
      (s) => {
        s.proposals = [
          { field: "budgetAmount", valueJson: "9000", quote: "9000" },
        ];
      },
      "PROPOSALS_FOR_WRONG_TASK",
    ],
    [
      "wrong selection count",
      (s) => {
        s.selections = [];
      },
      "SELECTION_COUNT_MISMATCH",
    ],
    [
      "invented programme",
      (s) => {
        s.selections[0]!.programId = "invented";
      },
      "PROGRAM_ID_OR_ORDER_MISMATCH",
    ],
    [
      "duplicated sources",
      (s) => {
        s.selections[0]!.sourceIds = ["synthetic-source", "synthetic-source"];
      },
      "DUPLICATE_REASON_OR_SOURCE",
    ],
    [
      "invented reason",
      (s) => {
        s.selections[0]!.reasonCodes = ["guaranteed-admission"];
      },
      "REASON_CODE_NOT_ALLOWED",
    ],
    [
      "invented source",
      (s) => {
        s.selections[0]!.sourceIds = ["invented-source"];
      },
      "SOURCE_NOT_ALLOWED",
    ],
    [
      "hiding visible options",
      (s) => {
        s.type = "needs_verification";
        s.selections = [];
      },
      "MISSING_EXISTING_OPTIONS",
    ],
    [
      "ungranted alternative",
      (s) => {
        s.type = "alternative_permission";
        s.selections = [];
        s.permissionRequestIds = ["ungranted"];
      },
      "PERMISSION_SET_MISMATCH",
    ],
  ];
  it.each(matchingCases)(
    "retains rejection of %s",
    async (_label, mutate, rule) => {
      const f = aiFixture();
      const s = structuredClone(f.selection);
      mutate(s);
      const onDiagnostic = vi.fn();
      const result = await createEducationAdapter({
        input: f.input,
        provider: fakeAiProvider(s),
        onDiagnostic,
      }).run(f.request);
      expect(result.error?.code).toBe("INVALID_OUTPUT");
      expect(result.proposals).toEqual([]);
      expect(onDiagnostic).toHaveBeenCalledExactlyOnceWith({
        reason: "SEMANTIC_SELECTION_REJECTED",
        rule,
      });
      expect(result.metadata).not.toHaveProperty("diagnostics");
    },
  );
  it("keeps a supplied valid question and explicit annual proposal together without guessing education level", async () => {
    const f = aiFixture();
    const input = { ...f.input, profile: createProfile() };
    const s = mockSelection(buildAiContext(input), "interpret_message");
    s.proposals = [
      { field: "budgetPeriod", valueJson: '"year"', quote: "annual" },
    ];
    const result = await createEducationAdapter({
      input,
      provider: fakeAiProvider(s),
    }).run({
      ...f.request,
      task: "interpret_message",
      message: liveMessage,
      profileRevision: 0,
    });
    expect(result.type).toBe("question");
    expect(result.proposals).toHaveLength(1);
    expect(result.questions).toHaveLength(1);
    expect(result.proposals.some((p) => p.field === "studyLevel")).toBe(false);
  });
});

describe("semantic diagnostic privacy", () => {
  it.each([
    { reason: "SEMANTIC_SELECTION_REJECTED", rule: "PRIVATE_RULE" },
    {
      reason: "SEMANTIC_SELECTION_REJECTED",
      rule: "STRING_NOT_IN_QUOTE",
      field: "PRIVATE_FIELD",
    },
    {
      reason: "SEMANTIC_SELECTION_REJECTED",
      rule: "STRING_NOT_IN_QUOTE",
      field: "fieldOfStudy",
      proposalIndex: 8,
    },
    { reason: "MODEL_MISMATCH", rule: "STRING_NOT_IN_QUOTE" },
    { reason: "SEMANTIC_SELECTION_REJECTED", field: "fieldOfStudy" },
    {
      reason: "SEMANTIC_SELECTION_REJECTED",
      rule: "STRING_NOT_IN_QUOTE",
      proposalIndex: 0,
    },
    {
      reason: "SEMANTIC_SELECTION_REJECTED",
      rule: "STRING_NOT_IN_QUOTE",
      quote: "PRIVATE_PAYLOAD",
    },
  ])("rejects untrusted/inconsistent diagnostic context %#", (event) => {
    expect(aiDiagnosticSchema.safeParse(event).success).toBe(false);
    expect(safeDiagnostic(event)).toBeNull();
  });
});
