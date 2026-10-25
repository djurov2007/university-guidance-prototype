import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9-]{1,100}$/);
const text = z.string().trim().min(1).max(2000);
export const dateSchema = z.iso.date();
export const verificationSchema = z.enum([
  "verified",
  "unverified",
  "unknown",
  "conflicting",
  "stale",
]);
export const predicates = [
  "institution_name",
  "name",
  "level",
  "country",
  "city",
  "language",
  "duration",
  "credits",
  "academic_year",
  "intake_start",
  "tuition",
  "other_cost",
  "application_requirement",
  "application_deadline",
  "scholarship",
  "institutional_requirement",
] as const;
export const requiredPredicates = predicates.filter((p) => p !== "credits");
export const valueSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("text"), text }),
  z.strictObject({ kind: z.literal("list"), items: z.array(text).min(1) }),
  z.strictObject({
    kind: z.literal("duration"),
    amount: z.number().positive(),
    unit: z.enum(["years", "semesters"]),
  }),
  z.strictObject({
    kind: z.literal("number"),
    amount: z.number().nonnegative(),
    unit: text,
  }),
  z.strictObject({
    kind: z.literal("money"),
    amount: z.number().nonnegative(),
    currency: z.enum(["EUR", "RSD", "USD", "GBP", "CHF"]),
    period: z.enum(["year", "semester", "month", "one_time"]),
    basis: z.enum([
      "tuition",
      "fee",
      "estimate",
      "scholarship_gross",
      "scholarship_net",
    ]),
    note: text,
  }),
  z.strictObject({
    kind: z.literal("date"),
    date: dateSchema,
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    timezone: z
      .enum([
        "CET",
        "CEST",
        "Europe/Rome",
        "Europe/Belgrade",
        "Europe/Amsterdam",
      ])
      .nullable(),
    note: text,
  }),
]);
const institutionSchema = z.strictObject({
  id,
  name: text,
  country: z.enum(["RS", "DE", "NL", "IT"]),
  officialHosts: z.array(z.string().regex(/^[a-z0-9.-]+$/)).min(1),
});
const programSchema = z.strictObject({
  id,
  institutionId: id,
  name: text,
  level: z.enum(["undergraduate", "master", "phd"]),
  country: z.enum(["RS", "DE", "NL", "IT"]),
  city: text,
  field: text,
  subfield: text,
  classificationBasis: z.literal("editorial"),
  verification: z.enum(["partial", "fully_verified"]),
  notes: text,
});
const intakeSchema = z.strictObject({
  id,
  programId: id,
  academicYear: z
    .string()
    .regex(/^20\d{2}\/20\d{2}$/)
    .nullable(),
  label: text,
  scope: z.enum(["year_bound", "general_policy"]),
});
const sourceSchema = z.strictObject({
  id,
  institutionId: id,
  programIds: z.array(id).min(1),
  intakeIds: z.array(id),
  title: text,
  url: z.url().refine((s) => {
    const u = new URL(s);
    return u.protocol === "https:" && !u.username && !u.password;
  }, "Public HTTPS URL required"),
  publisher: text,
  authority: z.enum(["official", "unofficial"]),
  authorityReason: text,
  status: verificationSchema,
  accessedOn: dateSchema,
  checkedOn: dateSchema,
});
const factSchema = z.strictObject({
  id,
  programId: id,
  intakeId: id.nullable(),
  predicate: z.enum(predicates),
  qualifier: text,
  candidateCategory: text,
  nature: z.enum(["institutional", "estimate", "experience"]),
  status: verificationSchema,
  value: valueSchema.nullable(),
  unknownReason: text.nullable(),
  checkedOn: dateSchema,
  checkedBy: z.enum(["agent", "human"]),
  note: text,
});
const evidenceSchema = z.strictObject({
  id,
  factId: id,
  sourceId: id,
  relation: z.enum(["supports", "contradicts", "context"]),
  locator: text,
  paraphrase: text,
  checkedOn: dateSchema,
});
const reviewSchema = z.strictObject({
  id,
  programId: id,
  reviewer: text,
  reviewerKind: z.enum(["human", "agent"]),
  decision: z.enum(["approved", "rejected", "pending"]),
  reviewedOn: dateSchema,
  contentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  checklistComplete: z.boolean(),
  acceptedUnknownFactIds: z.array(id),
  note: text,
});
export const catalogSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    channel: z.enum(["staging", "published"]),
    preparedOn: dateSchema,
    institutions: z.array(institutionSchema),
    programs: z.array(programSchema),
    intakes: z.array(intakeSchema),
    sources: z.array(sourceSchema),
    facts: z.array(factSchema),
    evidence: z.array(evidenceSchema),
    reviews: z.array(reviewSchema),
  })
  .superRefine((catalog, ctx) => {
    for (const [i, fact] of catalog.facts.entries()) {
      const add = (message: string) =>
        ctx.addIssue({ code: "custom", path: ["facts", i], message });
      if (
        fact.status === "unknown" &&
        (fact.value !== null || !fact.unknownReason)
      )
        add("Unknown requires null value and reason");
      if (fact.status !== "unknown" && fact.value === null)
        add(
          "Known/unverified/conflicting/stale assertion requires its recorded value",
        );
      if (fact.value) {
        const kind = fact.value.kind;
        const allowed =
          fact.predicate === "language"
            ? ["list"]
            : fact.predicate === "duration"
              ? ["duration"]
              : fact.predicate === "credits"
                ? ["number"]
                : ["intake_start", "application_deadline"].includes(
                      fact.predicate,
                    )
                  ? ["date"]
                  : ["tuition", "other_cost", "scholarship"].includes(
                        fact.predicate,
                      )
                    ? ["money", "text"]
                    : ["text"];
        if (!allowed.includes(kind)) add("Value kind does not fit predicate");
        if (
          fact.predicate === "level" &&
          (kind !== "text" ||
            !["undergraduate", "master", "phd"].includes(
              fact.value.kind === "text" ? fact.value.text : "",
            ))
        )
          add("Invalid study level");
        if (fact.value.kind === "money") {
          if (fact.predicate === "tuition" && fact.value.basis !== "tuition")
            add("Tuition must not contain fees or living estimates");
          if (
            fact.predicate === "scholarship" &&
            !fact.value.basis.startsWith("scholarship_")
          )
            add("Scholarship requires explicit gross/net basis");
          if (fact.value.basis === "estimate" && fact.nature !== "estimate")
            add("Estimate cannot masquerade as institutional fact");
        }
      }
    }
  });
export type CatalogSnapshot = z.infer<typeof catalogSchema>;
export type CatalogFact = CatalogSnapshot["facts"][number];
export type FactValue = z.infer<typeof valueSchema>;
export type VerificationStatus = z.infer<typeof verificationSchema>;
