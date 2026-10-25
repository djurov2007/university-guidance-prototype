import { describe, expect, it } from "vitest";
import original from "../../data/catalog/staging/catalog.v1.json";
import rawCandidate from "../../data/catalog/review/twente-psych.2026-10-17.v1.0.1.json";
import published from "../../data/catalog/published/catalog.v1.json";
import { catalogSchema } from "@/features/catalog/schema";
import { catalogDigest, validateCatalog } from "@/server/catalog/validation";
import {
  compileCatalogForMatching,
  readPublishedMatchingCatalog,
} from "@/server/matching/catalog-adapter";

const asOf = "2026-10-17";
const candidate = () => catalogSchema.parse(structuredClone(rawCandidate));
const unknowns = [
  "twente-psych-other-cost-main",
  "twente-psych-scholarship-main",
];

describe("dated Twente Psychology review candidate", () => {
  it("retains the approved Psychology content in the combined publication", () => {
    const c = catalogSchema.parse(published);
    const psych = candidate();
    expect(validateCatalog(c, asOf).ok).toBe(true);
    expect(
      validateCatalog(c, "2026-10-16").issues.some(
        (issue) => issue.code === "future_check",
      ),
    ).toBe(true);
    expect(c.programs.slice(0, 2).map((p) => p.id)).toEqual([
      "twente-psych",
      "twente-bme",
    ]);
    expect(c.facts.filter((f) => f.programId === "twente-psych")).toEqual(
      psych.facts,
    );
    expect(
      c.sources.filter((s) => s.programIds.includes("twente-psych")),
    ).toEqual(psych.sources);
    expect(
      c.evidence.filter((e) => psych.facts.some((f) => f.id === e.factId)),
    ).toEqual(psych.evidence);
    expect(c.reviews.find((r) => r.programId === "twente-psych")).toMatchObject(
      {
        reviewer: "Viktor",
        reviewerKind: "human",
        decision: "approved",
        checklistComplete: true,
        contentDigest: catalogDigest(c),
        acceptedUnknownFactIds: unknowns,
      },
    );
    expect(() => readPublishedMatchingCatalog("2026-10-25")).toThrow();
  });
  it("validates a fresh single-programme subset with two explicit unknowns", () => {
    const c = candidate();
    const v = validateCatalog(c, asOf);
    expect(v.ok).toBe(true);
    expect(c).toMatchObject({ version: "1.0.1", channel: "staging" });
    expect(c.programs).toHaveLength(1);
    expect(c.facts).toHaveLength(18);
    expect(v.warnings.map((w) => w.entityId).sort()).toEqual(unknowns);
    expect(
      Object.values(v.effectiveStatuses).filter((s) => s === "verified"),
    ).toHaveLength(16);
    expect(
      c.sources.every((s) => s.checkedOn === asOf && s.accessedOn === asOf),
    ).toBe(true);
    expect(c.evidence.every((e) => e.checkedOn === asOf)).toBe(true);
    expect(c.facts.every((f) => f.checkedBy === "agent")).toBe(true);
  });

  it("preserves all fact IDs, original values and unknown reasons", () => {
    const before = original.facts.filter((f) => f.programId === "twente-psych");
    const after = candidate().facts;
    expect(after.map((f) => f.id)).toEqual(before.map((f) => f.id));
    for (const f of after) {
      const old = before.find((o) => o.id === f.id)!;
      // Date value note now distinguishes Studielink time from OSIRIS date.
      const value =
        f.value?.kind === "date" ? { ...f.value, note: "" } : f.value;
      const oldValue =
        old.value?.kind === "date" ? { ...old.value, note: "" } : old.value;
      expect(value).toEqual(oldValue);
      expect(f.unknownReason).toBe(old.unknownReason);
    }
  });

  it("binds the pending human decision to the exact new digest", () => {
    const c = candidate();
    expect(catalogDigest(c)).toBe(
      "05bd7e5246623c58c1c4f3dc60eab7af11ae8c7f035f277895cde334fc6cb184",
    );
    expect(c.reviews).toHaveLength(1);
    expect(c.reviews[0]).toMatchObject({
      decision: "pending",
      checklistComplete: false,
      contentDigest: catalogDigest(c),
      acceptedUnknownFactIds: [],
    });
  });

  it("rejects a channel-only promotion without final approval", () => {
    const c = candidate();
    c.channel = "published";
    const v = validateCatalog(c, asOf);
    expect(v.ok).toBe(false);
    expect(v.issues.map((i) => i.code)).toEqual(["human_review"]);
    expect(
      readPublishedMatchingCatalog(asOf)
        .programs.slice(0, 2)
        .map((p) => p.id),
    ).toEqual(["twente-psych", "twente-bme"]);
  });

  it("requires acceptance of each unknown and approval of the changed digest", () => {
    const c = candidate();
    c.channel = "published";
    // Synthetic test-only decision, never saved or attributed to Viktor.
    c.reviews[0] = {
      ...c.reviews[0]!,
      reviewer: "Synthetic test fixture",
      decision: "approved",
      checklistComplete: true,
    };
    expect(
      validateCatalog(c, asOf).issues.filter(
        (i) => i.code === "publication_unknown",
      ),
    ).toHaveLength(2);
    c.reviews[0]!.acceptedUnknownFactIds = unknowns;
    expect(validateCatalog(c, asOf).ok).toBe(true);
    c.facts.find(
      (f) => f.id === "twente-psych-tuition-main",
    )!.candidateCategory += "; changed";
    expect(validateCatalog(c, asOf).issues.map((i) => i.code)).toContain(
      "human_review",
    );
  });

  it("expires the two critical date facts after the inclusive seven-day window", () => {
    expect(validateCatalog(candidate(), "2026-10-24").warnings).toHaveLength(2);
    const v = validateCatalog(candidate(), "2026-10-25");
    expect(
      v.warnings
        .filter((w) => w.code === "stale")
        .map((w) => w.entityId)
        .sort(),
    ).toEqual([
      "twente-psych-application-deadline-main",
      "twente-psych-intake-start-main",
    ]);
  });

  it("does not freshen an old supporting evidence check with fact dates alone", () => {
    const c = candidate();
    const evidence = c.evidence.find(
      (e) => e.factId === "twente-psych-application-deadline-main",
    )!;
    evidence.checkedOn = "2026-10-06";
    // Same retrieval date as original: coherent but too old for this predicate.
    c.sources.find((s) => s.id === evidence.sourceId)!.accessedOn =
      "2026-10-06";
    const v = validateCatalog(c, asOf);
    expect(v.ok).toBe(true);
    expect(v.effectiveStatuses[evidence.factId]).toBe("stale");
  });

  it("keeps applicant prices, institutional eligibility and funding unresolved", () => {
    const p = compileCatalogForMatching(candidate(), asOf).programs[0]!;
    expect(p).toMatchObject({
      cost: null,
      requirementsComplete: false,
      funding: "unknown",
    });
    expect(p.costProof.candidateScope).toBe("unresolved");
    expect(p.rules).toHaveLength(5);
    expect(
      p.rules.every(
        (r) => r.kind === "manual" && r.proof.candidateScope === "unresolved",
      ),
    ).toBe(true);
    expect(
      candidate().facts.find((f) => f.qualifier === "diploma")!
        .candidateCategory,
    ).toContain("international secondary");
  });
});
