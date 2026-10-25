import type { StudyLevel } from "@/features/profiles/types";

// UI-only illustrations. Never import these into the reviewed server catalog.
export const scenarios = [
  ["welcome", "Initial screen"],
  ["loading", "Loading"],
  ["partial", "Partial profile"],
  ["conflict", "Conflicting data"],
  ["ready", "Profile ready"],
  ["recommendations", "Three recommendations"],
  ["one", "One recommendation"],
  ["two", "Two recommendations"],
  ["no-match", "No matches"],
  ["conditional", "Conditional alternative"],
  ["permission", "Permission request"],
  ["unverified", "Unverified source"],
  ["out-of-scope", "Out-of-scope question"],
  ["server-error", "Server error"],
  ["ai-unavailable", "AI unavailable"],
  ["expired", "Expired session"],
  ["empty-catalog", "Empty catalog"],
] as const;
export type Scene = (typeof scenarios)[number][0];
export type FieldStatus =
  "stated" | "proposed" | "confirmed" | "missing" | "conflict";
export interface DemoField {
  label: string;
  value: string;
  status: FieldStatus;
}
export interface DemoProfile {
  level: StudyLevel;
  fixtureId: string;
  fields: {
    goal: DemoField;
    country: DemoField;
    budget: DemoField;
    language: DemoField;
    qualification: DemoField;
    intake: DemoField;
    funding: DemoField;
  };
}
export interface DemoMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}
export interface DemoProgram {
  id: string;
  title: string;
  level: string;
  country: string;
  language: string;
  cost: string;
  reason: string;
  unknown: string;
  nextStep: string;
  conditional: boolean;
  sourceId: string;
}

export const levelExamples: Record<
  StudyLevel,
  {
    title: string;
    goal: string;
    question: string;
    answer: string;
    fixtureId: string;
  }
> = {
  undergraduate: {
    title: "Bachelor’s",
    fixtureId: "SYN-UG-01",
    goal: "I want a practical bachelor's program in computing in Serbia for 2027.",
    question:
      "Which languages can you study in, and what is your total annual budget, including living costs?",
    answer:
      "Serbian or English. My total budget is EUR 8,000 per year, including tuition and living costs. I have finished secondary school in Serbia.",
  },
  master: {
    title: "Master’s",
    fixtureId: "SYN-MA-01",
    goal: "I have a computing bachelor's and want a practical master's in data science.",
    question:
      "What relevant degree and credits do you have, and what is your total annual budget?",
    answer:
      "A computing bachelor's with 180 ECTS and relevant mathematics and programming subjects. I can study in English in Serbia, Germany, the Netherlands or Italy, with a total annual budget of EUR 18,000.",
  },
  phd: {
    title: "PhD",
    fixtureId: "SYN-PHD-01",
    goal: "I need a funded PhD position in machine learning for healthcare, rather than a self-funded program.",
    question:
      "What research experience do you have, and does the position need to cover both fees and living costs?",
    answer:
      "I have a relevant master's degree and research experience. Funding is essential. Germany or the Netherlands, in English, with at most EUR 2,000 per year in personal top-ups.",
  },
};

export function makeProfile(
  level: StudyLevel,
  partial = false,
  alternative = false,
): DemoProfile {
  const field = (
    label: string,
    value: string,
    status: FieldStatus = "stated",
  ): DemoField => ({ label, value, status });
  const details = {
    undergraduate: [
      "Computing · practical projects",
      "Serbia only",
      "EUR 8,000 / year · total",
      "Serbian or English",
      "Secondary school completed · Serbia",
      "Preferred, not essential",
    ],
    master: [
      "Data science · practical projects",
      "Serbia, Germany, the Netherlands or Italy",
      "EUR 18,000 / year · total",
      "English",
      "Computing bachelor’s · 180 ECTS",
      "Preferred, not essential",
    ],
    phd: [
      "Machine learning for healthcare",
      "Germany or the Netherlands",
      "EUR 2,000 / year · personal top-ups",
      "English",
      "Relevant master’s · research experience",
      "Fully funded position required",
    ],
  }[level];
  return {
    level,
    fixtureId: alternative ? "SYN-UG-02" : levelExamples[level].fixtureId,
    fields: {
      goal: field(
        "Study goal",
        alternative ? "Economics · bachelor’s" : details[0]!,
      ),
      country: field(
        "Country · firm limit",
        alternative ? "Germany only" : details[1]!,
      ),
      budget: field(
        "Annual total budget",
        partial
          ? "Not provided yet"
          : alternative
            ? "EUR 14,000 / year · total"
            : details[2]!,
        partial ? "missing" : "proposed",
      ),
      language: field(
        "Teaching language",
        partial ? "Not provided yet" : alternative ? "English" : details[3]!,
        partial ? "missing" : "stated",
      ),
      qualification: field(
        "Previous qualification",
        partial ? "Not provided yet" : details[4]!,
        partial ? "missing" : "stated",
      ),
      intake: field("Start year", "2027"),
      funding: field(
        "Funding",
        partial ? "Not provided yet" : details[5]!,
        partial ? "missing" : "stated",
      ),
    },
  };
}

