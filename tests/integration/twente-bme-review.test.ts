import { describe, expect, it } from "vitest";
import original from "../../data/catalog/staging/catalog.v1.json";
import rawCandidate from "../../data/catalog/review/twente-bme.2026-10-17.v1.0.2.json";
import published from "../../data/catalog/published/catalog.v1.json";
import { catalogSchema } from "@/features/catalog/schema";
import { catalogDigest, validateCatalog } from "@/server/catalog/validation";

const asOf = "2026-10-17";
const candidate = () => catalogSchema.parse(structuredClone(rawCandidate));
const unknowns = ["twente-bme-other-cost-main", "twente-bme-scholarship-main"];

describe("dated Twente Biomedical Engineering review candidate", () => {
  it("creates a fresh isolated candidate and publishes both approved programmes", () => {
    const c = candidate();
    const result = validateCatalog(c, asOf);
    expect(result.ok).toBe(true);
    expect(c).toMatchObject({ version: "1.0.2", channel: "staging" });
    expect(c.programs.map((p) => p.id)).toEqual(["twente-bme"]);
    expect(c.facts).toHaveLength(22);
    expect(c.sources).toHaveLength(5);
    expect(result.warnings.map((w) => w.entityId).sort()).toEqual(unknowns);
    expect(published.programs.slice(0, 2).map((p) => p.id)).toEqual([
      "twente-psych",
      "twente-bme",
    ]);
  });

  it("publishes the exact BME records with Viktor's two unknown acceptances", () => {
    const c = catalogSchema.parse(published);
    const bme = candidate();
    expect(validateCatalog(c, asOf).ok).toBe(true);
    expect(c.facts.filter((f) => f.programId === "twente-bme")).toEqual(
      bme.facts,
    );
    expect(
      c.sources.filter((s) => s.programIds.includes("twente-bme")),
    ).toEqual(bme.sources);
    expect(
      c.evidence.filter((e) => bme.facts.some((f) => f.id === e.factId)),
    ).toEqual(bme.evidence);
    expect(c.reviews.find((r) => r.programId === "twente-bme")).toMatchObject({
      reviewer: "Viktor",
      reviewerKind: "human",
      decision: "approved",
      checklistComplete: true,
      contentDigest: catalogDigest(c),
      acceptedUnknownFactIds: unknowns,
    });
  });

  it("adds only sourced CGPA, document and living-estimate facts", () => {
    const c = candidate();
    const ids = c.facts.map((f) => f.id);
    const originalIds = original.facts
      .filter((f) => f.programId === "twente-bme")
      .map((f) => f.id);
    expect(ids.filter((id) => !originalIds.includes(id))).toEqual([
      "twente-bme-other-cost-living-estimate",
      "twente-bme-application-requirement-cgpa",
      "twente-bme-application-requirement-documents",
    ]);
    expect(
      c.facts.find((f) => f.id === "twente-bme-other-cost-living-estimate"),
    ).toMatchObject({ nature: "estimate", value: { amount: 1311 } });
    expect(
      c.facts.find((f) => f.id === "twente-bme-application-requirement-cgpa")
        ?.value,
    ).toMatchObject({ text: expect.stringContaining("75%") });
  });

  it("binds a pending decision to the exact digest and rejects publication", () => {
    const c = candidate();
    expect(c.reviews[0]).toMatchObject({
      reviewer: "Viktor",
      decision: "pending",
      checklistComplete: false,
      contentDigest: catalogDigest(c),
      acceptedUnknownFactIds: [],
    });
    c.channel = "published";
    expect(validateCatalog(c, asOf).issues.map((i) => i.code)).toContain(
      "human_review",
    );
  });

  it("keeps the seven-day critical facts fresh through 24 October only", () => {
    expect(validateCatalog(candidate(), "2026-10-24").ok).toBe(true);
    const result = validateCatalog(candidate(), "2026-10-25");
    expect(
      result.warnings
        .filter((w) => w.code === "stale")
        .map((w) => w.entityId)
        .sort(),
    ).toEqual([
      "twente-bme-application-deadline-eu",
      "twente-bme-application-deadline-main",
      "twente-bme-intake-start-main",
    ]);
  });
});
