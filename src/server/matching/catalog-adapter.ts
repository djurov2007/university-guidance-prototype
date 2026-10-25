import "server-only";
import { readFileSync } from "node:fs";
import { validateCatalog } from "../catalog/validation.ts";
import {
  matchingCatalogSchema,
  type MatchingCatalog,
  type Proof,
} from "../../features/matching/schema.ts";

// Compile typed facts conservatively. No NLP or applicant-category inference.
export function compileCatalogForMatching(
  snapshot: unknown,
  asOf: string,
): MatchingCatalog {
  const validated = validateCatalog(snapshot, asOf);
  if (!validated.ok || !validated.catalog)
    throw new Error("Catalog failed integrity/publication validation");
  const c = validated.catalog;
  const programs = c.programs.flatMap((p) =>
    c.intakes
      .filter((i) => i.programId === p.id)
      .map((intake) => {
        const facts = c.facts.filter(
          (f) =>
            f.programId === p.id &&
            (f.intakeId === null || f.intakeId === intake.id),
        );
        const proof = (
          group: typeof facts,
          note: string,
          scope: "all" | "unresolved" = "all",
        ): Proof => {
          const statuses = group.map((f) => validated.effectiveStatuses[f.id]);
          const status = statuses.includes("conflicting")
            ? "conflicting"
            : !group.length || statuses.includes("unknown")
              ? "unknown"
              : statuses.every((s) => s === "verified")
                ? "verified"
                : "unverified";
          return {
            status,
            factIds: group.map((f) => f.id),
            sourceIds: [
              ...new Set(
                c.evidence
                  .filter(
                    (e) =>
                      group.some((f) => f.id === e.factId) &&
                      e.relation === "supports",
                  )
                  .map((e) => e.sourceId),
              ),
            ],
            startYear:
              intake.scope === "year_bound" && intake.academicYear
                ? Number(intake.academicYear.slice(0, 4))
                : null,
            candidateScope: scope,
            checkedOn: group.map((f) => f.checkedOn).sort()[0] ?? c.preparedOn,
            note,
          };
        };
        const languages = facts.filter((f) => f.predicate === "language");
        const plainLanguages = languages.flatMap((f) =>
          f.value?.kind === "list" ? f.value.items : [],
        );
        const allowed = [
          "English",
          "Serbian",
          "German",
          "Dutch",
          "Italian",
          "French",
        ];
        const languageProof = proof(
          languages,
          "Exact unqualified teaching language facts only.",
        );
        if (plainLanguages.some((l) => !allowed.includes(l)))
          languageProof.status = "unknown";
        // Until a human-authored typed applicant binding exists, prices and prose
        // requirements are visible only as unknown. No maximal/minimal fee guessing.
        const money = facts.filter((f) => f.predicate === "tuition");
        const costProof = proof(
          money,
          "Applicant fee category has not been bound to this profile.",
          "unresolved",
        );
        const requirements = facts.filter((f) =>
          [
            "institutional_requirement",
            "application_requirement",
            "application_deadline",
          ].includes(f.predicate),
        );
        const rules = requirements.map((f) => ({
          id: f.id,
          mandatory: true,
          kind: "manual" as const,
          label:
            f.value?.kind === "text"
              ? f.value.text.slice(0, 500)
              : (f.unknownReason?.slice(0, 500) ??
                "This institutional requirement needs a typed binding."),
          proof: proof(
            [f],
            "Textual requirement or deadline needs an explicit typed/year/applicant binding.",
            "unresolved",
          ),
        }));
        const identityProof = proof(
          facts.filter((f) =>
            ["name", "level", "country", "academic_year"].includes(f.predicate),
          ),
          "Identity plus relevant intake/year evidence.",
        );
        if (intake.scope === "general_policy") identityProof.status = "unknown";
        return {
          id: p.id,
          intakeId: intake.id,
          name: p.name,
          institution: c.institutions.find((i) => i.id === p.institutionId)!
            .name,
          level: p.level,
          country: p.country,
          city: p.city,
          topics: [p.field, p.subfield],
          identityProof,
          languages: plainLanguages
            .filter((l) => allowed.includes(l))
            .map((l) => l.toLowerCase()),
          languageProof,
          cost: null,
          costProof,
          funding: "unknown" as const,
          fundingProof: proof(
            facts.filter((f) => f.predicate === "scholarship"),
            "A catalog scholarship is not an award to the candidate.",
            "unresolved",
          ),
          preferences: [],
          preferenceProof: proof([], "No reviewed preference annotations."),
          rules,
          requirementsComplete: false,
        };
      }),
  );
  return matchingCatalogSchema.parse({
    schemaVersion: 1,
    version: c.version,
    channel: c.channel === "published" ? "published" : "staging_preview",
    programs,
    sourceIds: c.sources.map((s) => s.id),
    factIds: c.facts.map((f) => f.id),
  });
}
export function readPublishedMatchingCatalog(asOf: string): MatchingCatalog {
  // Fixed server-owned file; native Node CLI and Next use the same validator.
  const snapshot: unknown = JSON.parse(
    readFileSync(
      new URL(
        "../../../data/catalog/published/catalog.v1.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const catalog = compileCatalogForMatching(snapshot, asOf);
  if (catalog.channel !== "published")
    throw new Error("Published reader refuses staging");
  return catalog;
}