export function examplePrograms(level: StudyLevel): DemoProgram[] {
  const base = {
    undergraduate: {
      title: "Computing & practical projects",
      level: "Bachelor’s",
      country: "Serbia",
      language: "Serbian or English",
      cost: "EUR 6,500 / year · tuition + living",
      reason:
        "Illustrates your computing interest, practical-project preference and selected country.",
      unknown:
        "Application deadline for 2027 is not represented in this example.",
      nextStep:
        "Check the teaching language and the official application requirements for your school qualification.",
    },
    master: {
      title: "Data science & applied computing",
      level: "Master’s",
      country: "Italy",
      language: "English",
      cost: "EUR 15,000 / year · tuition + living",
      reason:
        "Illustrates your data-science specialisation goal and preference for applied projects.",
      unknown:
        "Recognition of the previous degree and required subject credits still need verification.",
      nextStep:
        "Check whether your previous degree and relevant subject credits meet the program prerequisites.",
    },
    phd: {
      title: "Machine learning for healthcare",
      level: "PhD research position",
      country: "Germany",
      language: "English",
      cost: "Funding not confirmed",
      reason:
        "Illustrates your research topic. An open, funded position has not been established.",
      unknown:
        "Position availability, funding coverage and supervisor availability are unverified.",
      nextStep:
        "Check whether the position is currently open and what its funding covers before relying on it.",
    },
  }[level];
  return ["A", "B", "C"].map((letter) => ({
    ...base,
    id: `UI-EXAMPLE-${letter}`,
    title: `${base.title} · example ${letter}`,
    sourceId: `UI-SOURCE-${letter}`,
    conditional: level === "phd",
  }));
}

export const alternativeProgram: DemoProgram = {
  id: "UI-ALTERNATIVE",
  title: "Economics & project learning · example",
  level: "Bachelor’s",
  country: "Italy",
  language: "English",
  cost: "EUR 12,000 / year · tuition + living",
  conditional: true,
  sourceId: "UI-SOURCE-ALT",
  reason:
    "A fictional illustration outside your Germany-only constraint. Permission covers exploring Italy only.",
  unknown:
    "Funding and admissions requirements are not verified. Your original country limit is unchanged.",
  nextStep:
    "Verify the official entry requirements and total costs before considering a real option in Italy.",
};

export function previewMessages(
  scene: Scene,
  level: StudyLevel,
): DemoMessage[] {
  if (scene === "welcome" || scene === "expired") return [];
  const example = levelExamples[level];
  const first = { id: "goal", role: "user" as const, text: example.goal };
  if (scene === "partial")
    return [
      first,
      { id: "question", role: "assistant", text: example.question },
    ];
  if (scene === "conflict")
    return [
      { id: "country-1", role: "user", text: "I will only study in Serbia." },
      {
        id: "country-2",
        role: "user",
        text: "Germany is the only country I would consider.",
      },
      {
        id: "conflict",
        role: "assistant",
        text: "Those country limits conflict. Which should I use? I won’t silently replace either one.",
      },
    ];
  if (scene === "out-of-scope")
    return [
      {
        id: "unrelated",
        role: "user",
        text: "Can you give me the weather forecast?",
      },
      {
        id: "domain",
        role: "assistant",
        text: "I can help with study choices, program requirements and related application steps. Let’s return to your study goal.",
      },
    ];
  return [
    first,
    { id: "question", role: "assistant", text: example.question },
    { id: "answer", role: "user", text: example.answer },
    {
      id: "summary",
      role: "assistant",
      text: ["recommendations", "one", "two", "unverified", "loading"].includes(
        scene,
      )
        ? "We’ll explore fictional options for this confirmed example brief. Sources and unresolved requirements remain important; admission is not guaranteed."
        : "Here is the example study brief. Review the proposed budget and confirm it before exploring illustrative options. Admission is never guaranteed.",
    },
  ];
}
