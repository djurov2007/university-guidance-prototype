import { z } from "zod";

const text = z.string().trim().min(1).max(500);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,119}$/);
export const studyLevelSchema = z.enum(["undergraduate", "master", "phd"]);
// The profile's present geographic scope is Serbia and the EU, not catalog coverage.
export const countrySchema = z.enum([
  "RS",
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);
const countries = z
  .array(countrySchema)
  .max(28)
  .refine((v) => new Set(v).size === v.length, "Duplicate countries")
  .transform((v) => [...v].sort());
const languages = z
  .array(z.string().trim().min(2).max(60).toLowerCase())
  .min(1)
  .max(12)
  .refine((v) => new Set(v).size === v.length, "Duplicate languages")
  .transform((v) => [...v].sort());
const items = z.array(text).max(20);
const qualification = z.strictObject({
  kind: z.enum([
    "secondary",
    "bachelor",
    "master",
    "integrated_degree",
    "other",
  ]),
  field: text,
  institution: text.nullable(),
  // Prior education can be outside the destination catalog's geography.
  country: z.string().trim().min(2).max(100),
  completion: z.enum(["completed", "in_progress"]),
  completionYear: z.number().int().min(1900).max(2100).nullable(),
  credits: z
    .strictObject({
      amount: z.number().positive().max(1000),
      system: z.enum(["ECTS", "other"]),
      label: text,
    })
    .nullable(),
});
export const profileValueSchemas = {
  studyLevel: studyLevelSchema,
  fieldOfStudy: text,
  interests: items,
  studyGoal: text,
  preferredCountries: countries,
  excludedCountries: countries,
  teachingLanguages: languages,
  budgetAmount: z.number().nonnegative().max(100000000),
  budgetCurrency: z.enum(["EUR", "RSD", "USD", "GBP", "CHF"]),
  budgetPeriod: z.enum(["month", "year", "total_degree"]),
  budgetIncludesLiving: z.boolean(),
  scholarshipNeed: z.enum(["required", "preferred", "not_needed"]),
  startYear: z.number().int().min(2000).max(2100),
  previousQualification: qualification,
  relevantSubjects: z
    .array(
      z.strictObject({
        name: text,
        result: text.nullable(),
        credits: z.number().nonnegative().max(1000).nullable(),
      }),
    )
    .max(30),
  languageResults: z
    .array(
      z.strictObject({
        language: text,
        test: text,
        overall: z.number().nonnegative().max(1000).nullable(),
        scale: text.nullable(),
        takenOn: z.iso.date().nullable(),
        note: text.nullable(),
      }),
    )
    .max(12),
  professionalExperience: items,
  researchExperience: items,
  orientation: z.enum(["academic", "practical", "balanced", "unsure"]),
  masterIntent: z.enum([
    "specialisation",
    "change_field",
    "research_preparation",
    "unsure",
  ]),
  phdTopic: text,
  phdFunding: z.enum([
    "fully_funded",
    "partly_funded",
    "self_funded",
    "either",
  ]),
  phdPositionType: z.enum([
    "employed_position",
    "scholarship_position",
    "open_program",
    "either",
  ]),
  phdFocus: z.enum(["supervisor", "project", "institution", "no_preference"]),
  researchProposal: z.enum(["ready", "draft", "not_started", "none"]),
  hardConstraints: z.strictObject({
    countries: z.enum(["only_preferred", "any_in_scope"]),
    languages: z.enum(["only_listed", "flexible"]),
    budget: z.enum(["hard_maximum", "target"]),
    other: items,
  }),
  flexiblePreferences: items,
} as const;
export type FieldKey = keyof typeof profileValueSchemas;
export type ProfileValues = {
  [K in FieldKey]: z.output<(typeof profileValueSchemas)[K]>;
};
export const fieldKeys = Object.keys(profileValueSchemas) as FieldKey[];
export const fieldKeySchema = z.enum(fieldKeys);
export const fieldStatusSchema = z.enum([
  "user_stated",
  "extracted_unconfirmed",
  "confirmed",
  "missing",
  "conflicting",
]);
export const originSchema = z.enum([
  "user",
  "user_confirmation",
  "text_extraction",
  "document",
  "model",
  "context_review",
]);
const provenanceSchema = z.strictObject({
  origin: originSchema,
  eventId: id,
  sourceRef: text.nullable(),
});
export type Provenance = z.infer<typeof provenanceSchema>;
export interface Candidate<T> {
  value: T;
  provenance: Provenance;
}
export interface Proposal<T> extends Candidate<T> {
  id: string;
}
export interface ProfileField<T> {
  status: z.infer<typeof fieldStatusSchema>;
  value: T | null;
  provenance: Provenance | null;
  revision: number;
  proposals: Proposal<T>[];
  candidates: Candidate<T>[];
  reason: string | null;
}
function fieldSchema<T>(valueSchema: z.ZodType<T>): z.ZodType<ProfileField<T>> {
  const candidate = z.strictObject({
    value: valueSchema,
    provenance: provenanceSchema,
  });
  return z
    .strictObject({
      status: fieldStatusSchema,
      value: valueSchema.nullable(),
      provenance: provenanceSchema.nullable(),
      revision: z.number().int().nonnegative(),
      proposals: z.array(candidate.extend({ id })).max(3),
      candidates: z.array(candidate).max(4),
      reason: text.nullable(),
    })
    .superRefine((f, ctx) => {
      const fail = (message: string) =>
        ctx.addIssue({ code: "custom", message });
      if (
        f.status === "missing" &&
        (f.value !== null ||
          f.provenance !== null ||
          f.candidates.length ||
          f.proposals.length)
      )
        fail("Missing field must not contain a hidden value");
      if (
        ["user_stated", "confirmed", "extracted_unconfirmed"].includes(
          f.status,
        ) &&
        (f.value === null || f.provenance === null)
      )
        fail("Recorded field needs value and provenance");
      if (f.status === "user_stated" && f.provenance?.origin !== "user")
        fail("Only a direct user answer is user_stated");
      if (
        f.status === "confirmed" &&
        f.provenance?.origin !== "user_confirmation"
      )
        fail("Confirmation requires an explicit user action");
      if (
        f.status === "extracted_unconfirmed" &&
        (!f.proposals.length ||
          ["user", "user_confirmation"].includes(f.provenance?.origin ?? ""))
      )
        fail("Unconfirmed extraction needs its proposal and origin");
      if (
        f.status === "conflicting" &&
        (f.value !== null || f.candidates.length < 2 || !f.reason)
      )
        fail("Conflict retains alternatives, not a silently chosen value");
      if (f.status !== "conflicting" && f.candidates.length)
        fail("Candidates belong to a conflict");
      if (new Set(f.proposals.map((p) => p.id)).size !== f.proposals.length)
        fail("Duplicate proposal ID");
      if (
        f.proposals.some((p) =>
          ["user", "user_confirmation"].includes(p.provenance.origin),
        )
      )
        fail("Proposals are untrusted or context-review candidates");
    });
}
type Fields = { [K in FieldKey]: ProfileField<ProfileValues[K]> };
const fieldShape = Object.fromEntries(
  fieldKeys.map((key) => [
    key,
    fieldSchema(profileValueSchemas[key] as z.ZodType<unknown>),
  ]),
) as { [K in FieldKey]: z.ZodType<ProfileField<ProfileValues[K]>> };
const questionAttemptSchema = z.strictObject({
  context: text,
  count: z.number().int().min(1).max(2),
});
const questionRefSchema = z.strictObject({
  id,
  field: fieldKeySchema,
  kind: z.enum(["answer", "confirm", "resolve", "country_conflict"]),
  context: text,
});
export type QuestionRef = z.infer<typeof questionRefSchema>;
export const profileSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    fields: z.strictObject(fieldShape),
    progress: z.strictObject({
      presentations: z.number().int().nonnegative().max(24),
      attempts: z.array(questionAttemptSchema).max(48),
      deferredFields: z.array(fieldKeySchema).max(fieldKeys.length),
      awaiting: z.array(questionRefSchema).max(2),
    }),
    seenEvents: z
      .array(z.strictObject({ id, signature: z.string().min(1).max(24000) }))
      .max(256),
    history: z
      .array(
        z.strictObject({
          eventId: id,
          revision: z.number().int().positive(),
          kind: text,
          changedFields: z.array(fieldKeySchema),
          changes: z
            .array(
              z.strictObject({
                field: fieldKeySchema,
                before: z.unknown(),
                after: z.unknown(),
              }),
            )
            .max(fieldKeys.length),
        }),
      )
      .max(256),
  })
  .superRefine((p, ctx) => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    if (
      !unique(p.seenEvents.map((e) => e.id)) ||
      !unique(p.progress.attempts.map((a) => a.context)) ||
      !unique(p.progress.deferredFields) ||
      !unique(p.progress.awaiting.map((a) => a.field))
    )
      ctx.addIssue({
        code: "custom",
        message: "Duplicate event or progress identifiers",
      });
    if (
      p.progress.attempts.reduce((sum, a) => sum + a.count, 0) >
      p.progress.presentations
    )
      ctx.addIssue({
        code: "custom",
        message: "Question attempts exceed presentations",
      });
    for (const entry of p.history)
      for (const change of entry.changes) {
        const schema = fieldShape[change.field];
        if (
          !schema.safeParse(change.before).success ||
          !schema.safeParse(change.after).success
        )
          ctx.addIssue({
            code: "custom",
            message: "History snapshots must match the recorded field schema",
          });
      }
  });
