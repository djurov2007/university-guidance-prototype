import "server-only";
import type { Scenario } from "../features/conversation/schema.ts";
import {
  profileValueSchemas,
  type ProfileValues,
} from "../features/profiles/schema.ts";
import { exampleAnswers } from "../server/conversation/fixtures.ts";

export const demoQualification = {
  kind: "bachelor",
  field: "Computer science",
  institution: null,
  country: "RS",
  completion: "completed",
  completionYear: 2026,
  credits: { amount: 180, system: "ECTS", label: "Self-reported ECTS" },
} satisfies NonNullable<ProfileValues["previousQualification"]>;
export const demoSubjects = [
  { name: "Algorithms", result: null, credits: null },
  { name: "Linear algebra", result: null, credits: null },
];
export const demoProfiles = [
  {
    id: "D12-01",
    scenario: "bachelor",
    title: "Bachelor with an annual hard budget",
    overrides: {},
    expected: "options_found",
    action:
      "Review, confirm, search; correct 10000 to 11000 EUR and confirm again.",
  },
  {
    id: "D12-02",
    scenario: "master",
    title: "Master with prerequisite subjects",
    overrides: {
      previousQualification: demoQualification,
      relevantSubjects: demoSubjects,
    },
    expected: "needs_verification",
    action:
      "Missing subjects stay unknown; none excludes; both subjects are only likely_met after confirmation.",
  },
  {
    id: "D12-03",
    scenario: "phd",
    title: "PhD requiring a funded employed position",
    overrides: {},
    expected: "permission_required",
    action:
      "Grant the exact conditional alternative; funding/supervisor/employment remain unknown.",
  },
  {
    id: "D12-04",
    scenario: "no_match",
    title: "No computing match in a medicine-only fixture",
    overrides: {},
    expected: "no_match",
    action: "Show zero cards and explain limited catalogue coverage.",
  },
  {
    id: "D12-05",
    scenario: "alternative",
    title: "Above-budget alternative with scoped permission",
    overrides: {},
    expected: "permission_required",
    action:
      "12000 EUR alternative hidden behind 10000 EUR cap; grant, inspect sources, withdraw.",
  },
  {
    id: "D12-06",
    scenario: "bachelor",
    title: "Conflicting budget values",
    overrides: {},
    expected: "PROFILE_CONFLICT",
    action:
      "After search send My budget is 7000 EUR; keep 10000 explicitly, then search again.",
  },
  {
    id: "D12-07",
    scenario: "provider_unavailable",
    title: "Explicit deterministic recovery",
    overrides: {},
    expected: "PROVIDER_UNAVAILABLE",
    action:
      "Find programmes fails safely; explicitly choose Browse without explanation.",
  },
] satisfies {
  id: string;
  scenario: Scenario;
  title: string;
  overrides: Partial<ProfileValues>;
  expected: string;
  action: string;
}[];

export function demoValues(id: string): Partial<ProfileValues> {
  const demo = demoProfiles.find((d) => d.id === id);
  if (!demo) throw new Error("Unknown synthetic demo profile");
  const values = {
    ...exampleAnswers(demo.scenario),
    ...structuredClone(demo.overrides),
  };
  for (const [field, value] of Object.entries(values)) {
    profileValueSchemas[field as keyof ProfileValues].parse(value);
  }
  return values;
}
