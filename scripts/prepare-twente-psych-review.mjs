import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  catalogDigest,
  deadlineState,
  validateCatalog,
} from "../src/server/catalog/validation.ts";
import { compileCatalogForMatching } from "../src/server/matching/catalog-adapter.ts";

// Reproduce the dated, manually researched candidate. Never fetch, promote,
// refresh to today's date, or rewrite existing artifacts/operational catalogues.
export const reviewedOn = "2026-10-17";
export const candidateFile =
  "data/catalog/review/twente-psych.2026-10-17.v1.0.1.json";
export const reportFile =
  "docs/data/TWENTE_PSYCHOLOGY_FINAL_REVIEW_2026-10-17.md";

export function prepareCandidate(original) {
  const source = validateCatalog(original, reviewedOn);
  if (!source.ok || !source.catalog)
    throw new Error("Original catalogue integrity failed");
  if (
    catalogDigest(source.catalog) !==
    "dd7e56a2d25e68de1d499e85ce0c32beeb7af51802d9bd1898a5f5982c6f24bb"
  )
    throw new Error("Original snapshot changed; review changes explicitly");
  const id = "twente-psych";
  const c = structuredClone(source.catalog);
  c.version = "1.0.1";
  c.preparedOn = reviewedOn;
  c.channel = "staging";
  c.programs = c.programs.filter((p) => p.id === id);
  c.institutions = c.institutions.filter((i) => i.id === "twente");
  c.intakes = c.intakes.filter((i) => i.programId === id);
  c.sources = c.sources.filter((s) => s.programIds.includes(id));
  c.facts = c.facts.filter((f) => f.programId === id);
  c.evidence = c.evidence.filter((e) => c.facts.some((f) => f.id === e.factId));
  c.reviews = [];
  for (const s of c.sources) {
    s.programIds = [id];
    s.intakeIds = ["twente-psych-intake"];
    s.accessedOn = reviewedOn;
    s.checkedOn = reviewedOn;
  }
  c.sources.push({
    id: "twente-psych-fee-conditions",
    institutionId: "twente",
    programIds: [id],
    intakeIds: ["twente-psych-intake"],
    title: "UT statutory and institutional tuition fee conditions",
    url: "https://www.utwente.nl/en/education/student-services/upcoming-students/money-matters/tuitionfees/",
    publisher: "University of Twente",
    authority: "official",
    authorityReason:
      "University Student Services fee conditions linked from the official Psychology fee page. Conditions do not establish an individual applicant's classification.",
    status: "verified",
    accessedOn: reviewedOn,
    checkedOn: reviewedOn,
  });
  for (const f of c.facts) {
    f.checkedOn = reviewedOn;
    // Agent recheck and earlier human decisions are distinct; new digest pending.
    f.checkedBy = "agent";
    if (f.candidateCategory === "all applicants")
      f.candidateCategory = "English-track applicants; September 2027 intake";
    if (f.qualifier === "diploma") {
      f.candidateCategory =
        "English-track applicants with an international secondary-school diploma";
      f.note =
        "VWO equivalence is assessed individually by the institution; country/diploma route and supporting documents require manual review. Not a universal restriction on Dutch VWO/HBO routes.";
    }
    if (f.predicate === "tuition" && f.qualifier === "main") {
      f.candidateCategory =
        "Non-EU/EEA applicants assessed as liable for the institutional fee; September 2027 entry";
      f.note =
        "2027/28 annual institutional fee only. Residence, prior-degree and exception conditions require institutional assessment; nationality alone does not select this rate. Later-year rates and full-degree total are not inferred.";
    }
    if (f.predicate === "tuition" && f.qualifier === "statutory") {
      f.candidateCategory =
        "Applicants individually meeting statutory-fee conditions; September 2027 entry";
      f.note =
        "2027/28 annual statutory fee only. Nationality or qualifying residence, previous comparable degree and applicable exceptions need manual assessment. EU/EEA citizenship alone is insufficient; no full-degree total inferred.";
    }
    if (["english", "mathematics"].includes(f.qualifier))
      f.note =
        "Requirement applies subject to prior-education route and applicable exemptions. Exact evidence and candidate-specific satisfaction remain unresolved/manual; English teaching is not evidence of proficiency.";
    if (f.predicate === "application_deadline") {
      f.value.note =
        "Studielink deadline explicitly 23:59 CET; OSIRIS and essential documents due 15 January 2027, without an independently stated OSIRIS cutoff time. 30 November 2026 is a recommendation for international diplomas.";
      f.note = f.value.note;
    }
  }
  for (const e of c.evidence) {
    e.checkedOn = reviewedOn;
    if (e.factId === "twente-psych-academic-year-main") {
      e.sourceId = "twente-psych-fees";
      e.locator = "2027-2028 (Sep-Aug) annual fee table";
      e.paraphrase =
        "Academic-year label 2027-2028 is explicit in the fee table; the programme start is separately stated as 1 September 2027.";
    }
    if (e.factId === "twente-psych-application-deadline-main") {
      e.locator =
        "Apply for the English track: steps 1 (Studielink) and 2 (OSIRIS)";
      e.paraphrase =
        "Studielink closes 15 January 2027 at 23:59 CET; OSIRIS and essential uploads must be completed by 15 January. International diplomas: 30 November 2026 is recommended, not the final deadline.";
    }
    if (e.factId === "twente-psych-application-requirement-diploma") {
      e.locator = "Admission requirements > International diploma";
      e.paraphrase =
        "International secondary diplomas must be equivalent to Dutch VWO; the institution determines individual eligibility. Other prior-education routes are listed separately.";
    }
  }
  for (const qualifier of ["main", "statutory"])
    c.evidence.push({
      id: `psych-fee-conditions-${qualifier}-20261017`,
      factId: `twente-psych-tuition-${qualifier}`,
      sourceId: "twente-psych-fee-conditions",
      relation: "context",
      locator:
        "Most frequently Questions about tuition fees > What kind of tuition fees do I need to pay?",
      paraphrase:
        "Student Services lists nationality/qualifying residence, prior comparable degree and exceptions. Classification requires manual assessment; this context does not assign a rate to a person.",
      checkedOn: reviewedOn,
    });
  c.reviews.push({
    id: "psych-final-review-pending-20261017",
    programId: id,
    reviewer: "Viktor",
    reviewerKind: "human",
    decision: "pending",
    reviewedOn,
    contentDigest: catalogDigest(c),
    checklistComplete: false,
    acceptedUnknownFactIds: [],
    note: "Reviewer assigned, final decision not recorded. Earlier chat decisions cover the original 1.0.0 snapshot, not this revised digest. Earlier acceptance of other-cost and scholarship unknowns is recorded in the review worksheet. No publication approval.",
  });
  return c;
}

