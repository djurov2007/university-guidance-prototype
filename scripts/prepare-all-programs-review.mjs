import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  catalogDigest,
  validateCatalog,
} from "../src/server/catalog/validation.ts";

export const reviewedOn = "2026-10-17";
export const originalFile = "data/catalog/staging/catalog.v1.json";
export const publishedFile = "data/catalog/published/catalog.v1.json";
export const candidateFile =
  "data/catalog/review/all-programs.2026-10-17.v1.0.3.json";

const expectedOriginalDigest =
  "dd7e56a2d25e68de1d499e85ce0c32beeb7af51802d9bd1898a5f5982c6f24bb";
const expectedPublishedDigest =
  "03981f3043869d37d4d0fe725ee07427c7d91261f790363edf697be9d29a53e3";

export const remainingProgramIds = [
  "etf-si",
  "passau-cs",
  "bologna-clef",
  "tum-informatics",
  "bologna-im",
  "bologna-phd-cse",
];

const reviewProgramIds = ["twente-psych", "twente-bme", ...remainingProgramIds];

const updatedProgramNotes = {
  "etf-si":
    "Historical 2026/27 third-round record; applications closed on 17 September 2026. The 2027 call, exact teaching start, complete costs and scholarship remain unknown. Teaching is in Serbian.",
  "passau-cs":
    "Current general policy, not a year-bound intake. April/October starts and recurring application routes require a future intake check. No tuition is separate from semester fees and living costs.",
  "bologna-clef":
    "Historical 2026/27 first-round record for programme code 6646; applications closed on 4 May 2026. Later rounds differ by candidate category and no 2027 rollover is inferred.",
  "tum-informatics":
    "Current general policy with recurring winter/summer application windows, not a confirmed future intake. Teaching is usually English; individual degree equivalence, fees and waivers require assessment.",
  "bologna-im":
    "Historical 2026/27 selection for second-cycle programme code 6803; applications closed on 8 April 2026. This is not the MIEX professional master and no 2027 call is inferred.",
  "bologna-phd-cse":
    "Historical cycle 42 third-round record; applications closed on 8 October 2026 and the course start was scheduled for 1 November 2026. The three funded positions are topic-restricted; admission and funding are not guaranteed.",
};

const updatedIntakeLabels = {
  "etf-si-intake": "Third admission round 2026; closed on 17 September 2026",
  "passau-cs-intake": "Current general policy; recurring April/October starts",
  "bologna-clef-intake": "First admission round 2026; closed on 4 May 2026",
  "tum-informatics-intake":
    "Current general policy; recurring winter/summer admissions",
  "bologna-im-intake": "2026 selection; closed on 8 April 2026",
  "bologna-phd-cse-intake":
    "Cycle 42 third admission round; closed on 8 October 2026",
};

function requireSnapshot(input, expectedDigest, label) {
  const result = validateCatalog(input, reviewedOn);
  if (!result.ok || !result.catalog)
    throw new Error(
      `${label} integrity failed: ${JSON.stringify(result.issues)}`,
    );
  if (catalogDigest(result.catalog) !== expectedDigest)
    throw new Error(`${label} changed; review the new input explicitly`);
  return structuredClone(result.catalog);
}

export function prepareAllProgramsCandidate(originalInput, publishedInput) {
  const original = requireSnapshot(
    originalInput,
    expectedOriginalDigest,
    "Original staging snapshot",
  );
  const published = requireSnapshot(
    publishedInput,
    expectedPublishedDigest,
    "Current published snapshot",
  );
  const remaining = new Set(remainingProgramIds);
  const remainingFacts = original.facts.filter((f) =>
    remaining.has(f.programId),
  );
  const remainingFactIds = new Set(remainingFacts.map((f) => f.id));
  const remainingInstitutionIds = new Set(
    original.programs
      .filter((p) => remaining.has(p.id))
      .map((p) => p.institutionId),
  );

  const candidate = {
    schemaVersion: 1,
    version: "1.0.3",
    channel: "staging",
    preparedOn: reviewedOn,
    institutions: [
      ...published.institutions,
      ...original.institutions.filter((i) => remainingInstitutionIds.has(i.id)),
    ],
    programs: [
      ...published.programs,
      ...original.programs.filter((p) => remaining.has(p.id)),
    ],
    intakes: [
      ...published.intakes,
      ...original.intakes.filter((i) => remaining.has(i.programId)),
    ],
    sources: [
      ...published.sources,
      ...original.sources.filter((s) =>
        s.programIds.some((programId) => remaining.has(programId)),
      ),
    ],
    facts: [...published.facts, ...remainingFacts],
    evidence: [
      ...published.evidence,
      ...original.evidence.filter((e) => remainingFactIds.has(e.factId)),
    ],
    reviews: [],
  };

  for (const program of candidate.programs) {
    if (program.id in updatedProgramNotes)
      program.notes = updatedProgramNotes[program.id];
  }
  for (const intake of candidate.intakes) {
    if (intake.id in updatedIntakeLabels)
      intake.label = updatedIntakeLabels[intake.id];
  }
  for (const source of candidate.sources) {
    if (source.programIds.some((programId) => remaining.has(programId))) {
      source.accessedOn = reviewedOn;
      source.checkedOn = reviewedOn;
    }
  }
  for (const fact of candidate.facts) {
    if (remaining.has(fact.programId)) {
      fact.checkedOn = reviewedOn;
      fact.checkedBy = "agent";
    }
  }
  for (const evidence of candidate.evidence) {
    if (remainingFactIds.has(evidence.factId)) evidence.checkedOn = reviewedOn;
  }

  const digest = catalogDigest(candidate);
  candidate.reviews = reviewProgramIds.map((programId) => ({
    id: `all-programs-${programId}-pending-20261017`,
    programId,
    reviewer: "Viktor",
    reviewerKind: "human",
    decision: "pending",
    reviewedOn,
    contentDigest: digest,
    checklistComplete: false,
    acceptedUnknownFactIds: [],
    note: "Pending final review of this exact combined digest and the programme's explicit unknown facts. Earlier programme approvals remain historical evidence and do not automatically approve this changed snapshot.",
  }));

  const result = validateCatalog(candidate, reviewedOn);
  if (!result.ok)
    throw new Error(
      `Candidate validation failed: ${JSON.stringify(result.issues)}`,
    );
  if (
    candidate.programs.length !== 8 ||
    candidate.sources.length !== 31 ||
    candidate.facts.length !== 145 ||
    candidate.evidence.length !== 128 ||
    result.warnings.length !== 26
  )
    throw new Error(
      "Candidate inventory differs from the reviewed 8/31/145/128/26 set",
    );
  return candidate;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const original = JSON.parse(readFileSync(originalFile, "utf8"));
  const published = JSON.parse(readFileSync(publishedFile, "utf8"));
  const candidate = prepareAllProgramsCandidate(original, published);
  mkdirSync(dirname(candidateFile), { recursive: true });
  writeFileSync(candidateFile, `${JSON.stringify(candidate, null, 2)}\n`);
  const validation = validateCatalog(candidate, reviewedOn);
  console.log(
    JSON.stringify({
      candidateFile,
      version: candidate.version,
      digest: catalogDigest(candidate),
      programs: candidate.programs.length,
      sources: candidate.sources.length,
      facts: candidate.facts.length,
      evidence: candidate.evidence.length,
      unknowns: validation.warnings.length,
      publicationIssuesIfPromoted: validateCatalog(
        { ...candidate, channel: "published" },
        reviewedOn,
      ).issues.map((issue) => issue.code),
    }),
  );
}
