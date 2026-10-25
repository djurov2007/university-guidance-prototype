import "server-only";
import type { Scenario } from "../../features/conversation/schema.ts";
import type { ProfileValues } from "../../features/profiles/schema.ts";
import { matchingCatalogSchema } from "../../features/matching/schema.ts";
import { undergraduateAnswers } from "../../test-fixtures/profile-conversations.ts";
import {
  syntheticProgram,
  syntheticProof,
} from "../../test-fixtures/matching.ts";
import { readPublishedMatchingCatalog } from "../matching/catalog-adapter.ts";

export function exampleAnswers(scenario: Scenario): Partial<ProfileValues> {
  const common = structuredClone(undergraduateAnswers);
  if (scenario === "master") {
    delete common.previousQualification;
    return {
      ...common,
      studyLevel: "master",
      studyGoal: "Specialise in computer science",
      masterIntent: "specialisation",
    };
  }
  if (scenario === "phd")
    return {
      ...common,
      studyLevel: "phd",
      studyGoal: "Research reliable computing systems",
      scholarshipNeed: "required",
      previousQualification: {
        kind: "master",
        field: "Computer science",
        institution: null,
        country: "RS",
        completion: "completed",
        completionYear: 2026,
        credits: null,
      },
      phdTopic: "Reliable computing systems",
      phdFunding: "fully_funded",
      phdPositionType: "employed_position",
      researchExperience: ["Fictional research project"],
    };
  return common;
}
export function sessionCatalog(scenario: Scenario, asOf: string) {
  if (scenario === "published") return readPublishedMatchingCatalog(asOf);
  const proof = syntheticProof({ checkedOn: "2026-10-08" });
  const unknown = syntheticProof({
    checkedOn: "2026-10-08",
    status: "unknown",
    note: "Funding and employment are unknown in this fictional demonstration.",
  });
  const programs =
    scenario === "alternative"
      ? [
          syntheticProgram("synthetic-over-budget", {
            name: "Synthetic advanced computing",
            cost: {
              amount: 12000,
              currency: "EUR",
              period: "year",
              coverage: "tuition_and_living",
              proof,
            },
          }),
        ]
      : scenario === "no_match"
        ? [
            syntheticProgram("synthetic-medicine", {
              topics: ["medicine"],
              name: "Synthetic medicine programme",
            }),
          ]
        : [
            syntheticProgram("synthetic-computing", {
              name: "Synthetic computing bachelor",
            }),
            syntheticProgram("synthetic-software", {
              name: "Synthetic software bachelor",
              country: "NL",
            }),
            syntheticProgram("synthetic-computing-master", {
              name: "Synthetic computing master",
              level: "master",
              rules: [
                {
                  id: "synthetic-bachelor-required",
                  kind: "qualification",
                  accepted: ["bachelor", "integrated_degree"],
                  mandatory: true,
                  proof,
                },
                {
                  id: "synthetic-credits",
                  kind: "credits",
                  minimum: 180,
                  system: "ECTS",
                  mandatory: true,
                  proof,
                },
                {
                  id: "synthetic-prior-subjects",
                  kind: "subjects",
                  required: ["Algorithms", "Linear algebra"],
                  mandatory: true,
                  proof,
                },
              ],
            }),
            syntheticProgram("synthetic-research", {
              name: "Synthetic computing PhD",
              level: "phd",
              funding: "unknown",
              fundingProof: unknown,
              requirementsComplete: false,
              rules: [
                {
                  id: "synthetic-supervisor",
                  kind: "manual",
                  label: "Supervisor, research fit and employment need review",
                  mandatory: true,
                  proof: unknown,
                },
              ],
            }),
          ];
  return matchingCatalogSchema.parse({
    schemaVersion: 1,
    version: "integration-synthetic-1",
    channel: "synthetic",
    programs,
    sourceIds: ["synthetic-source"],
    factIds: ["synthetic-fact"],
  });
}
