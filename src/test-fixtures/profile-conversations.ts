import {
  createProfile,
  type FieldKey,
  type ProfileState,
  type ProfileValues,
} from "../features/profiles/schema.ts";
import { applyProfileEvent } from "../features/profiles/state.ts";
import {
  advanceConversation,
  type ConversationTurn,
} from "../features/profiles/engine.ts";

export interface FixtureCommand {
  type: string;
  field?: FieldKey;
  value?: unknown;
  mode?: "assert" | "replace";
  origin?: "text_extraction" | "document" | "model";
  sourceRef?: string;
  preferredCountries?: string[];
  excludedCountries?: string[];
}
export interface FixtureStep {
  message: string;
  commands: FixtureCommand[];
}
export interface ProfileConversation {
  id: string;
  synthetic: true;
  adult: true;
  title: string;
  expected: ConversationTurn["status"];
  steps: FixtureStep[];
}
const qualification = {
  kind: "secondary",
  field: "General secondary education",
  institution: null,
  country: "RS",
  completion: "completed",
  completionYear: 2026,
  credits: null,
} as const;
export const undergraduateAnswers: Partial<ProfileValues> = {
  studyLevel: "undergraduate",
  fieldOfStudy: "Computer science",
  studyGoal: "Prepare for software engineering work",
  preferredCountries: ["DE", "NL"],
  teachingLanguages: ["english"],
  budgetAmount: 10000,
  budgetCurrency: "EUR",
  budgetPeriod: "year",
  budgetIncludesLiving: true,
  scholarshipNeed: "preferred",
  startYear: 2027,
  previousQualification: qualification,
  hardConstraints: {
    countries: "only_preferred",
    languages: "only_listed",
    budget: "hard_maximum",
    other: [],
  },
};
export function answerCommands(
  values: Partial<ProfileValues>,
  mode: "assert" | "replace" = "assert",
): FixtureCommand[] {
  return Object.entries(values).map(([field, value]) => ({
    type: "user_answer",
    field: field as FieldKey,
    value,
    mode,
  }));
}
function without(
  values: Partial<ProfileValues>,
  ...keys: FieldKey[]
): Partial<ProfileValues> {
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => !keys.includes(key as FieldKey)),
  );
}
const baseStep: FixtureStep = {
  message:
    "I am an adult. Here are my structured answers: a computer science bachelor's, software engineering goal, Germany or the Netherlands only, English teaching only, EUR 10,000 per year including living costs as a firm maximum, a scholarship preferred, 2027 start, completed Serbian general secondary education in 2026. No additional hard requirements.",
  commands: answerCommands(undergraduateAnswers),
};
const masterAnswers: Partial<ProfileValues> = {
  ...undergraduateAnswers,
  studyLevel: "master",
  fieldOfStudy: "Data science",
  studyGoal: "Change from economics to data science",
  previousQualification: {
    ...qualification,
    kind: "bachelor",
    field: "Economics",
    completionYear: 2025,
    credits: { amount: 180, system: "ECTS", label: "Self-reported ECTS" },
  },
  masterIntent: "change_field",
};
const phdAnswers: Partial<ProfileValues> = {
  ...undergraduateAnswers,
  studyLevel: "phd",
  fieldOfStudy: "Machine learning",
  studyGoal: "Research reliable learning systems",
  scholarshipNeed: "required",
  previousQualification: {
    ...qualification,
    kind: "master",
    field: "Computer science",
    completionYear: 2026,
  },
  phdTopic: "Robustness of learning systems",
  phdFunding: "fully_funded",
  phdPositionType: "employed_position",
  researchExperience: ["Synthetic master's research project"],
};
export const profileConversations: ProfileConversation[] = [
  {
    id: "PROFILE-UG",
    synthetic: true,
    adult: true,
    title: "Bachelor's profile",
    expected: "ready_limited",
    steps: [
      {
        message:
          "I am an adult seeking a computer science bachelor's for software engineering work in Germany or the Netherlands, starting in 2027.",
        commands: answerCommands({
          studyLevel: "undergraduate",
          fieldOfStudy: "Computer science",
          studyGoal: undergraduateAnswers.studyGoal!,
          preferredCountries: undergraduateAnswers.preferredCountries!,
          startYear: 2027,
        }),
      },
      {
        ...baseStep,
        commands: answerCommands(
          without(
            undergraduateAnswers,
            "studyLevel",
            "fieldOfStudy",
            "studyGoal",
            "preferredCountries",
            "startYear",
          ),
        ),
      },
    ],
  },
  {
    id: "PROFILE-MASTER-CHANGE",
    synthetic: true,
    adult: true,
    title: "Master's field change",
    expected: "ready_limited",
    steps: [
      {
        message:
          "I am an adult switching from economics to data science for a master's. These structured answers include the same stated budget, countries, language and start year as the synthetic bachelor's example, and my completed economics bachelor's: 180 self-reported ECTS in Serbia in 2025.",
        commands: answerCommands(masterAnswers),
      },
      {
        message:
          "I studied statistics and linear algebra; credits and results are not available here.",
        commands: answerCommands({
          relevantSubjects: [
            { name: "Statistics", result: null, credits: null },
            { name: "Linear algebra", result: null, credits: null },
          ],
        }),
      },
    ],
  },
  {
    id: "PROFILE-PHD-FUNDED",
    synthetic: true,
    adult: true,
    title: "Funded PhD position",
    expected: "ready_limited",
    steps: [
      {
        message:
          "I am an adult. My structured answers seek machine learning research, full funding and an employed PhD position; a scholarship is required. My topic is robustness of learning systems and I have a synthetic master's research project. My completed master's in computer science is from Serbia in 2026. Other budget, teaching-language, country and start-year requirements are explicitly the same as this fixture's baseline.",
        commands: answerCommands(phdAnswers),
      },
    ],
  },
  {
    id: "PROFILE-BUDGET",
    synthetic: true,
    adult: true,
    title: "Ambiguous 10.000 budget",
    expected: "ready_limited",
    steps: [
      {
        message:
          "I give the baseline structured answers, except that my budget is just '10.000'. I have not specified its currency, period or whether it includes living costs.",
        commands: [
          ...answerCommands(
            without(
              undergraduateAnswers,
              "budgetAmount",
              "budgetCurrency",
              "budgetPeriod",
              "budgetIncludesLiving",
            ),
          ),
          {
            type: "propose",
            field: "budgetAmount",
            value: 10000,
            origin: "text_extraction",
            sourceRef:
              "Synthetic typed interpretation of '10.000'; no NLP parser was run",
          },
        ],
      },
      {
        message:
          "Yes, by '10.000' I mean the amount 10000. Confirm that proposal.",
        commands: [{ type: "confirm_latest", field: "budgetAmount" }],
      },
      {
        message: "EUR, per year, including living costs.",
        commands: answerCommands({
          budgetCurrency: "EUR",
          budgetPeriod: "year",
          budgetIncludesLiving: true,
        }),
      },
    ],
  },
  {
    id: "PROFILE-COUNTRY-CONFLICT",
    synthetic: true,
    adult: true,
    title: "Conflicting country lists",
    expected: "ready_limited",
    steps: [
      baseStep,
      {
        message:
          "Exclude Germany. I also still prefer Germany in my earlier answer.",
        commands: answerCommands({ excludedCountries: ["DE"] }),
      },
      {
        message: "Keep only the Netherlands as preferred, and exclude Germany.",
        commands: [
          {
            type: "resolve_countries",
            preferredCountries: ["NL"],
            excludedCountries: ["DE"],
          },
        ],
      },
    ],
  },
  {
    id: "PROFILE-MISSING-LANGUAGE",
    synthetic: true,
    adult: true,
    title: "Teaching language missing",
    expected: "asking",
    steps: [
      {
        message:
          "I give all the baseline structured answers except a teaching language. Do not infer it from the English interface.",
        commands: answerCommands(
          without(undergraduateAnswers, "teachingLanguages"),
        ),
      },
    ],
  },
  {
    id: "PROFILE-PREFERENCE-CHANGE",
    synthetic: true,
    adult: true,
    title: "Explicit country preference change",
    expected: "ready_limited",
    steps: [
      baseStep,
      {
        message:
          "Correct my preferred countries to Italy only. Keep the other requirements.",
        commands: answerCommands({ preferredCountries: ["IT"] }, "replace"),
      },
    ],
  },
  {
    id: "PROFILE-DOCUMENT-UNCONFIRMED",
    synthetic: true,
    adult: true,
    title: "Unconfirmed document change",
    expected: "asking",
    steps: [
      baseStep,
      {
        message:
          "Synthetic document fixture suggests EUR 25,000 as the budget amount. The user has not confirmed this change; no real document was uploaded.",
        commands: [
          {
            type: "propose",
            field: "budgetAmount",
            value: 25000,
            origin: "document",
            sourceRef: "SYNTHETIC-DOCUMENT-01/budget",
          },
        ],
      },
    ],
  },
  {
    id: "PROFILE-ENOUGH",
    synthetic: true,
    adult: true,
    title: "Enough for limited search with unknowns",
    expected: "ready_limited",
    steps: [baseStep],
  },
  {
    id: "PROFILE-NOT-ENOUGH",
    synthetic: true,
    adult: true,
    title: "Not enough information",
    expected: "asking",
    steps: [
      {
        message:
          "I am an adult looking for a master's, but I am not sure of the field or budget yet.",
        commands: answerCommands({ studyLevel: "master" }),
      },
    ],
  },
];
export interface ConversationTrace {
  message: string;
  turn: ConversationTurn;
  events: unknown[];
}
export function replayConversation(fixture: ProfileConversation): {
  state: ProfileState;
  trace: ConversationTrace[];
} {
  let state = createProfile();
  const initial = advanceConversation(state, { asOfYear: 2026 });
  state = initial.state;
  const trace: ConversationTrace[] = [
    {
      message: "Start: no profile values are assumed.",
      turn: initial,
      events: [],
    },
  ];
  let serial = 0;
  for (const step of fixture.steps) {
    const events: unknown[] = [];
    for (const command of step.commands) {
      let event: Record<string, unknown> = {
        ...command,
        id: `${fixture.id}-${++serial}`,
        baseRevision: state.revision,
      };
      if (command.type === "confirm_latest") {
        const f = state.fields[command.field!];
        event = {
          id: event.id,
          baseRevision: state.revision,
          type: "confirm",
          field: command.field,
          fieldRevision: f.revision,
          proposalId: f.proposals.at(-1)?.id ?? null,
        };
      }
      const result = applyProfileEvent(state, event);
      if (!result.ok)
        throw new Error(
          `${fixture.id}: ${result.error} for ${command.type}/${command.field ?? "lists"}`,
        );
      events.push(event);
      state = result.state;
    }
    const turn = advanceConversation(state, { asOfYear: 2026 });
    state = turn.state;
    trace.push({ message: step.message, turn, events });
  }
  return { state, trace };
}
