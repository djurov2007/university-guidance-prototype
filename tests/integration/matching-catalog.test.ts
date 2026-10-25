import { describe, expect, it } from "vitest";
import staging from "../../data/catalog/staging/catalog.v1.json";
import {
  compileCatalogForMatching,
  readPublishedMatchingCatalog,
} from "../../src/server/matching/catalog-adapter.ts";
import { matchingFixture } from "../../src/test-fixtures/matching.ts";
import { recommend } from "../../src/features/matching/engine.ts";
describe("existing catalog publication boundary", () => {
  it("uses the approved real catalogue and requests consent for hard deviations", () => {
    const i = matchingFixture();
    i.asOf = "2026-10-17";
    i.catalog = readPublishedMatchingCatalog(i.asOf);
    expect(recommend(i)).toMatchObject({
      status: "permission_required",
      options: [],
    });
  });
  it("compiles staging only for review and cannot recommend from it", () => {
    const i = matchingFixture();
    i.catalog = compileCatalogForMatching(staging, i.asOf);
    expect(i.catalog.programs).toHaveLength(8);
    expect(recommend(i)).toMatchObject({
      status: "catalog_unpublished",
      options: [],
      permissionRequests: [],
    });
  });
  it("does not parse prose fees or institutional requirements into applicant eligibility", () => {
    const c = compileCatalogForMatching(staging, "2026-10-06");
    expect(
      c.programs.every(
        (p) => p.cost === null && p.costProof.candidateScope === "unresolved",
      ),
    ).toBe(true);
    expect(
      c.programs.flatMap((p) => p.rules).every((r) => r.kind === "manual"),
    ).toBe(true);
  });
  it("rejects corrupt catalog references before compiling matching input", () => {
    const bad = structuredClone(staging);
    bad.evidence[0]!.sourceId = "missing-source";
    expect(() => compileCatalogForMatching(bad, "2026-10-06")).toThrow();
  });
});
