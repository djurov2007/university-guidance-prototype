import {
  createProfile,
  type ProfileState,
} from "../features/profiles/schema.ts";
import { applyProfileEvent } from "../features/profiles/state.ts";
import {
  answerCommands,
  undergraduateAnswers,
} from "./profile-conversations.ts";
import {
  matchingCatalogSchema,
  type MatchingProgram,
  type MatchingInput,
  type Proof,
} from "../features/matching/schema.ts";
export function syntheticProof(patch: Partial<Proof> = {}): Proof {
  return {
    status: "verified",
    factIds: ["synthetic-fact"],
    sourceIds: ["synthetic-source"],
    startYear: 2027,
    candidateScope: "all",
    checkedOn: "2026-10-06",
    note: "Synthetic fixture evidence only; no real source or review.",
    ...patch,
  };
}
export function syntheticProgram(
  id = "synthetic-cs-a",
  patch: Partial<MatchingProgram> = {},
): MatchingProgram {
  return {
    id,
    intakeId: `${id}-2027`,
    name: `Synthetic computing programme ${id}`,
    institution: "Fictional Test Institution",
    level: "undergraduate",
    country: "DE",
    city: "Fictional city",
    topics: ["computer science", "software engineering"],
    identityProof: syntheticProof(),
    languages: ["english"],
    languageProof: syntheticProof(),
    cost: {
      amount: 8000,
      currency: "EUR",
      period: "year",
      coverage: "tuition_and_living",
      proof: syntheticProof(),
    },
    costProof: syntheticProof(),
    funding: "none",
    fundingProof: syntheticProof(),
    preferences: ["practical"],
    preferenceProof: syntheticProof(),
    rules: [
      {
        id: "synthetic-deadline",
        kind: "deadline",
        date: "2027-05-01",
        mandatory: true,
        proof: syntheticProof(),
      },
    ],
    requirementsComplete: true,
    ...patch,
  };
}
export function matchingFixture(
  programs: MatchingProgram[] = [syntheticProgram()],
): MatchingInput {
  let profile = createProfile();
  for (const [index, c] of answerCommands(undergraduateAnswers).entries()) {
    const result = applyProfileEvent(profile, {
      ...c,
      id: `matching-profile-${index}`,
      baseRevision: profile.revision,
    });
    if (!result.ok) throw new Error(result.error);
    profile = result.state;
  }
  return {
    profile,
    catalog: matchingCatalogSchema.parse({
      schemaVersion: 1,
      version: "synthetic-1.0.0",
      channel: "synthetic",
      programs,
      sourceIds: ["synthetic-source"],
      factIds: ["synthetic-fact"],
    }),
    asOf: "2026-10-06",
    consents: [],
  };
}
export function changeSyntheticProfile(
  input: MatchingInput,
  field: string,
  value: unknown,
): ProfileState {
  const result = applyProfileEvent(input.profile, {
    id: `change-${input.profile.revision}-${field}`,
    baseRevision: input.profile.revision,
    type: "user_answer",
    field,
    value,
    mode: "replace",
  });
  if (!result.ok) throw new Error(result.error);
  return result.state;
}