export function candidateReport(c) {
  const result = validateCatalog(c, reviewedOn);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  const compiled = compileCatalogForMatching(c, reviewedOn).programs[0];
  const publication = validateCatalog(
    { ...c, channel: "published" },
    reviewedOn,
  );
  const clean = (s) =>
    String(s ?? "")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
  const display = (f) => {
    const v = f.value;
    return !v
      ? f.unknownReason
      : v.kind === "text"
        ? v.text
        : v.kind === "list"
          ? v.items.join(", ")
          : v.kind === "money"
            ? `${v.amount} ${v.currency}/${v.period}; ${v.basis}`
            : v.kind === "date"
              ? `${v.date}; ${v.time ?? "time unknown"}; ${v.timezone ?? "zone unknown"}`
              : `${v.amount} ${v.unit}`;
  };
  return [
    "# Twente Psychology — final candidate review",
    "",
    "2026-10-17, D-038. **Prepared for Viktor's final review; not approved or published.**",
    "",
    `Candidate: [single-programme JSON](../../${candidateFile}), version **${c.version}**, staging. Content digest: \`${catalogDigest(c)}\`.`,
    "",
    "The earlier 18 human decisions and two individually accepted unknowns are retained in the [original review record](CATALOG_REVIEW_PACKET_2026-10-15.md). This new digest still has a pending review; no signature was transferred automatically. This is a separate single-programme candidate, not a replacement of the eight-programme catalogue.",
    "",
    "## Changes from the original snapshot",
    "",
    "- Programme, intake, 18 fact IDs, recorded names/dates/amounts/units and unknown reasons preserved; applicability and explanatory notes refined as listed below. Subset version 1.0.1 and preparation date 2026-10-17.",
    "- Four primary official sources reopened and fact/source/supporting evidence checks dated 2026-10-17. Agent checks remain agent checks. An additional Student Services source records fee-condition context; no exhaustive eligibility rule is asserted.",
    "- Diploma applicability narrowed to international secondary qualifications; other VWO/HBO routes are not rejected by that statement.",
    "- Fee categories explicitly require individual institutional assessment; no citizenship-to-price shortcut. Annual EUR 12,652 / EUR 2,771 are not total study costs or a fee quote for a particular person.",
    "- Academic-year evidence points to the explicit 2027-2028 fee table, rather than claiming the programme page contains an academic-year table.",
    "- Studielink's explicit 23:59 CET time is distinguished from OSIRIS's stated date. No independent OSIRIS cutoff time is invented.",
    "- Other costs and scholarship remain unknown. No country-specific diploma equivalence, test threshold or automatic candidate eligibility added.",
    "",
    "## Validator and publication gate",
    "",
    `At ${reviewedOn}: integrity **${result.ok ? "PASS" : "FAIL"}**, ${c.programs.length} programme, ${c.facts.length} facts, ${c.sources.length} sources, ${c.evidence.length} evidence links. ${Object.values(result.effectiveStatuses).filter((s) => s === "verified").length} verified; ${result.warnings.length} warnings (the two visible unknowns), no stale/conflicting facts.`,
    "",
    `A proposed channel-only switch to published is correctly **REJECTED**: ${[...new Set(publication.issues.map((i) => i.code))].join(", ")}. The actual published file is not modified.`,
    "",
    `Deadline state: ${deadlineState(
      c.facts.find((f) => f.predicate === "application_deadline"),
      c,
      reviewedOn,
    )}; this day-level status is not a promise of complete/open application or admission. Next critical recheck: **2026-10-24** inclusive (start/deadline stale from 2026-10-25 without recheck). Recheck again before actual use.`,
    "",
    "## Candidate applicability and matching limits",
    "",
    "| Item | Applicability / execution state |",
    "| --- | --- |",
    "| Track/intake | English track, September 2027, 2027/2028; Dutch track and 2028 excluded |",
    "| Institutional fee | Non-EU/EEA institutional-fee category; residence/prior-degree/exceptions unresolved; manual assessment |",
    "| Statutory fee | Conditional institutional eligibility assessment; EU/EEA nationality alone insufficient |",
    "| Diploma | International secondary qualification equivalent to VWO; country/diploma/document review required |",
    "| English / mathematics | Existing general requirements; individual evidence/exemptions unresolved |",
    "| Selection | 250 places; selection and formal enrolment required; no admission guarantee |",
    "| Other costs / funding | Unknown, never zero or promised scholarship |",
    "",
    `Current typed compiler result: cost=${JSON.stringify(compiled.cost)}, cost candidateScope=${compiled.costProof.candidateScope}, requirementsComplete=${compiled.requirementsComplete}, ${compiled.rules.length} manual requirements/deadline checks. Funding=${compiled.funding}. These safe unresolved states are preserved. Textual candidateCategory is documentation, not an executable eligibility binding. Approval of data does not make personalised matching ready.`,
    "",
    "## All eighteen assertions",
    "",
    "| Fact ID | Value / unknown | Category | Effective status | Note | Evidence |",
    "| --- | --- | --- | --- | --- | --- |",
    ...c.facts.map(
      (f) =>
        `| ${f.id} | ${clean(display(f))} | ${clean(f.candidateCategory)} | ${result.effectiveStatuses[f.id]} | ${clean(f.note)} | ${clean(
          c.evidence
            .filter((e) => e.factId === f.id)
            .map((e) => `${e.relation}: ${e.sourceId} — ${e.locator}`)
            .join("; "),
        )} |`,
    ),
    "",
    "## Official sources actually reopened",
    "",
    ...c.sources.map(
      (s) => `- [${s.title}](${s.url}) — agent access/check 2026-10-17.`,
    ),
    "",
    "Paraphrases and locators are review notes, not copied pages or an archived proof of future page contents. All known assertion values were compared against the relevant sections; no web availability-only refresh.",
    "",
    "## Final human decision to record",
    "",
    "Assigned reviewer: Viktor. Decision: **PENDING**. Review this exact JSON/digest and the changed applicability/evidence/notes above; confirm or correct the two unknown acceptances below. A final approval must explicitly cover this revised content and complete the applicable publication checklist. No channel promotion is performed by the preparation command.",
    "",
    "- twente-psych-other-cost-main: retain visible unknown because complete living/insurance/travel/application costs are not established; no complete affordability claim.",
    "- twente-psych-scholarship-main: retain visible unknown because no specific 2027 undergraduate award is confirmed; not evidence that scholarships do not exist.",
    "",
    "Reproduce preparation with `node --conditions=react-server scripts/prepare-twente-psych-review.mjs` (creates new files only, refuses existing outputs). Run `node --conditions=react-server scripts/check-catalog.mjs --file data/catalog/review/twente-psych.2026-10-17.v1.0.1.json --as-of 2026-10-17` to verify this candidate. Reproduction replays this dated research; it does not perform a new source check. [Execution plan](../plans/TWENTE_PSYCHOLOGY_REVIEW_PLAN.md).",
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
  const c = prepareCandidate(original);
  const report = candidateReport(c);
  // Check both outputs first. Never overwrite earlier human decisions.
  const { existsSync } = await import("node:fs");
  if ([candidateFile, reportFile].some((f) => existsSync(f)))
    throw new Error(
      "Review candidate/report already exists; no files overwritten",
    );
  mkdirSync("data/catalog/review", { recursive: true });
  writeFileSync(candidateFile, JSON.stringify(c, null, 2) + "\n", {
    flag: "wx",
  });
  writeFileSync(reportFile, report, { flag: "wx" });
  console.log(
    JSON.stringify({
      candidateFile,
      reportFile,
      digest: catalogDigest(c),
      warnings: validateCatalog(c, reviewedOn).warnings.length,
    }),
  );
}
