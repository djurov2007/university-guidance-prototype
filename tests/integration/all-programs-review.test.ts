import { describe, expect, it } from "vitest";
import original from "../../data/catalog/staging/catalog.v1.json";
import candidateJson from "../../data/catalog/review/all-programs.2026-10-17.v1.0.3.json";
import published from "../../data/catalog/published/catalog.v1.json";
import { catalogSchema } from "@/features/catalog/schema";
import { catalogDigest, validateCatalog } from "@/server/catalog/validation";

const asOf = "2026-10-17";
const remaining = [
  "etf-si",
  "passau-cs",
  "bologna-clef",
  "tum-informatics",
  "bologna-im",
  "bologna-phd-cse",
];
const candidate = () => catalogSchema.parse(structuredClone(candidateJson));

describe("combined eight-program review candidate", () => {
  it("validates the exact reviewed inventory with only explicit unknown warnings", () => {
    const c = candidate();
    const result = validateCatalog(c, asOf);
    expect(result.ok).toBe(true);
    expect(c).toMatchObject({ version: "1.0.3", channel: "staging" });
    expect([
      c.programs.length,
      c.sources.length,
      c.facts.length,
      c.evidence.length,
      result.warnings.length,
    ]).toEqual([8, 31, 145, 128, 26]);
    expect(new Set(result.warnings.map((warning) => warning.code))).toEqual(
      new Set(["unknown"]),
    );
  });

  it("publishes the exact eight-program candidate content", () => {
    const c = candidate();
    const p = catalogSchema.parse(published);
    expect(validateCatalog(p, asOf).ok).toBe(true);
    expect(p).toMatchObject({ version: "1.0.3", channel: "published" });
    expect(p.programs).toEqual(c.programs);
    expect(p.intakes).toEqual(c.intakes);
    expect(p.sources).toEqual(c.sources);
    expect(p.facts).toEqual(c.facts);
    expect(p.evidence).toEqual(c.evidence);
  });

  it("preserves every remaining fact value and unknown reason", () => {
    const before = original.facts.filter((fact) =>
      remaining.includes(fact.programId),
    );
    const after = candidate().facts.filter((fact) =>
      remaining.includes(fact.programId),
    );
    expect(after.map((fact) => fact.id)).toEqual(before.map((fact) => fact.id));
    for (const fact of after) {
      const old = before.find((item) => item.id === fact.id)!;
      expect(fact.value).toEqual(old.value);
      expect(fact.unknownReason).toBe(old.unknownReason);
      expect(fact.checkedOn).toBe(asOf);
      expect(fact.checkedBy).toBe("agent");
    }
  });

  it("binds eight pending decisions to one exact digest and blocks promotion", () => {
    const c = candidate();
    expect(catalogDigest(c)).toBe(
      "68d9f119d9aeb00cc59410b5d0ad24be52755546f7a9327e5d0392fb31092e8d",
    );
    expect(c.reviews).toHaveLength(8);
    expect(
      c.reviews.every(
        (review) =>
          review.reviewer === "Viktor" &&
          review.decision === "pending" &&
          !review.checklistComplete &&
          review.contentDigest === catalogDigest(c) &&
          review.acceptedUnknownFactIds.length === 0,
      ),
    ).toBe(true);
    c.channel = "published";
    const issues = validateCatalog(c, asOf).issues;
    expect(
      issues.filter((issue) => issue.code === "human_review"),
    ).toHaveLength(8);
    const p = catalogSchema.parse(published);
    expect(catalogDigest(p)).toBe(catalogDigest(candidate()));
    expect(
      p.reviews.every(
        (review) =>
          review.reviewer === "Viktor" &&
          review.decision === "approved" &&
          review.checklistComplete &&
          review.contentDigest === catalogDigest(p),
      ),
    ).toBe(true);
    expect(
      p.reviews.reduce(
        (count, review) => count + review.acceptedUnknownFactIds.length,
        0,
      ),
    ).toBe(26);
  });

  it("does not treat the dated recheck as permanent freshness", () => {
    expect(validateCatalog(candidate(), "2026-10-24").ok).toBe(true);
    const later = validateCatalog(candidate(), "2026-10-25");
    expect(later.warnings.some((warning) => warning.code === "stale")).toBe(
      true,
    );
  });
});
