import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  catalogDigest,
  validateCatalog,
} from "../src/server/catalog/validation.ts";

export const approvedOn = "2026-10-17";
export const publishedFile = "data/catalog/published/catalog.v1.json";
export const candidateFile =
  "data/catalog/review/all-programs.2026-10-17.v1.0.3.json";

const expectedCurrentPublishedDigest =
  "03981f3043869d37d4d0fe725ee07427c7d91261f790363edf697be9d29a53e3";
const approvedCandidateDigest =
  "68d9f119d9aeb00cc59410b5d0ad24be52755546f7a9327e5d0392fb31092e8d";

function requireSnapshot(input, expectedDigest, label) {
  const result = validateCatalog(input, approvedOn);
  if (!result.ok || !result.catalog)
    throw new Error(
      `${label} integrity failed: ${JSON.stringify(result.issues)}`,
    );
  if (catalogDigest(result.catalog) !== expectedDigest)
    throw new Error(`${label} digest changed; a new human review is required`);
  return structuredClone(result.catalog);
}

export function buildApprovedPublication(currentInput, candidateInput) {
  requireSnapshot(
    currentInput,
    expectedCurrentPublishedDigest,
    "Current publication",
  );
  const publication = requireSnapshot(
    candidateInput,
    approvedCandidateDigest,
    "Approved candidate",
  );
  if (
    publication.channel !== "staging" ||
    publication.reviews.length !== publication.programs.length ||
    publication.reviews.some(
      (review) =>
        review.decision !== "pending" ||
        review.checklistComplete ||
        review.contentDigest !== approvedCandidateDigest,
    )
  )
    throw new Error("Candidate review state changed; review again");

  publication.channel = "published";
  publication.reviews = publication.programs.map((program) => ({
    id: `all-programs-${program.id}-approved-20261017`,
    programId: program.id,
    reviewer: "Viktor",
    reviewerKind: "human",
    decision: "approved",
    reviewedOn: approvedOn,
    contentDigest: approvedCandidateDigest,
    checklistComplete: true,
    acceptedUnknownFactIds: publication.facts
      .filter(
        (fact) => fact.programId === program.id && fact.status === "unknown",
      )
      .map((fact) => fact.id),
    note: "Viktor explicitly confirmed the exact combined 1.0.3 digest and all 26 listed unknown facts on 2026-10-17. Approval is limited to controlled local catalogue publication and is not an individual admission, fee, scholarship, live AI, pilot, cloud or Phase 2 decision.",
  }));

  const result = validateCatalog(publication, approvedOn);
  if (!result.ok)
    throw new Error(
      `Publication validation failed: ${JSON.stringify(result.issues)}`,
    );
  if (catalogDigest(publication) !== approvedCandidateDigest)
    throw new Error("Publication content differs from the approved digest");
  return publication;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const current = JSON.parse(readFileSync(publishedFile, "utf8"));
  const candidate = JSON.parse(readFileSync(candidateFile, "utf8"));
  const publication = buildApprovedPublication(current, candidate);
  writeFileSync(publishedFile, `${JSON.stringify(publication, null, 2)}\n`);
  console.log(
    JSON.stringify({
      publishedFile,
      version: publication.version,
      digest: catalogDigest(publication),
      programs: publication.programs.length,
      sources: publication.sources.length,
      facts: publication.facts.length,
      evidence: publication.evidence.length,
      acceptedUnknowns: publication.reviews.reduce(
        (count, review) => count + review.acceptedUnknownFactIds.length,
        0,
      ),
      humanApprovals: publication.reviews.length,
    }),
  );
}
