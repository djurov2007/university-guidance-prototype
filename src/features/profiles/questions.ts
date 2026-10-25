import { z } from "zod";
import {
  fieldKeys,
  fieldKeySchema,
  trustedValue,
  type FieldKey,
  type ProfileState,
} from "./schema.ts";

export const questionGroupSchema = z.enum([
  "general",
  "bachelor",
  "master",
  "phd",
  "finance",
  "language",
  "location",
  "qualifications",
  "additional_clarifications",
]);
const conditionSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("always") }),
  z.strictObject({
    kind: z.literal("levels"),
    levels: z.array(z.enum(["undergraduate", "master", "phd"])).min(1),
  }),
  z.strictObject({ kind: z.literal("master_change") }),
  z.strictObject({ kind: z.literal("budget_known") }),
  z.strictObject({ kind: z.literal("review") }),
  z.strictObject({ kind: z.literal("conflict") }),
]);
export type QuestionCondition = z.infer<typeof conditionSchema>;
export const questionSchema = z.strictObject({
  id: z.string().regex(/^[a-zA-Z0-9-]+$/),
  version: z.literal(1),
  group: questionGroupSchema,
  purpose: z.string().min(1),
  prompt: z.string().min(1),
  when: conditionSchema,
  answerType: z.string().min(1),
  field: fieldKeySchema,
  requiredForRecommendations: z.boolean(),
  requiredWhen: conditionSchema,
  followUp: z.string().nullable(),
  conflictRule: z.enum([
    "request_confirmation",
    "confirm_proposal",
    "resolve_lists",
  ]),
  priority: z.number().int().nonnegative(),
  kind: z.enum(["answer", "confirm", "resolve", "country_conflict"]),
});
export type GoldenQuestion = z.infer<typeof questionSchema>;
const always: QuestionCondition = { kind: "always" };
const levels = (
  ...values: ("undergraduate" | "master" | "phd")[]
): QuestionCondition => ({ kind: "levels", levels: values });
function question(
  field: FieldKey,
  group: GoldenQuestion["group"],
  priority: number,
  prompt: string,
  required = false,
  when: QuestionCondition = always,
  requiredWhen: QuestionCondition = when,
): GoldenQuestion {
  return {
    id: `ask-${field}`,
    version: 1,
    group,
    purpose: `Record ${field} without inferring a value.`,
    prompt,
    when,
    answerType: `profile.${field}`,
    field,
    requiredForRecommendations: required,
    requiredWhen,
    followUp: null,
    conflictRule: "request_confirmation",
    priority,
    kind: "answer",
  };
}
const base = [
  question(
    "studyLevel",
    "general",
    10,
    "Which level are you looking for: a bachelor's, master's or PhD?",
    true,
  ),
  question(
    "fieldOfStudy",
    "general",
    20,
    "Which subject or study field would you like to explore?",
    true,
  ),
  question(
    "studyGoal",
    "general",
    30,
    "What would you like this degree to help you do?",
    true,
  ),
  question(
    "preferredCountries",
    "location",
    40,
    "Which countries in Serbia or the EU would you prefer? An empty list means no country preference.",
    true,
  ),
  question(
    "excludedCountries",
    "location",
    41,
    "Are there any countries in Serbia or the EU you want to exclude? You can explicitly choose none.",
  ),
  question(
    "teachingLanguages",
    "language",
    50,
    "Which teaching languages can you study in? The interface language does not decide this.",
    true,
  ),
  question(
    "budgetAmount",
    "finance",
    60,
    "What budget amount can you afford? We will clarify its currency, period and living-cost coverage separately.",
    true,
  ),
  {
    ...question(
      "budgetCurrency",
      "finance",
      61,
      "What currency is that budget in: EUR, RSD, USD, GBP or CHF?",
      true,
      { kind: "budget_known" },
    ),
    requiredWhen: always,
  },
  {
    ...question(
      "budgetPeriod",
      "finance",
      62,
      "Is that amount per month, per year or for the whole degree?",
      true,
      { kind: "budget_known" },
    ),
    requiredWhen: always,
  },
  {
    ...question(
      "budgetIncludesLiving",
      "finance",
      63,
      "Does that amount include living costs, or is it for tuition only?",
      true,
      { kind: "budget_known" },
    ),
    requiredWhen: always,
  },
  question(
    "scholarshipNeed",
    "finance",
    70,
    "Is a scholarship required, preferred or unnecessary for you?",
    true,
  ),
  question(
    "startYear",
    "general",
    80,
    "In which year do you want to start studying?",
    true,
  ),
  question(
    "previousQualification",
    "qualifications",
    90,
    "What is your most recent qualification, study field, country and completion status? Add the institution and credits only if you know them.",
    true,
  ),
  question(
    "hardConstraints",
    "additional_clarifications",
    100,
    "Which requirements are firm: only your preferred countries, only your listed teaching languages and a maximum budget? Keep flexible preferences separate.",
    true,
  ),
  question(
    "masterIntent",
    "master",
    95,
    "For your master's, are you specialising, changing field or preparing for research?",
    true,
    levels("master"),
  ),
  question(
    "relevantSubjects",
    "master",
    110,
    "Which relevant subjects have you studied before changing field? Include results or credits only if known; you can explicitly report none.",
    true,
    levels("master"),
    { kind: "master_change" },
  ),
  {
    ...question(
      "relevantSubjects",
      "bachelor",
      111,
      "Which school subjects relate to your intended bachelor's? Add results only if known; you can explicitly report none.",
      false,
      levels("undergraduate"),
    ),
    id: "ask-bachelorSubjects",
  },
  question(
    "phdTopic",
    "phd",
    94,
    "What research topic or question would you like to work on?",
    true,
    levels("phd"),
  ),
  question(
    "phdFunding",
    "phd",
    95,
    "Do you need full funding, partial funding, self-funding or either route?",
    true,
    levels("phd"),
  ),
  question(
    "phdPositionType",
    "phd",
    96,
    "Are you seeking an employed PhD position, a scholarship position, an open doctoral programme or either?",
    true,
    levels("phd"),
  ),
  question(
    "researchExperience",
    "phd",
    97,
    "What research experience do you have? You can explicitly report none.",
    true,
    levels("undergraduate", "master", "phd"),
    levels("phd"),
  ),
  question(
    "interests",
    "general",
    120,
    "What related subjects or interests would help narrow your choices?",
  ),
  question(
    "languageResults",
    "language",
    121,
    "Do you have language-test results? Record the test, score scale and date if known, or explicitly report none.",
  ),
  question(
    "professionalExperience",
    "qualifications",
    122,
    "What relevant professional experience would you like to add? You can explicitly report none.",
  ),
  question(
    "orientation",
    "general",
    123,
    "Would you prefer an academic, practical or balanced programme, or are you unsure?",
  ),
  question(
    "phdFocus",
    "phd",
    124,
    "Is the supervisor, project or institution your main PhD priority, or do you have no preference?",
    false,
    levels("phd"),
  ),
  question(
    "researchProposal",
    "phd",
    125,
    "Do you already have a research proposal: ready, draft, not started or none?",
    false,
    levels("phd"),
  ),
  question(
    "flexiblePreferences",
    "additional_clarifications",
    126,
    "What preferences could you adjust? This does not relax an institution's requirements.",
  ),
];
base.find((q) => q.field === "budgetAmount")!.followUp = "ask-budgetCurrency";
base.find((q) => q.field === "budgetCurrency")!.followUp = "ask-budgetPeriod";
base.find((q) => q.field === "budgetPeriod")!.followUp =
  "ask-budgetIncludesLiving";