export type ProfileState = z.infer<typeof profileSchema>;
export type ProfileFields = Fields;

const envelope = { id, baseRevision: z.number().int().nonnegative() };
export const profileEventSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...envelope,
    type: z.literal("user_answer"),
    field: fieldKeySchema,
    value: z.unknown(),
    mode: z.enum(["assert", "replace"]),
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("propose"),
    field: fieldKeySchema,
    value: z.unknown(),
    origin: z.enum(["text_extraction", "document", "model"]),
    sourceRef: text,
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("confirm"),
    field: fieldKeySchema,
    fieldRevision: z.number().int().nonnegative(),
    proposalId: id.nullable(),
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("resolve"),
    field: fieldKeySchema,
    fieldRevision: z.number().int().nonnegative(),
    value: z.unknown(),
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("reject_proposal"),
    field: fieldKeySchema,
    proposalId: id,
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("resolve_countries"),
    preferredCountries: countries,
    excludedCountries: countries,
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("skip"),
    field: fieldKeySchema,
  }),
  z.strictObject({
    ...envelope,
    type: z.literal("resume"),
    field: fieldKeySchema,
  }),
]);
export type ProfileEvent = z.infer<typeof profileEventSchema>;
export function emptyField<T>(): ProfileField<T> {
  return {
    status: "missing",
    value: null,
    provenance: null,
    revision: 0,
    proposals: [],
    candidates: [],
    reason: null,
  };
}
export function createProfile(): ProfileState {
  return profileSchema.parse({
    schemaVersion: 1,
    revision: 0,
    fields: Object.fromEntries(fieldKeys.map((key) => [key, emptyField()])),
    progress: {
      presentations: 0,
      attempts: [],
      deferredFields: [],
      awaiting: [],
    },
    seenEvents: [],
    history: [],
  });
}
export function trustedValue<K extends FieldKey>(
  state: ProfileState,
  key: K,
): ProfileValues[K] | null {
  const field = state.fields[key];
  return field.status === "user_stated" || field.status === "confirmed"
    ? (field.value as ProfileValues[K])
    : null;
}
