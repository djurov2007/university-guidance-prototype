import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  catalogDigest,
  validateCatalog,
} from "../src/server/catalog/validation.ts";

export const reviewedOn = "2026-10-17";
export const candidateFile =
  "data/catalog/review/twente-bme.2026-10-17.v1.0.2.json";
export const reportFile = "docs/data/TWENTE_BME_FINAL_REVIEW_2026-10-17.md";

const originalDigest =
  "dd7e56a2d25e68de1d499e85ce0c32beeb7af51802d9bd1898a5f5982c6f24bb";
const programId = "twente-bme";
const intakeId = "twente-bme-intake";

export function prepareCandidate(original) {
  const source = validateCatalog(original, reviewedOn);
  if (!source.ok || !source.catalog)
    throw new Error("Original catalogue integrity failed");
  if (catalogDigest(source.catalog) !== originalDigest)
    throw new Error("Original snapshot changed; review changes explicitly");

  const c = structuredClone(source.catalog);
  c.version = "1.0.2";
  c.preparedOn = reviewedOn;
  c.channel = "staging";
  c.institutions = c.institutions.filter((i) => i.id === "twente");
  c.programs = c.programs.filter((p) => p.id === programId);
  c.intakes = c.intakes.filter((i) => i.programId === programId);
  c.sources = c.sources.filter((s) => s.programIds.includes(programId));
  c.facts = c.facts.filter((f) => f.programId === programId);
  c.evidence = c.evidence.filter((e) => c.facts.some((f) => f.id === e.factId));
  c.reviews = [];

  c.programs[0].notes =
    "International-degree eligibility, relevant-course grades, CGPA equivalence and any pre-master are assessed individually. The e-check is indicative and is not an admission decision.";

  for (const sourceRecord of c.sources) {
    sourceRecord.programIds = [programId];
    sourceRecord.intakeIds = [intakeId];
    sourceRecord.accessedOn = reviewedOn;
    sourceRecord.checkedOn = reviewedOn;
  }
  c.sources.push(
    {
      id: "twente-bme-overview",
      institutionId: "twente",
      programIds: [programId],
      intakeIds: [intakeId],
      title: "University of Twente Biomedical Engineering overview",
      url: "https://www.utwente.nl/en/education/master/programmes/biomedical-engineering/",
      publisher: "University of Twente",
      authority: "official",
      authorityReason:
        "University-owned programme page confirming degree, location, duration, language and 2027 starts; it does not decide candidate eligibility.",
      status: "verified",
      accessedOn: reviewedOn,
      checkedOn: reviewedOn,
    },
    {
      id: "twente-master-deadline-policy",
      institutionId: "twente",
      programIds: [programId],
      intakeIds: [intakeId],
      title: "University of Twente master's application deadline policy",
      url: "https://www.utwente.nl/en/education/master/application-admission/deadlines/",
      publisher: "University of Twente",
      authority: "official",
      authorityReason:
        "University-owned admissions page explaining nationality scope and complete-document submission; programme dates remain sourced from the BME factsheet.",
      status: "verified",
      accessedOn: reviewedOn,
      checkedOn: reviewedOn,
    },
  );

  for (const fact of c.facts) {
    fact.checkedOn = reviewedOn;
    fact.checkedBy = "agent";
    if (fact.candidateCategory === "all applicants")
      fact.candidateCategory = "Biomedical Engineering applicants";
    if (fact.intakeId === intakeId)
      fact.candidateCategory += "; September 2027 intake";
    if (fact.qualifier === "degree") {
      fact.candidateCategory =
        "Applicants with an international bachelor's degree; September 2027 intake";
      fact.note =
        "The listed direct background is BSc Biomedical Engineering or Biomedical Technology. Final admissibility, relevant-course grades and any pre-master are assessed individually.";
    }
    if (fact.qualifier === "math")
      fact.candidateCategory =
        "Applicants with an international bachelor's degree; September 2027 intake";
    if (fact.qualifier === "bet")
      fact.candidateCategory =
        "Bioengineering Technologies specialisation applicants with an international bachelor's degree; September 2027 intake";
    if (fact.predicate === "tuition" && fact.qualifier === "main") {
      fact.candidateCategory =
        "Non-EU/EEA applicants assigned the higher institutional fee; September 2027 intake";
      fact.note =
        "EUR 22,320 is the 2027/28 annual higher-rate institutional tuition fee. It is not the two-year total or an individual fee decision; later-year rates can rise.";
    }
    if (fact.predicate === "tuition" && fact.qualifier === "statutory") {
      fact.candidateCategory =
        "Applicants individually meeting statutory-fee conditions; September 2027 intake";
      fact.note =
        "EUR 2,771 is the 2027/28 annual statutory fee. EU/EEA status usually applies but does not by itself prove individual eligibility; no two-year total is inferred.";
    }
    if (fact.predicate === "application_deadline") {
      fact.value.note =
        "Programme factsheet date for September 2027. Exact cutoff time and timezone are not stated; all requested documents must be submitted before the applicable deadline.";
      fact.note = fact.value.note;
    }
    if (fact.predicate === "institutional_requirement") {
      fact.candidateCategory =
        "Applicants with an international degree; September 2027 intake";
      fact.note =
        "English proof must meet the September 2027 test, score, age and exemption rules before the deadline. The institution verifies evidence; no extra waiver or automatic exemption is inferred.";
    }
    if (fact.id === "twente-bme-other-cost-main") {
      fact.unknownReason =
        "A complete personalised total for living, insurance, travel, application fees, deposits and furnishings is not established.";
      fact.note = fact.unknownReason;
    }
    if (fact.id === "twente-bme-scholarship-main") {
      fact.unknownReason =
        "No specific scholarship is bound to this programme and applicant with verified 2027 eligibility, award amount and applicable deadline.";
      fact.note =
        "The university lists possible master's funding, but admission and scholarship applications are separate and no award is guaranteed.";
    }
  }

  for (const evidence of c.evidence) evidence.checkedOn = reviewedOn;
  const evidenceFor = (factId) => c.evidence.find((e) => e.factId === factId);
  Object.assign(evidenceFor("twente-bme-academic-year-main"), {
    sourceId: "twente-master-fees",
    locator: "September intake fee table, 2027-2028 (Sep-Aug)",
    paraphrase:
      "The fee authority explicitly labels the September 2027 academic year as 2027-2028; the programme start is separately confirmed as 1 September 2027.",
  });
  Object.assign(evidenceFor("twente-bme-institutional-requirement-main"), {
    locator: "Language skills; September 2027 and onwards; English exemptions",
    paraphrase:
      "English evidence must be satisfied before the application deadline. Accepted tests, minimum scores, validity and formal exemptions are stated for September 2027 and remain subject to institutional verification.",
  });
  for (const factId of [
    "twente-bme-application-deadline-main",
    "twente-bme-application-deadline-eu",
  ]) {
    c.evidence.push({
      id: `${factId}-policy-20261017`,
      factId,
      sourceId: "twente-master-deadline-policy",
      relation: "context",
      locator: "Nationality basis and complete-document submission",
      paraphrase:
        "Nationality determines the applicable deadline and all requested documents must be uploaded and submitted before it. The page does not add a cutoff time or replace the programme-specific date.",
      checkedOn: reviewedOn,
    });
  }

  c.facts.push(
    {
      id: "twente-bme-other-cost-living-estimate",
      programId,
      intakeId,
      predicate: "other_cost",
      qualifier: "monthly-living-estimate",
      candidateCategory: "Illustrative student budget; September 2027 intake",
      nature: "estimate",
      status: "verified",
      value: {
        kind: "money",
        amount: 1311,
        currency: "EUR",
        period: "month",
        basis: "estimate",
        note: "Published average monthly living estimate excluding tuition; not a quote, minimum or complete personalised budget.",
      },
      unknownReason: null,
      checkedOn: reviewedOn,
      checkedBy: "agent",
      note: "The official page attributes the estimate to Nibud and warns that actual costs vary. Deposits, furnishings, travel, application fees and tuition are not made complete by this figure.",
    },
    {
      id: "twente-bme-application-requirement-cgpa",
      programId,
      intakeId: null,
      predicate: "application_requirement",
      qualifier: "cgpa",
      candidateCategory:
        "Applicants with an international bachelor's degree; September 2027 intake",
      nature: "institutional",
      status: "verified",
      value: {
        kind: "text",
        text: "CGPA of at least 75% of the maximum score, or the country equivalent.",
      },
      unknownReason: null,
      checkedOn: reviewedOn,
      checkedBy: "agent",
      note: "Meeting the minimum does not guarantee admission; the committee also reviews relevant courses and their grades. Country equivalence remains an institutional assessment.",
    },
    {
      id: "twente-bme-application-requirement-documents",
      programId,
      intakeId: null,
      predicate: "application_requirement",
      qualifier: "documents",
      candidateCategory:
        "Applicants with an international bachelor's degree; September 2027 intake",
      nature: "institutional",
      status: "verified",
      value: {
        kind: "text",
        text: "Diploma copy, transcript, motivation letter up to 1,000 words and résumé are required.",
      },
      unknownReason: null,
      checkedOn: reviewedOn,
      checkedBy: "agent",
      note: "The application may start before graduation, but completion before the academic year remains required. Document acceptance and completeness are assessed by the institution.",
    },
  );
  c.evidence.push(
    {
      id: "twente-bme-living-estimate-20261017",
      factId: "twente-bme-other-cost-living-estimate",
      sourceId: "twente-master-fees",
      relation: "supports",
      locator: "Monthly living costs",
      paraphrase:
        "The university page reports an average EUR 1,311 monthly living-cost estimate excluding tuition and states that actual costs vary.",
      checkedOn: reviewedOn,
    },
    {
      id: "twente-bme-cgpa-20261017",
      factId: "twente-bme-application-requirement-cgpa",
      sourceId: "twente-bme-admission",
      relation: "supports",
      locator: "Required documents",
      paraphrase:
        "International-degree applicants need at least 75% of the maximum CGPA or country equivalent; this does not guarantee admission and relevant-course grades are reviewed.",
      checkedOn: reviewedOn,
    },
    {
      id: "twente-bme-documents-20261017",
      factId: "twente-bme-application-requirement-documents",
      sourceId: "twente-bme-admission",
      relation: "supports",
      locator: "Required documents",
      paraphrase:
        "The listed documents include diploma, transcript, motivation letter capped at 1,000 words and résumé.",
      checkedOn: reviewedOn,
    },
  );

  c.reviews.push({
    id: "twente-bme-final-review-pending-20261017",
    programId,
    reviewer: "Viktor",
    reviewerKind: "human",
    decision: "pending",
    reviewedOn,
    contentDigest: catalogDigest(c),
    checklistComplete: false,
    acceptedUnknownFactIds: [],
    note: "Reviewer assigned. This exact revised digest and both visible unknowns still require a final human publication decision.",
  });
  return c;
}

