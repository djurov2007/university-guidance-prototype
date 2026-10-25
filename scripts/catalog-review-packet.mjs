import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  validateCatalog,
  catalogDigest,
  deadlineState,
} from "../src/server/catalog/validation.ts";
const args = process.argv.slice(2),
  index = args.indexOf("--as-of");
const asOf =
  index < 0 ? new Date().toISOString().slice(0, 10) : args[index + 1];
const result = validateCatalog(
  JSON.parse(
    readFileSync(resolve("data/catalog/staging/catalog.v1.json"), "utf8"),
  ),
  asOf,
);
if (!result.ok || !result.catalog)
  throw new Error("Catalogue failed integrity validation.");
const c = result.catalog,
  digest = catalogDigest(c),
  rows = [];
const clean = (value) =>
  String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
const display = (v) =>
  !v
    ? "Unknown"
    : v.kind === "text"
      ? v.text
      : v.kind === "list"
        ? v.items.join(", ")
        : v.kind === "date"
          ? `${v.date}; ${v.time ?? "time unknown"}; ${v.timezone ?? "zone unknown"}`
          : v.kind === "money"
            ? `${v.amount} ${v.currency}/${v.period}; ${v.basis}; ${v.note}`
            : `${v.amount} ${v.unit}`;
rows.push(
  `# Catalogue human review packet — ${asOf}`,
  "",
  `Assigned reviewer: **Viktor**, selected by Viktor on 2026-10-15. **Review NOT COMPLETED; publication NOT APPROVED.** This is a worksheet, not an approval record.`,
  "",
  `Source snapshot: [staging JSON](../../data/catalog/staging/catalog.v1.json), version ${c.version}; digest \`${digest}\`. ${c.programs.length} programmes, ${c.sources.length} sources, ${c.facts.length} assertions. Original dates retained. ${result.warnings.length} validation warnings at this date.`,
  "",
  "Read [source recheck](SOURCE_RECHECK_2026-10-15.md), [full human checklist](CATALOG_REVIEW.md) and [freshness policy](FRESHNESS_POLICY.md). Every row below is pending human review. Inspect evidence in its original context; a source link or old verified flag is not a new approval. Unknowns must be explicitly accepted individually, with reasons. Stale facts require refreshed evidence or a supported revision, not a signature overriding freshness.",
  "",
  "## How to complete this packet",
  "",
  "1. Begin with Twente Psychology and Biomedical Engineering, which have explicit 2027 records. Historical 2026 calls must remain historical.",
  "2. For each assertion, check programme/track, applicant category, intake/year, source section, value/units and status. Enter corrections or a human review decision in the last column. Read all unknown reasons.",
  "3. Complete the per-programme review form and checklist. Merely placing a name in this worksheet does not create an approved JSON review or publish anything.",
  "4. If any content/date changes, prepare a new staging version, regenerate the digest and repeat final review. Do not approve this digest after modifying its contents.",
  "5. Publication additionally requires fresh effective statuses, correctly typed applicant/fee/requirement bindings, and actual human approval in the catalogue schema. Existing matching intentionally treats unresolved prose/category bindings as unknown.",
  "",
  "## Programme inventory",
  "",
  "| Programme | Intake context | Unknown IDs | Effective stale IDs |",
  "| --- | --- | --- | --- |",
);
for (const p of c.programs) {
  const facts = c.facts.filter((f) => f.programId === p.id);
  rows.push(
    `| ${clean(p.name)} (${p.id}) | ${clean(
      c.intakes
        .filter((i) => i.programId === p.id)
        .map(
          (i) => `${i.id}: ${i.academicYear ?? "general policy"}; ${i.label}`,
        )
        .join("; "),
    )} | ${facts.filter((f) => f.status === "unknown").length} | ${facts.filter((f) => result.effectiveStatuses[f.id] === "stale").length} |`,
  );
}
for (const p of c.programs) {
  const facts = c.facts.filter((f) => f.programId === p.id);
  rows.push(
    "",
    `## ${p.name} — ${p.id}`,
    "",
    `${p.level}; ${p.country}, ${p.city}. Editorial classification: ${p.field} / ${p.subfield}. ${p.notes}`,
    "",
    "| Human review field | Value to complete |",
    "| --- | --- |",
    "| Reviewer | Viktor (assigned; not yet reviewed) |",
    "| Date / role | Pending |",
    `| Exact version and digest | ${c.version} / ${digest} |`,
    "| Decision: pending / rejected / approved | Pending |",
    "| Checklist complete | No |",
    "| Accepted unknown fact IDs with an individual reason | Pending; none accepted yet |",
    "| Applicant category / intake covered | Pending |",
    "| Corrections, original-language checks, next check date | Pending |",
    "",
    "### All assertions and evidence",
    "",
    "| Fact ID / predicate | Recorded value or unknown reason | Applicant / intake / nature | Recorded → effective status; last check | Evidence section | Human decision / correction |",
    "| --- | --- | --- | --- | --- | --- |",
  );
  for (const f of facts) {
    const evidence =
      c.evidence
        .filter((e) => e.factId === f.id)
        .map((e) => {
          const s = c.sources.find((s) => s.id === e.sourceId);
          return `[${s.id}](${s.url}) — ${e.relation}; ${clean(e.locator)}; ${e.checkedOn}`;
        })
        .join("<br>") || "No supporting evidence";
    rows.push(
      `| ${f.id} / ${f.predicate} | ${clean(display(f.value))}; ${clean(f.unknownReason ?? f.note)} | ${clean(f.candidateCategory)}; ${f.intakeId ?? "programme-wide"}; ${f.nature} | ${f.status} → ${result.effectiveStatuses[f.id]}; ${f.checkedOn} / ${f.checkedBy}${f.predicate === "application_deadline" ? `; deadline state: ${deadlineState(f, c, asOf)}` : ""} | ${evidence} | Pending |`,
    );
  }
  rows.push("", "### Unknowns requiring an explicit human decision", "");
  for (const f of facts.filter((f) => f.status === "unknown"))
    rows.push(
      `- [ ] ${f.id}: ${f.unknownReason} Acceptance reason / correction: pending.`,
    );
  rows.push("", "### Freshness blockers", "");
  const stale = facts.filter((f) => result.effectiveStatuses[f.id] === "stale");
  rows.push(
    stale.length
      ? stale
          .map(
            (f) =>
              `- ${f.id}: refresh fact, supporting source and evidence as applicable; retain exact year/round.`,
          )
          .join("\n")
      : "No effectively stale assertions at this dated check; unknowns, individual applicability and human review remain unresolved.",
  );
}
rows.push(
  "",
  "## Scope and integrity",
  "",
  "This generator performs no fetch, database import, approval, catalogue mutation or publication. It derives the worksheet from the exact staging snapshot. The companion source recheck is separately authored agent research. All 142 rows remain pending human judgement. Human decisions must be applied through a reviewed catalogue change; this worksheet alone does not bypass any product gate.",
  "",
);
const output = rows.join("\n");
if (args.includes("--write")) {
  const file = resolve(`docs/data/CATALOG_REVIEW_PACKET_${asOf}.md`);
  writeFileSync(file, output, { flag: "wx" });
  console.log(
    JSON.stringify({
      file,
      programmes: c.programs.length,
      facts: c.facts.length,
      digest,
      warnings: result.warnings.length,
    }),
  );
} else process.stdout.write(output);
