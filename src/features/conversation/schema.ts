import { z } from "zod";
import { fieldKeySchema } from "../profiles/schema.ts";
import { publicMatchingOutputSchema } from "../matching/schema.ts";

export const scenarioSchema = z.enum([
  "bachelor",
  "master",
  "phd",
  "alternative",
  "no_match",
  "provider_unavailable",
  "published",
]);
export type Scenario = z.infer<typeof scenarioSchema>;
export const errorCodeSchema = z.enum([
  "INVALID_REQUEST",
  "OUT_OF_SCOPE",
  "NEEDS_INFORMATION",
  "NO_CATALOG_MATCH",
  "SOURCE_UNVERIFIED",
  "PROFILE_CONFLICT",
  "MODEL_REFUSAL",
  "MODEL_INVALID_OUTPUT",
  "PROVIDER_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "RATE_LIMITED",
  "BUDGET_EXCEEDED",
  "SESSION_EXPIRED",
  "INTERNAL_ERROR",
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;
export const issueSchema = z.strictObject({
  code: errorCodeSchema,
  message: z.string().max(1000),
});
const revision = z.number().int().nonnegative();
export const chatRequestSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("start"), scenario: scenarioSchema }),
  z.strictObject({ action: z.literal("resume") }),
  z.strictObject({
    action: z.literal("message"),
    revision,
    message: z.string().trim().min(1).max(8000),
  }),
]);
export const profileRequestSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("prepare_example"), revision }),
  z.strictObject({ action: z.literal("confirm"), revision }),
  z.strictObject({
    action: z.literal("answer"),
    revision,
    field: fieldKeySchema,
    value: z.unknown(),
    mode: z.enum(["assert", "replace"]),
  }),
  z.strictObject({
    action: z.literal("resolve"),
    revision,
    field: fieldKeySchema,
    value: z.unknown(),
  }),
]);
export const recommendationRequestSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("search"),
    revision,
    explain: z.boolean(),
  }),
  z.strictObject({
    action: z.literal("consent"),
    revision,
    requestId: z.string().min(1).max(120),
    decision: z.enum(["granted", "revoked"]),
  }),
]);
export const feedbackRequestSchema = z.strictObject({
  revision,
  kind: z.enum(["helpful", "incorrect_source", "other"]),
  message: z.string().trim().max(500),
  programId: z.string().max(120).nullable(),
});
export const sessionViewSchema = z.strictObject({
  revision,
  profileRevision: revision,
  scenario: scenarioSchema,
  expiresAt: z.iso.datetime(),
  mode: z.enum(["synthetic", "published"]),
  fields: z
    .array(
      z.strictObject({
        key: fieldKeySchema,
        status: z.enum([
          "missing",
          "user_stated",
          "extracted_unconfirmed",
          "confirmed",
          "conflicting",
        ]),
        value: z.unknown(),
        proposals: z
          .array(z.strictObject({ id: z.string(), value: z.unknown() }))
          .max(3),
        candidates: z.array(z.unknown()).max(10),
      }),
    )
    .max(40),
  questions: z
    .array(
      z.strictObject({
        id: z.string(),
        field: fieldKeySchema,
        text: z.string(),
      }),
    )
    .max(2),
  requiredMissing: z.array(fieldKeySchema),
  ready: z.boolean(),
  messages: z
    .array(
      z.strictObject({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(8000),
      }),
    )
    .max(20),
  matching: publicMatchingOutputSchema.nullable(),
  grants: z
    .array(z.strictObject({ requestId: z.string(), message: z.string() }))
    .max(3),
  issue: issueSchema.nullable(),
  feedbackCount: revision,
});
export type SessionView = z.infer<typeof sessionViewSchema>;
export const programDetailsSchema = z
  .strictObject({
    programId: z.string(),
    name: z.string(),
    synthetic: z.boolean(),
    sources: z.array(
      z.strictObject({
        id: z.string(),
        factIds: z.array(z.string()),
        label: z.string(),
        checkedOn: z.iso.date(),
        note: z.string(),
        url: z
          .url()
          .refine((value) => {
            const url = new URL(value);
            return url.protocol === "https:" && !url.username && !url.password;
          }, "Public HTTPS source required")
          .nullable(),
      }),
    ),
    unknowns: z.array(z.string()),
    nextStep: z.string(),
  })
  .superRefine((details, context) => {
    for (const [index, source] of details.sources.entries()) {
      if (details.synthetic !== (source.url === null))
        context.addIssue({
          code: "custom",
          path: ["sources", index, "url"],
          message:
            "Synthetic sources have no URL; reviewed sources require HTTPS evidence",
        });
    }
  });
export type ProgramDetails = z.infer<typeof programDetailsSchema>;
