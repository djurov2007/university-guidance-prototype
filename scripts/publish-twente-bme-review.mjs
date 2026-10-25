import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  catalogDigest,
  validateCatalog,
} from "../src/server/catalog/validation.ts";

export const publishedFile = "data/catalog/published/catalog.v1.json";
export const candidateFile =
  "data/catalog/review/twente-bme.2026-10-17.v1.0.2.json";
export const approvedOn = "2026-10-17";

const expectedPsychDigest =
  "05bd7e5246623c58c1c4f3dc60eab7af11ae8c7f035f277895cde334fc6cb184";
const expectedBmeDigest =
  "3ca772f20723707cbd2ae5cf6d2d80ba9737252d0eca137e3fca5a30d44beeed";

export function buildCombinedPublication(psychPublished, bmeCandidate) {
  const psychValidation = validateCatalog(psychPublished, approvedOn);
  const bmeValidation = validateCatalog(bmeCandidate, approvedOn);
  if (!psychValidation.ok || !psychValidation.catalog)
    throw new Error("Current Psychology publication is invalid");
  if (!bmeValidation.ok || !bmeValidation.catalog)
    throw new Error("BME candidate is invalid");
  if (catalogDigest(psychValidation.catalog) !== expectedPsychDigest)
    throw new Error("Psychology publication changed; review again");
  if (catalogDigest(bmeValidation.catalog) !== expectedBmeDigest)
    throw new Error("BME candidate changed; review again");

  const psych = structuredClone(psychValidation.catalog);
  const bme = structuredClone(bmeValidation.catalog);
  const combined = {
    schemaVersion: 1,
    version: "1.0.2",
    channel: "published",
    preparedOn: approvedOn,
    institutions: psych.institutions,
    programs: [...psych.programs, ...bme.programs],
    intakes: [...psych.intakes, ...bme.intakes],
    sources: [...psych.sources, ...bme.sources],
    facts: [...psych.facts, ...bme.facts],
    evidence: [...psych.evidence, ...bme.evidence],
    reviews: [],
  };
  const digest = catalogDigest(combined);
  combined.reviews = [
    {
      id: "psych-human-approved-combined-20261017",
      programId: "twente-psych",
      reviewer: "Viktor",
      reviewerKind: "human",
      decision: "approved",
      reviewedOn: approvedOn,
      contentDigest: digest,
      checklistComplete: true,
      acceptedUnknownFactIds: [
        "twente-psych-other-cost-main",
        "twente-psych-scholarship-main",
      ],
      note: "Psychology content is unchanged from the separately approved 1.0.1 candidate. Viktor's 2026-10-17 approval of all reviewed content covers this deterministic combined local publication; individual eligibility, cost and funding remain unresolved.",
    },
    {
      id: "twente-bme-human-approved-20261017",
      programId: "twente-bme",
      reviewer: "Viktor",
      reviewerKind: "human",
      decision: "approved",
      reviewedOn: approvedOn,
      contentDigest: digest,
      checklistComplete: true,
      acceptedUnknownFactIds: [
        "twente-bme-other-cost-main",
        "twente-bme-scholarship-main",
      ],
      note: "Viktor explicitly approved all reviewed BME 1.0.2 content and its two visible unknowns for controlled local publication. This is not individual admission, fee, scholarship, live AI, pilot or cloud approval.",
    },
  ];
  const validation = validateCatalog(combined, approvedOn);
  if (!validation.ok) throw new Error(JSON.stringify(validation.issues));
  return combined;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const current = JSON.parse(readFileSync(publishedFile, "utf8"));
  const candidate = JSON.parse(readFileSync(candidateFile, "utf8"));
  const combined = buildCombinedPublication(current, candidate);
  writeFileSync(publishedFile, `${JSON.stringify(combined, null, 2)}\n`);
  console.log(
    JSON.stringify({
      publishedFile,
      version: combined.version,
      digest: catalogDigest(combined),
      programs: combined.programs.map((p) => p.id),
      facts: combined.facts.length,
      warnings: validateCatalog(combined, approvedOn).warnings.length,
    }),
  );
}
