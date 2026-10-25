import { describe, expect, it } from "vitest";
import staging from "../../data/catalog/staging/catalog.v1.json";
import published from "../../data/catalog/published/catalog.v1.json";
import { catalogSchema, type CatalogSnapshot } from "@/features/catalog/schema";
import {
  catalogDigest,
  deadlineState,
  effectiveFactStatus,
  validateCatalog,
} from "@/server/catalog/validation";
import { readLocalCatalog } from "@/server/catalog/local-repository";

const asOf = "2026-10-06";
const fixture = () => catalogSchema.parse(structuredClone(staging));
const codes = (c: unknown, date = asOf) =>
  validateCatalog(c, date).issues.map((i) => i.code);
// Broad synthetic approvals below exist only in this test. The actual published
// snapshot now has explicit human approvals for all eight programmes.
function approvedFixture(): CatalogSnapshot {
  const c = fixture();
  c.channel = "published";
  const digest = catalogDigest(c);
  c.reviews = c.programs.map((p, i) => ({
    id: `review-${i}`,
    programId: p.id,
    reviewer: "Synthetic human reviewer for unit test",
    reviewerKind: "human",
    decision: "approved",
    reviewedOn: asOf,
    contentDigest: digest,
    checklistComplete: true,
    acceptedUnknownFactIds: c.facts
      .filter((f) => f.programId === p.id && f.status === "unknown")
      .map((f) => f.id),
    note: "Test only; not a real review",
  }));
  return c;
}
describe("controlled catalog", () => {
  it("keeps the original staging snapshot separate from eight approved publications", () => {
    expect(validateCatalog(staging, asOf).ok).toBe(true);
    const c = fixture();
    expect(c.programs.filter((p) => p.level === "undergraduate")).toHaveLength(
      4,
    );
    expect(c.programs.filter((p) => p.level === "master")).toHaveLength(3);
    expect(c.programs.filter((p) => p.level === "phd")).toHaveLength(1);
    expect(new Set(c.programs.map((p) => p.country)).size).toBe(4);
    expect(
      readLocalCatalog("published", "2026-10-17").catalog?.programs,
    ).toHaveLength(8);
    expect(readLocalCatalog("staging", asOf).catalog?.programs).toHaveLength(8);
    expect(published.channel).toBe("published");
  });
  it("never fully verifies an unsourced program", () => {
    const c = fixture();
    c.programs[0]!.verification = "fully_verified";
    c.evidence = c.evidence.filter(
      (e) =>
        !c.facts.some(
          (f) => f.programId === c.programs[0]!.id && f.id === e.factId,
        ),
    );
    expect(codes(c)).toContain("unsourced_fact");
    expect(codes(c)).toContain("fully_verified");
  });
  it("requires a separate known or unknown assertion for every mandatory field", () => {
    const c = fixture();
    c.facts = c.facts.filter(
      (f) => !(f.programId === "etf-si" && f.predicate === "scholarship"),
    );
    expect(codes(c)).toContain("missing_fact");
  });
  it("does not turn missing deadline into a date or zero", () => {
    const c = fixture();
    const f = c.facts.find(
      (f) =>
        f.programId === "passau-cs" && f.predicate === "application_deadline",
    )!;
    expect(f.value).toBeNull();
    expect(deadlineState(f, c, asOf)).toBe("unknown");
    f.value = {
      kind: "date",
      date: "2027-05-31",
      time: null,
      timezone: null,
      note: "Invented",
    };
    expect(codes(c)).toContain("schema");
  });
  it("keeps stale data visibly stale without rewriting historical values", () => {
    const c = fixture();
    const f = c.facts.find(
      (f) => f.predicate === "tuition" && f.programId === "twente-psych",
    )!;
    const value = structuredClone(f.value);
    expect(effectiveFactStatus(f, c, "2026-11-06")).toBe("stale");
    expect(validateCatalog(c, "2026-11-06").effectiveStatuses[f.id]).toBe(
      "stale",
    );
    expect(f.value).toEqual(value);
    f.status = "stale";
    expect(effectiveFactStatus(f, c, asOf)).toBe("stale");
  });
  it("checks evidence freshness even when source/fact dates are newer", () => {
    const c = fixture();
    const f = c.facts.find(
      (f) => f.predicate === "application_deadline" && f.value,
    )!;
    const e = c.evidence.find((e) => e.factId === f.id)!;
    e.checkedOn = "2026-09-01";
    expect(effectiveFactStatus(f, c, asOf)).toBe("stale");
    expect(codes(c)).toContain("evidence_date");
  });
  it("retains both conflicting assertions and rejects hidden conflicts", () => {
    const c = fixture();
    const f = c.facts.find(
      (f) => f.predicate === "tuition" && f.value?.kind === "money",
    )!;
    const other = structuredClone(f);
    other.id += "-conflict";
    if (other.value?.kind === "money") other.value.amount += 1;
    c.facts.push(other);
    const e = structuredClone(c.evidence.find((e) => e.factId === f.id)!);
    e.id += "-conflict";
    e.factId = other.id;
    c.evidence.push(e);
    expect(codes(c)).toContain("unmarked_conflict");
    f.status = "conflicting";
    other.status = "conflicting";
    const result = validateCatalog(c, asOf);
    expect(result.ok).toBe(true);
    expect(result.effectiveStatuses[f.id]).toBe("conflicting");
    expect(result.effectiveStatuses[other.id]).toBe("conflicting");
    c.channel = "published";
    expect(codes(c)).toContain("publication_status");
  });
  it("does not call distinct nationality fee rates a conflict", () => {
    const result = validateCatalog(fixture(), asOf);
    expect(Object.values(result.effectiveStatuses)).not.toContain(
      "conflicting",
    );
  });
  it("never treats unofficial anecdotes as institutional evidence", () => {
    const c = fixture();
    c.sources[0]!.authority = "unofficial";
    expect(codes(c)).toContain("unofficial_institutional");
    c.sources[0]!.authority = "official";
    c.sources[0]!.url = "https://etf.bg.ac.rs.attacker.example/program";
    expect(codes(c)).toContain("source_authority");
  });
  it("rejects evidence from wrong program or intake and unknown references", () => {
    const c = fixture();
    c.evidence[0]!.sourceId = "tum-program";
    expect(codes(c)).toContain("evidence_scope");
    c.evidence[0]!.sourceId = "missing-source";
    expect(codes(c)).toContain("evidence_reference");
    c.channel = "published";
    expect(codes(c)).toContain("evidence_reference");
  });
  it("requires year evidence and retains historical deadlines as closed", () => {
    const c = fixture();
    const f = c.facts.find(
      (f) =>
        f.programId === "bologna-im" && f.predicate === "application_deadline",
    )!;
    expect(deadlineState(f, c, asOf)).toBe("closed");
    expect(f.value?.kind === "date" && f.value.date).toBe("2026-04-08");
    c.intakes.find((i) => i.programId === "bologna-im")!.academicYear =
      "2027/2028";
    expect(codes(c)).toContain("intake_year_evidence");
  });
  it("rejects duplicate IDs, unsupported currency/level, unsafe URLs and dates", () => {
    const c = fixture();
    c.programs.push(c.programs[0]!);
    expect(codes(c)).toContain("duplicate_id");
    const bad = structuredClone(staging);
    bad.programs[0]!.level = "postdoc";
    expect(codes(bad)).toContain("schema");
    const money = structuredClone(staging) as unknown as Record<
      string,
      unknown
    >;
    const f = (
      money.facts as { value: { kind: string; currency?: string } | null }[]
    ).find((f) => f.value?.kind === "money")!;
    f.value!.currency = "XYZ";
    expect(codes(money)).toContain("schema");
    const dates = fixture();
    dates.sources[0]!.checkedOn = "2026-02-30";
    expect(codes(dates)).toContain("schema");
    dates.sources[0]!.checkedOn = "2026-10-07";
    expect(codes(dates)).toContain("future_check");
    dates.sources[0]!.url = "javascript:alert(1)";
    expect(codes(dates)).toContain("schema");
  });
  it("separates fee components and estimates from tuition", () => {
    const c = fixture();
    const fee = c.facts.find(
      (f) => f.value?.kind === "money" && f.value.basis === "fee",
    )!;
    fee.predicate = "tuition";
    expect(codes(c)).toContain("schema");
  });
  it("does not publish on schema success, agent approval or incomplete human review", () => {
    const c = fixture();
    c.channel = "published";
    expect(catalogSchema.safeParse(c).success).toBe(true);
    expect(codes(c)).toContain("human_review");
    const approved = approvedFixture();
    approved.reviews[0]!.reviewerKind = "agent";
    expect(codes(approved)).toContain("human_review");
    approved.reviews[0]!.reviewerKind = "human";
    approved.reviews[0]!.checklistComplete = false;
    expect(codes(approved)).toContain("human_review");
  });
  it("requires explicit human acceptance of each unknown", () => {
    const c = approvedFixture();
    expect(validateCatalog(c, asOf).ok).toBe(true);
    c.reviews[0]!.acceptedUnknownFactIds = [];
    expect(codes(c)).toContain("publication_unknown");
  });
  it("invalidates approval after any content edit or a stale check", () => {
    const c = approvedFixture();
    c.facts[0]!.note = "Changed after review";
    expect(codes(c)).toContain("human_review");
    const stale = approvedFixture();
    expect(codes(stale, "2026-11-06")).toContain("publication_status");
    expect(codes(stale, "2026-11-06")).toContain("human_review");
  });
  it("rejects dangling published fact/program references before use", () => {
    const c = approvedFixture();
    c.facts[0]!.programId = "missing-program";
    expect(codes(c)).toContain("fact_reference");
  });
  it("requires a daily recheck near a deadline and never treats stale as open", () => {
    const c = fixture();
    const f = c.facts.find(
      (f) =>
        f.programId === "bologna-phd-cse" &&
        f.predicate === "application_deadline",
    )!;
    expect(effectiveFactStatus(f, c, "2026-10-07")).toBe("verified");
    expect(effectiveFactStatus(f, c, "2026-10-08")).toBe("stale");
    expect(deadlineState(f, c, "2026-10-08")).toBe("unknown");
  });
  it("rejects a claimed review before the content was prepared", () => {
    const c = approvedFixture();
    c.reviews[0]!.reviewedOn = "2026-10-05";
    expect(codes(c)).toContain("review_date");
  });
});
