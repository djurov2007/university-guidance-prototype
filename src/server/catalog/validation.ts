import "server-only";
import { createHash } from "node:crypto";
import {
  catalogSchema,
  dateSchema,
  requiredPredicates,
  type CatalogSnapshot,
  type CatalogFact,
  type VerificationStatus,
} from "../../features/catalog/schema.ts";

export interface CatalogIssue {
  code: string;
  entityId: string;
  message: string;
}
export interface CatalogValidation {
  ok: boolean;
  issues: CatalogIssue[];
  warnings: CatalogIssue[];
  catalog: CatalogSnapshot | null;
  effectiveStatuses: Record<string, VerificationStatus>;
}
const day = (date: string) => Date.parse(`${date}T00:00:00Z`);
export function freshnessDays(predicate: CatalogFact["predicate"]): number {
  if (
    ["application_deadline", "scholarship", "intake_start"].includes(predicate)
  )
    return 7;
  if (
    [
      "tuition",
      "other_cost",
      "application_requirement",
      "institutional_requirement",
      "academic_year",
    ].includes(predicate)
  )
    return 30;
  return 90;
}
function factFreshnessDays(fact: CatalogFact, asOf: string): number {
  if (
    fact.predicate === "application_deadline" &&
    fact.value?.kind === "date"
  ) {
    const remaining = day(fact.value.date) - day(asOf);
    if (remaining >= 0 && remaining <= 7 * 86400000) return 1;
  }
  return freshnessDays(fact.predicate);
}
export function effectiveFactStatus(
  fact: CatalogFact,
  catalog: CatalogSnapshot,
  asOf: string,
): VerificationStatus {
  dateSchema.parse(asOf);
  if (fact.status !== "verified") return fact.status;
  const maxAge = factFreshnessDays(fact, asOf) * 86400000;
  const sources = catalog.evidence
    .filter((e) => e.factId === fact.id && e.relation === "supports")
    .map((e) => catalog.sources.find((s) => s.id === e.sourceId));
  const evidence = catalog.evidence.filter(
    (e) => e.factId === fact.id && e.relation === "supports",
  );
  if (sources.some((s) => s?.status === "conflicting")) return "conflicting";
  if (
    sources.some(
      (s) =>
        s?.status === "stale" || (s && day(asOf) - day(s.checkedOn) > maxAge),
    ) ||
    evidence.some((e) => day(asOf) - day(e.checkedOn) > maxAge) ||
    day(asOf) - day(fact.checkedOn) > maxAge
  )
    return "stale";
  if (!sources.length || sources.some((s) => !s || s.status !== "verified"))
    return "unverified";
  return "verified";
}
export function deadlineState(
  fact: CatalogFact,
  catalog: CatalogSnapshot,
  asOf: string,
): "unknown" | "closed" | "upcoming_or_today" {
  dateSchema.parse(asOf);
  if (
    fact.predicate !== "application_deadline" ||
    effectiveFactStatus(fact, catalog, asOf) !== "verified" ||
    fact.value?.kind !== "date"
  )
    return "unknown";
  return fact.value.date < asOf ? "closed" : "upcoming_or_today";
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
// Reviews and destination channel excluded; every content record and version included.
export function catalogDigest(catalog: CatalogSnapshot): string {
  const { reviews: _reviews, channel: _channel, ...content } = catalog;
  void _reviews;
  void _channel;
  return createHash("sha256").update(canonical(content)).digest("hex");
}
export function validateCatalog(
  input: unknown,
  asOf: string,
): CatalogValidation {
  dateSchema.parse(asOf);
  const issues: CatalogIssue[] = [],
    warnings: CatalogIssue[] = [];
  const fail = (code: string, entityId: string, message: string) =>
    issues.push({ code, entityId, message });
  const parsed = catalogSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        code: "schema",
        entityId: i.path.join("."),
        message: i.message,
      })),
      warnings,
      catalog: null,
      effectiveStatuses: {},
    };
  const c = parsed.data;
  const effectiveStatuses: Record<string, VerificationStatus> = {};
  for (const key of [
    "institutions",
    "programs",
    "intakes",
    "sources",
    "facts",
    "evidence",
    "reviews",
  ] as const) {
    const seen = new Set<string>();
    for (const entity of c[key]) {
      if (seen.has(entity.id))
        fail("duplicate_id", entity.id, `Duplicate in ${key}`);
      seen.add(entity.id);
    }
  }
  const institutions = new Map(c.institutions.map((i) => [i.id, i]));
  const programs = new Map(c.programs.map((p) => [p.id, p]));
  const intakes = new Map(c.intakes.map((i) => [i.id, i]));
  const sources = new Map(c.sources.map((s) => [s.id, s]));
  const facts = new Map(c.facts.map((f) => [f.id, f]));
  const checkDate = (id: string, date: string) => {
    if (date > asOf)
      fail(
        "future_check",
        id,
        "Retrieval/review/check/preparation cannot be in the future",
      );
  };
  checkDate("snapshot", c.preparedOn);
  for (const p of c.programs) {
    const institution = institutions.get(p.institutionId);
    if (!institution || institution.country !== p.country)
      fail(
        "program_institution",
        p.id,
        "Missing institution or country mismatch",
      );
    const pf = c.facts.filter((f) => f.programId === p.id);
    for (const predicate of requiredPredicates)
      if (!pf.some((f) => f.predicate === predicate))
        fail(
          "missing_fact",
          p.id,
          `Missing ${predicate}; record explicit unknown`,
        );
    if (!c.intakes.some((i) => i.programId === p.id))
      fail("missing_intake", p.id, "Intake/general-policy context required");
    for (const [predicate, expected] of [
      ["institution_name", institution?.name],
      ["name", p.name],
      ["level", p.level],
      ["country", p.country],
      ["city", p.city],
    ] as const) {
      if (
        !pf.some(
          (f) =>
            f.predicate === predicate &&
            f.value?.kind === "text" &&
            f.value.text === expected &&
            f.status === "verified",
        )
      )
        fail(
          "identity_fact",
          p.id,
          `${predicate} needs matching verified assertion`,
        );
    }
  }
  for (const intake of c.intakes) {
    if (!programs.has(intake.programId))
      fail("intake_program", intake.id, "Missing program");
    if (intake.scope === "year_bound" && !intake.academicYear)
      fail(
        "intake_year",
        intake.id,
        "Year-bound intake requires academic year",
      );
    if (intake.academicYear) {
      const [start, end] = intake.academicYear.split("/").map(Number);
      if (end !== (start ?? 0) + 1)
        fail(
          "intake_year",
          intake.id,
          "Academic year must span consecutive years",
        );
    }
    for (const predicate of [
      "academic_year",
      "intake_start",
      "tuition",
      "application_deadline",
    ] as const)
      if (
        !c.facts.some(
          (f) => f.intakeId === intake.id && f.predicate === predicate,
        )
      )
        fail("intake_fact", intake.id, `Missing scoped ${predicate}`);
    if (
      intake.academicYear &&
      !c.facts.some(
        (f) =>
          f.intakeId === intake.id &&
          f.predicate === "academic_year" &&
          f.value?.kind === "text" &&
          f.value.text === intake.academicYear &&
          f.status === "verified",
      )
    )
      fail(
        "intake_year_evidence",
        intake.id,
        "Intake year needs matching assertion",
      );
  }
  for (const source of c.sources) {
    checkDate(source.id, source.accessedOn);
    checkDate(source.id, source.checkedOn);
    if (source.checkedOn < source.accessedOn)
      fail("source_date", source.id, "Check precedes retrieval");
    const institution = institutions.get(source.institutionId);
    if (!institution)
      fail("source_institution", source.id, "Missing publisher institution");
    const host = new URL(source.url).hostname;
    if (
      source.authority === "official" &&
      !institution?.officialHosts.some(
        (h) => host === h || host.endsWith(`.${h}`),
      )
    )
      fail(
        "source_authority",
        source.id,
        "Official source outside reviewed publisher hosts",
      );
    for (const pid of source.programIds)
      if (programs.get(pid)?.institutionId !== source.institutionId)
        fail(
          "source_program",
          source.id,
          "Source scoped to missing/wrong institution program",
        );
    for (const iid of source.intakeIds)
      if (
        !intakes.has(iid) ||
        !source.programIds.includes(intakes.get(iid)!.programId)
      )
        fail("source_intake", source.id, "Invalid source intake reference");
  }
  for (const e of c.evidence) {
    checkDate(e.id, e.checkedOn);
    const f = facts.get(e.factId),
      s = sources.get(e.sourceId);
    if (!f || !s) {
      fail("evidence_reference", e.id, "Missing fact/source");
      continue;
    }
    if (
      !s.programIds.includes(f.programId) ||
      (f.intakeId && !s.intakeIds.includes(f.intakeId))
    )
      fail(
        "evidence_scope",
        e.id,
        "Evidence does not cover this program/intake",
      );
    if (e.checkedOn < s.accessedOn || f.checkedOn < e.checkedOn)
      fail("evidence_date", e.id, "Evidence/check ordering invalid");
    if (
      f.nature === "institutional" &&
      e.relation === "supports" &&
      s.authority !== "official"
    )
      fail(
        "unofficial_institutional",
        e.id,
        "Unofficial source cannot establish institutional rule",
      );
  }
  const groups = new Map<string, CatalogFact[]>();
  for (const f of c.facts) {
    checkDate(f.id, f.checkedOn);
    if (
      !programs.has(f.programId) ||
      (f.intakeId && intakes.get(f.intakeId)?.programId !== f.programId)
    )
      fail("fact_reference", f.id, "Invalid program/intake");
    if (
      [
        "academic_year",
        "intake_start",
        "tuition",
        "application_deadline",
        "scholarship",
        "other_cost",
      ].includes(f.predicate) &&
      !f.intakeId
    )
      fail(
        "fact_context",
        f.id,
        "Year/cost/deadline/funding needs intake or explicit general-policy context",
      );
    const supports = c.evidence.filter(
      (e) => e.factId === f.id && e.relation === "supports",
    );
    if (f.status !== "unknown" && !supports.length)
      fail(
        "unsourced_fact",
        f.id,
        "Every recorded assertion requires supporting evidence",
      );
    if (
      f.status === "verified" &&
      supports.some((e) => sources.get(e.sourceId)?.status !== "verified")
    )
      fail(
        "unverified_source",
        f.id,
        "Verified assertion needs verified sources",
      );
    if (
      c.evidence.some(
        (e) => e.factId === f.id && e.relation === "contradicts",
      ) &&
      f.status !== "conflicting"
    )
      fail(
        "contradiction_hidden",
        f.id,
        "Contradictory evidence requires visible conflicting status",
      );
    if (f.nature === "experience" && f.status === "verified")
      fail(
        "experience_verified",
        f.id,
        "Personal experience cannot become verified institutional fact",
      );
    effectiveStatuses[f.id] = effectiveFactStatus(f, c, asOf);
    if (effectiveStatuses[f.id] !== "verified")
      warnings.push({
        code: effectiveStatuses[f.id]!,
        entityId: f.id,
        message: f.unknownReason ?? f.note,
      });
    const key = canonical([
      f.programId,
      f.intakeId,
      f.predicate,
      f.qualifier,
      f.candidateCategory,
    ]);
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  for (const group of groups.values()) {
    const known = group.filter((f) => f.value !== null);
    if (new Set(known.map((f) => canonical(f.value))).size > 1)
      for (const f of known) {
        effectiveStatuses[f.id] = "conflicting";
        if (f.status !== "conflicting")
          fail(
            "unmarked_conflict",
            f.id,
            "Contradictory assertions in same scope require conflicting status",
          );
      }
    if (
      known.some((f) => f.status === "conflicting") &&
      new Set(known.map((f) => canonical(f.value))).size < 2
    )
      fail(
        "conflict_evidence",
        known[0]!.id,
        "Conflict needs distinct recorded assertions in same scope",
      );
  }
  const digest = catalogDigest(c);
  for (const r of c.reviews) {
    checkDate(r.id, r.reviewedOn);
    if (
      r.reviewedOn < c.preparedOn ||
      c.facts.some(
        (f) => f.programId === r.programId && f.checkedOn > r.reviewedOn,
      )
    )
      fail(
        "review_date",
        r.id,
        "Review cannot precede preparation or assertion checks",
      );
    if (!programs.has(r.programId))
      fail("review_program", r.id, "Missing program");
    for (const fid of r.acceptedUnknownFactIds)
      if (
        facts.get(fid)?.programId !== r.programId ||
        facts.get(fid)?.status !== "unknown"
      )
        fail(
          "review_unknown",
          r.id,
          "Unknown acceptance must reference own unknown fact",
        );
  }
  for (const p of c.programs) {
    const pf = c.facts.filter((f) => f.programId === p.id);
    if (
      p.verification === "fully_verified" &&
      pf.some((f) => effectiveStatuses[f.id] !== "verified")
    )
      fail(
        "fully_verified",
        p.id,
        "Full verification requires every assertion verified, sourced and fresh",
      );
    if (c.channel === "published") {
      if (
        pf.some(
          (f) => !["verified", "unknown"].includes(effectiveStatuses[f.id]!),
        )
      )
        fail(
          "publication_status",
          p.id,
          "Unverified, stale or conflicting assertions block publication",
        );
      const r = c.reviews.find(
        (r) =>
          r.programId === p.id &&
          r.reviewerKind === "human" &&
          r.decision === "approved" &&
          r.checklistComplete &&
          r.contentDigest === digest &&
          day(asOf) - day(r.reviewedOn) <= 14 * 86400000,
      );
      if (!r)
        fail(
          "human_review",
          p.id,
          "Current human approval of this exact snapshot required",
        );
      else
        for (const f of pf.filter((f) => f.status === "unknown"))
          if (!r.acceptedUnknownFactIds.includes(f.id))
            fail(
              "publication_unknown",
              f.id,
              "Human must explicitly accept visible unknown",
            );
    }
  }
  return {
    ok: issues.length === 0,
    issues,
    warnings,
    catalog: c,
    effectiveStatuses,
  };
}