base.find((q) => q.field === "masterIntent")!.followUp = "ask-relevantSubjects";
const reviews = fieldKeys.flatMap((field) => [
  {
    ...question(
      field,
      "additional_clarifications",
      2,
      `Review the proposed value for ${field}. Confirm a specific proposal, reject it or give your own correction.`,
    ),
    requiredForRecommendations: base.find((q) => q.field === field)!
      .requiredForRecommendations,
    requiredWhen: base.find((q) => q.field === field)!.requiredWhen,
    id: `confirm-${field}`,
    when: { kind: "review" } as const,
    answerType: "proposal_choice",
    conflictRule: "confirm_proposal" as const,
    kind: "confirm" as const,
  },
  {
    ...question(
      field,
      "additional_clarifications",
      1,
      `Your answers for ${field} disagree. Which value should we keep? You can also explicitly correct the answer.`,
    ),
    requiredForRecommendations: base.find((q) => q.field === field)!
      .requiredForRecommendations,
    requiredWhen: base.find((q) => q.field === field)!.requiredWhen,
    id: `resolve-${field}`,
    when: { kind: "conflict" } as const,
    answerType: "candidate_choice",
    kind: "resolve" as const,
  },
]);
const countryConflict: GoldenQuestion = {
  ...question(
    "preferredCountries",
    "additional_clarifications",
    0,
    "Some preferred countries are also excluded. Confirm both lists so that they do not overlap.",
    true,
  ),
  id: "clarify-countries",
  kind: "country_conflict",
  when: { kind: "conflict" },
  answerType: "country_lists",
  conflictRule: "resolve_lists",
};
const semanticClarifications = (
  [
    "preferredCountries",
    "hardConstraints",
    "phdFunding",
    "scholarshipNeed",
    "startYear",
  ] as const
).map((field) => ({
  ...question(
    field,
    "additional_clarifications",
    1,
    `Explicitly correct ${field} to resolve the stated conflict. No replacement is assumed.`,
    true,
  ),
  id: `clarify-${field}`,
  when: { kind: "conflict" } as const,
  kind: "resolve" as const,
}));
export const goldenQuestionConfig = {
  schemaVersion: 1 as const,
  version: "1.0.0",
  maxQuestionsPerTurn: 2 as const,
  maxPresentations: 24 as const,
  maxAttemptsPerContext: 2 as const,
  questions: [
    ...base,
    ...reviews,
    ...semanticClarifications,
    countryConflict,
  ].map((q) => questionSchema.parse(q)),
};
const ids = new Set(goldenQuestionConfig.questions.map((q) => q.id));
if (
  ids.size !== goldenQuestionConfig.questions.length ||
  goldenQuestionConfig.questions.some((q) => q.followUp && !ids.has(q.followUp))
)
  throw new Error("Invalid golden question references");
export function conditionApplies(
  condition: QuestionCondition,
  state: ProfileState,
): boolean {
  switch (condition.kind) {
    case "always":
      return true;
    case "levels":
      return condition.levels.includes(trustedValue(state, "studyLevel")!);
    case "master_change":
      return (
        trustedValue(state, "studyLevel") === "master" &&
        trustedValue(state, "masterIntent") === "change_field"
      );
    case "budget_known":
      return state.fields.budgetAmount.status !== "missing";
    case "review":
    case "conflict":
      return false; // Evaluated against a specific field by the selector.
  }
}
export function activeFields(state: ProfileState): FieldKey[] {
  const level = trustedValue(state, "studyLevel");
  return fieldKeys.filter(
    (key) =>
      !(
        [
          "phdTopic",
          "phdFunding",
          "phdPositionType",
          "phdFocus",
          "researchProposal",
        ].includes(key) && level !== "phd"
      ) && !(key === "masterIntent" && level !== "master"),
  );
}
export function requiredFields(state: ProfileState): FieldKey[] {
  return base
    .filter(
      (q) =>
        q.requiredForRecommendations && conditionApplies(q.requiredWhen, state),
    )
    .map((q) => q.field);
}
