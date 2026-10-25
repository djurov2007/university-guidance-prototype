import { z } from "zod";
import { countrySchema, profileSchema } from "../profiles/schema.ts";
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/);
const text = z.string().trim().min(1).max(500);
export const proofSchema = z.strictObject({
  status: z.enum(["verified", "unknown", "unverified", "stale", "conflicting"]),
  factIds: z.array(id).max(40),
  sourceIds: z.array(id).max(40),
  startYear: z.number().int().nullable(),
  candidateScope: z.enum(["all", "unresolved"]),
  checkedOn: z.iso.date(),
  note: text,
});
export type Proof = z.infer<typeof proofSchema>;
const ruleBase = { id, mandatory: z.boolean(), proof: proofSchema };
export const institutionalRuleSchema = z
  .discriminatedUnion("kind", [
    z.strictObject({
      ...ruleBase,
      kind: z.literal("qualification"),
      accepted: z
        .array(
          z.enum([
            "secondary",
            "bachelor",
            "master",
            "integrated_degree",
            "other",
          ]),
        )
        .min(1),
    }),
    z.strictObject({
      ...ruleBase,
      kind: z.literal("credits"),
      minimum: z.number().nonnegative(),
      system: z.enum(["ECTS", "other"]),
    }),
    z.strictObject({
      ...ruleBase,
      kind: z.literal("subjects"),
      required: z.array(text).min(1),
    }),
    z.strictObject({
      ...ruleBase,
      kind: z.literal("language_test"),
      language: text,
      test: text,
      scale: text,
      minimum: z.number().nonnegative(),
      maximum: z.number().positive(),
      notBefore: z.iso.date().nullable(),
    }),
    z.strictObject({
      ...ruleBase,
      kind: z.literal("deadline"),
      date: z.iso.date(),
    }),
    z.strictObject({ ...ruleBase, kind: z.literal("manual"), label: text }),
  ])
  .superRefine((rule, ctx) => {
    if (rule.kind === "language_test" && rule.minimum > rule.maximum)
      ctx.addIssue({
        code: "custom",
        message: "Minimum exceeds the known test scale maximum",
      });
  });
export const matchingProgramSchema = z.strictObject({
  id,
  intakeId: id,
  name: text,
  institution: text,
  level: z.enum(["undergraduate", "master", "phd"]),
  country: countrySchema,
  city: text,
  topics: z.array(text).min(1).max(30),
  identityProof: proofSchema,
  languages: z.array(text).max(12),
  languageProof: proofSchema,
  cost: z
    .strictObject({
      amount: z.number().nonnegative(),
      currency: z.enum(["EUR", "RSD", "USD", "GBP", "CHF"]),
      period: z.enum(["year", "month", "total_degree"]),
      coverage: z.enum(["tuition", "tuition_and_living"]),
      proof: proofSchema,
    })
    .nullable(),
  costProof: proofSchema,
  funding: z.enum(["none", "possible", "unknown"]),
  fundingProof: proofSchema,
  preferences: z.array(text).max(30),
  preferenceProof: proofSchema,
  rules: z.array(institutionalRuleSchema).max(50),
  requirementsComplete: z.boolean(),
});
export type MatchingProgram = z.infer<typeof matchingProgramSchema>;
export const matchingCatalogSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    version: text,
    channel: z.enum(["synthetic", "published", "staging_preview"]),
    programs: z.array(matchingProgramSchema).max(500),
    sourceIds: z.array(id).max(2000),
    factIds: z.array(id).max(10000),
  })
  .superRefine((c, ctx) => {
    if (
      new Set(c.programs.map((p) => `${p.id}:${p.intakeId}`)).size !==
        c.programs.length ||
      new Set(c.sourceIds).size !== c.sourceIds.length ||
      new Set(c.factIds).size !== c.factIds.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Duplicate matching identifiers",
      });
    const sources = new Set(c.sourceIds),
      facts = new Set(c.factIds);
    for (const p of c.programs) {
      if (new Set(p.rules.map((r) => r.id)).size !== p.rules.length)
        ctx.addIssue({ code: "custom", message: "Duplicate rule IDs" });
      for (const proof of [
        p.identityProof,
        p.languageProof,
        p.costProof,
        p.fundingProof,
        p.preferenceProof,
        ...(p.cost ? [p.cost.proof] : []),
        ...p.rules.map((r) => r.proof),
      ]) {
        if (
          proof.sourceIds.some((s) => !sources.has(s)) ||
          proof.factIds.some((f) => !facts.has(f))
        )
          ctx.addIssue({ code: "custom", message: "Unknown proof reference" });
        if (
          proof.status === "verified" &&
          (!proof.sourceIds.length || !proof.factIds.length)
        )
          ctx.addIssue({
            code: "custom",
            message: "Verified proof requires source and fact references",
          });
      }
    }
  });