function display(fact) {
  if (!fact.value) return `UNKNOWN — ${fact.unknownReason}`;
  const value = fact.value;
  if (value.kind === "text") return value.text;
  if (value.kind === "list") return value.items.join(", ");
  if (value.kind === "money")
    return `${value.amount} ${value.currency}/${value.period} (${value.basis})`;
  if (value.kind === "date")
    return `${value.date}; ${value.time ?? "time unknown"}; ${value.timezone ?? "zone unknown"}`;
  return `${value.amount} ${value.unit}`;
}

export function candidateReport(c) {
  const validation = validateCatalog(c, reviewedOn);
  if (!validation.ok) throw new Error(JSON.stringify(validation.issues));
  const proposedPublication = validateCatalog(
    { ...c, channel: "published" },
    reviewedOn,
  );
  const digest = catalogDigest(c);
  return [
    "# Twente Biomedical Engineering — final candidate review",
    "",
    "2026-10-17. **Prepared for Viktor's final decision; not approved or published.**",
    "",
    `Candidate: [single-programme JSON](../../${candidateFile}), version **${c.version}**, digest \`${digest}\`.`,
    "",
    `Validation: **PASS** — ${c.programs.length} programme, ${c.facts.length} facts, ${c.sources.length} official sources, ${c.evidence.length} evidence links; ${validation.warnings.length} visible warnings. A channel-only publication is **REJECTED** (${[...new Set(proposedPublication.issues.map((i) => i.code))].join(", ")}).`,
    "",
    "## Material review points",
    "",
    "- September 2027 start; annual 2027/28 tuition is EUR 22,320 for the higher institutional rate or EUR 2,771 for applicants who individually qualify for the statutory fee. Neither is a two-year total or personal quote.",
    "- Programme deadlines are 1 May 2027 for non-EU/EEA and 1 July 2027 for EU/EEA applicants. Exact cutoff time and timezone are not stated; required documents must be submitted before the applicable deadline.",
    "- International-degree review covers relevant BSc background, calculus and linear algebra, BET-specific cell biology/biochemistry, at least 75% CGPA or country equivalent, required documents and September 2027 English proof. Every item remains a manual institutional assessment; no admission guarantee.",
    "- New estimate: EUR 1,311/month average living costs excluding tuition. It is an estimate, not a complete or personalised total.",
    "- Two visible unknowns remain: complete personalised additional costs, and a scholarship bound to this programme/applicant with verified eligibility, amount and deadline.",
    "",
    "## Facts",
    "",
    "| Fact | Value | Applicant scope | Effective status |",
    "| --- | --- | --- | --- |",
    ...c.facts.map(
      (f) =>
        `| ${f.id} | ${display(f).replaceAll("|", "\\|")} | ${f.candidateCategory.replaceAll("|", "\\|")} | ${validation.effectiveStatuses[f.id]} |`,
    ),
    "",
    "## Official sources checked",
    "",
    ...c.sources.map((s) => `- [${s.title}](${s.url}) — checked 2026-10-17.`),
    "",
    "## Decision required for publication",
    "",
    `Review this exact digest: \`${digest}\`. Approval must explicitly retain or correct these unknowns:`,
    "",
    "- `twente-bme-other-cost-main`: complete personalised additional cost is unknown; the monthly estimate does not close it.",
    "- `twente-bme-scholarship-main`: no applicant-specific 2027 scholarship award/eligibility/amount/deadline is confirmed.",
    "",
    "This decision covers controlled local catalogue publication only. It does not approve individual eligibility, paid AI, pilot or cloud deployment.",
    "",
  ].join("\n");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const original = JSON.parse(
    readFileSync("data/catalog/staging/catalog.v1.json", "utf8"),
  );
  const candidate = prepareCandidate(original);
  const report = candidateReport(candidate);
  if ([candidateFile, reportFile].some((file) => existsSync(file)))
    throw new Error(
      "Review candidate/report already exists; no files overwritten",
    );
  mkdirSync("data/catalog/review", { recursive: true });
  writeFileSync(candidateFile, `${JSON.stringify(candidate, null, 2)}\n`, {
    flag: "wx",
  });
  writeFileSync(reportFile, report, { flag: "wx" });
  console.log(
    JSON.stringify({
      candidateFile,
      reportFile,
      digest: catalogDigest(candidate),
      facts: candidate.facts.length,
      warnings: validateCatalog(candidate, reviewedOn).warnings.length,
    }),
  );
}