export type MatchingCatalog = z.infer<typeof matchingCatalogSchema>;
export const consentSchema = z.strictObject({
  requestId: id,
  programId: id,
  intakeId: id,
  profileRevision: z.number().int().nonnegative(),
  scopeKey: z.string().max(200000),
  decision: z.enum(["granted", "revoked"]),
});
export type AlternativeConsent = z.infer<typeof consentSchema>;
export const matchingInputSchema = z
  .strictObject({
    profile: profileSchema,
    catalog: matchingCatalogSchema,
    asOf: z.iso.date(),
    consents: z.array(consentSchema).max(500),
  })
  .superRefine((v, ctx) => {
    if (new Set(v.consents.map((c) => c.requestId)).size !== v.consents.length)
      ctx.addIssue({ code: "custom", message: "Duplicate consents" });
  });
export type MatchingInput = z.infer<typeof matchingInputSchema>;
export const requirementStatusSchema = z.enum([
  "met",
  "likely_met",
  "not_met",
  "unknown",
  "source_conflict",
]);
export type RequirementStatus = z.infer<typeof requirementStatusSchema>;
export const reasonSchema = z.strictObject({
  code: id,
  category: z.enum([
    "level",
    "interest",
    "finance",
    "location",
    "language",
    "preference",
    "institution",
    "source",
  ]),
  message: text,
  factIds: z.array(id),
  sourceIds: z.array(id),
});
export type MatchReason = z.infer<typeof reasonSchema>;
const checkSchema = z.strictObject({
  ruleId: id,
  label: text,
  status: requirementStatusSchema,
  mandatory: z.boolean(),
  message: text,
  factIds: z.array(id),
  sourceIds: z.array(id),
});
export type RequirementCheck = z.infer<typeof checkSchema>;
export const deviationSchema = z.strictObject({
  code: z.enum([
    "country",
    "excluded_country",
    "language",
    "budget",
    "scholarship",
  ]),
  hard: z.boolean(),
  message: text,
});
export type Deviation = z.infer<typeof deviationSchema>;
const optionSchema = z.strictObject({
  programId: id,
  intakeId: id,
  name: text,
  institution: text,
  country: countrySchema,
  city: text,
  kind: z.enum([
    "verified_constraints",
    "needs_verification",
    "conditional_alternative",
  ]),
  reasons: z.array(reasonSchema),
  checks: z.array(checkSchema),
  warnings: z.array(text),
  deviations: z.array(deviationSchema),
  nextStep: text,
});
export const publicMatchingOutputSchema = z.strictObject({
  mode: z.enum(["synthetic", "published", "staging_preview"]),
  schemaVersion: z.literal(1),
  profileRevision: z.number().int().nonnegative(),
  catalogVersion: text,
  status: z.enum([
    "needs_profile",
    "catalog_empty",
    "catalog_unpublished",
    "no_match",
    "options_found",
    "needs_verification",
    "permission_required",
  ]),
  options: z.array(optionSchema).max(3),
  permissionRequests: z
    .array(
      z.strictObject({
        requestId: id,
        profileRevision: z.number().int().nonnegative(),
        deviations: z.array(deviationSchema).min(1),
        message: text,
      }),
    )
    .max(3),
  rejections: z.array(
    z.strictObject({
      code: z.enum([
        "wrong_level",
        "wrong_field",
        "institution_not_met",
        "funding_unavailable",
      ]),
      count: z.number().int().positive(),
      message: text,
    }),
  ),
  gaps: z.array(text),
  message: text,
});
export type MatchingOutput = z.infer<typeof publicMatchingOutputSchema>;
