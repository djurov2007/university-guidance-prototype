import { describe, expect, it } from "vitest";
import {
  createProfile,
  profileSchema,
  profileValueSchemas,
  fieldKeys,
  trustedValue,
  type ProfileState,
  type FieldKey,
} from "../../src/features/profiles/schema.ts";
import {
  applyProfileEvent,
  effectiveFieldStatus,
  profileConflicts,
  usableProfileProjection,
} from "../../src/features/profiles/state.ts";
import {
  advanceConversation,
  assessProfile,
  activeProfileProjection,
} from "../../src/features/profiles/engine.ts";
import {
  goldenQuestionConfig,
  questionSchema,
  requiredFields,
} from "../../src/features/profiles/questions.ts";
import {
  answerCommands,
  undergraduateAnswers,
  profileConversations,
  replayConversation,
} from "../../src/test-fixtures/profile-conversations.ts";

const policy = { asOfYear: 2026 };
let sequence = 0;
function event(
  state: ProfileState,
  data: Record<string, unknown>,
): ProfileState {
  const result = applyProfileEvent(state, {
    id: `test-${++sequence}`,
    baseRevision: state.revision,
    ...data,
  });
  if (!result.ok) throw new Error(result.error);
  return result.state;
}
function answer(
  state: ProfileState,
  field: FieldKey,
  value: unknown,
  mode: "assert" | "replace" = "assert",
) {
  return event(state, { type: "user_answer", field, value, mode });
}
function complete() {
  let state = createProfile();
  for (const command of answerCommands(undergraduateAnswers))
    state = event(state, { ...command });
  return state;
}
function propose(state: ProfileState, field: FieldKey, value: unknown) {
  return event(state, {
    type: "propose",
    field,
    value,
    origin: "document",
    sourceRef: "SYNTHETIC-DOCUMENT",
  });
}
function confirm(
  state: ProfileState,
  field: FieldKey,
  proposalId: string | null = null,
) {
  return event(state, {
    type: "confirm",
    field,
    fieldRevision: state.fields[field].revision,
    proposalId,
  });
}
describe("strict structured profile", () => {
  it("rejects malformed history snapshots as well as malformed active fields", () => {
    const state = answer(createProfile(), "budgetAmount", 10000);
    state.history[0]!.changes[0]!.before = {
      arbitraryHiddenValue: "not a profile field",
    };
    expect(profileSchema.safeParse(state).success).toBe(false);
    expect(
      applyProfileEvent(state, {
        id: "bad-history",
        baseRevision: state.revision,
        type: "skip",
        field: "budgetAmount",
      }),
    ).toMatchObject({ ok: false, error: "invalid_input" });
  });
  it("allows older and non-EU prior education without expanding destination scope", () => {
    expect(
      profileValueSchemas.previousQualification.safeParse({
        ...undergraduateAnswers.previousQualification,
        country: "United States",
        completionYear: 1998,
      }).success,
    ).toBe(true);
    expect(
      profileValueSchemas.preferredCountries.safeParse(["US"]).success,
    ).toBe(false);
  });
  it("starts with all 27 fields missing, not invented defaults", () => {
    const state = createProfile();
    expect(fieldKeys).toHaveLength(27);
    for (const key of fieldKeys)
      expect(state.fields[key]).toMatchObject({
        status: "missing",
        value: null,
      });
    expect(usableProfileProjection(state)).toEqual({});
  });
  it("requires user confirmation provenance for the confirmed status", () => {
    const state = answer(createProfile(), "budgetAmount", 10000);
    state.fields.budgetAmount.status = "confirmed";
    expect(profileSchema.safeParse(state).success).toBe(false);
  });
  it("rejects unknown keys and invalid countries, duplicates and ambiguous strings", () => {
    expect(
      profileSchema.safeParse({ ...createProfile(), hiddenAdmissionScore: 99 })
        .success,
    ).toBe(false);
    expect(
      profileValueSchemas.preferredCountries.safeParse(["ZZ"]).success,
    ).toBe(false);
    expect(
      profileValueSchemas.preferredCountries.safeParse(["DE", "DE"]).success,
    ).toBe(false);
    expect(profileValueSchemas.budgetAmount.safeParse("10.000").success).toBe(
      false,
    );
  });
  it("does not turn explicit zero or false into missing", () => {
    let state = answer(createProfile(), "budgetAmount", 0);
    state = answer(state, "budgetIncludesLiving", false);
    expect(trustedValue(state, "budgetAmount")).toBe(0);
    expect(trustedValue(state, "budgetIncludesLiving")).toBe(false);
    expect(state.fields.budgetCurrency.value).toBeNull();
  });
  it("normalizes language lists without inferring teaching English", () => {
    const state = answer(createProfile(), "teachingLanguages", [" Serbian "]);
    expect(trustedValue(state, "teachingLanguages")).toEqual(["serbian"]);
    expect(
      profileValueSchemas.teachingLanguages.safeParse(["English", " english "])
        .success,
    ).toBe(false);
  });
  it("rejects duplicate progress and hidden values in a missing field", () => {
    const state = createProfile();
    state.progress.deferredFields = ["budgetAmount", "budgetAmount"];
    expect(profileSchema.safeParse(state).success).toBe(false);
    const hidden = createProfile();
    hidden.fields.budgetAmount.value = 10;
    expect(profileSchema.safeParse(hidden).success).toBe(false);
  });
});
describe("profile transitions and confirmations", () => {
  it("keeps a confirmed answer when a document proposes a change", () => {
    const original = confirm(
      answer(createProfile(), "budgetAmount", 10000),
      "budgetAmount",
    );
    const next = propose(original, "budgetAmount", 25000);
    expect(next.fields.budgetAmount).toMatchObject({
      status: "confirmed",
      value: 10000,
    });
    expect(next.fields.budgetAmount.proposals[0]?.value).toBe(25000);
    expect(original.fields.budgetAmount.proposals).toHaveLength(0);
    expect(activeProfileProjection(next)).not.toHaveProperty("budgetAmount");
  });
  it("never uses an unconfirmed extracted value", () => {
    const state = propose(createProfile(), "budgetAmount", 10000);
    expect(state.fields.budgetAmount.status).toBe("extracted_unconfirmed");
    expect(usableProfileProjection(state)).toEqual({});
    expect(trustedValue(state, "budgetAmount")).toBeNull();
  });
  it("accepts an explicit proposal confirmation and records before/after", () => {
    let state = propose(
      answer(createProfile(), "budgetAmount", 10000),
      "budgetAmount",
      25000,
    );
    state = confirm(
      state,
      "budgetAmount",
      state.fields.budgetAmount.proposals[0]!.id,
    );
    expect(state.fields.budgetAmount).toMatchObject({
      status: "confirmed",
      value: 25000,
      proposals: [],
    });
    expect(state.history.at(-1)?.changes[0]).toMatchObject({
      field: "budgetAmount",
      before: { value: 10000 },
      after: { value: 25000 },
    });
  });
  it("rejects a stale proposal confirmation after a new proposal", () => {
    let state = propose(createProfile(), "budgetAmount", 10000);
    const revision = state.fields.budgetAmount.revision,
      proposalId = state.fields.budgetAmount.proposals[0]!.id;
    state = propose(state, "budgetAmount", 25000);
    const result = applyProfileEvent(state, {
      id: "stale-confirm",
      baseRevision: state.revision,
      type: "confirm",
      field: "budgetAmount",
      fieldRevision: revision,
      proposalId,
    });
    expect(result).toMatchObject({ ok: false, error: "stale_revision" });
    expect(result.state).toBe(state);
  });
  it("requires a specific proposal and cannot blindly confirm a document", () => {
    const state = propose(createProfile(), "budgetAmount", 10000);
    expect(
      applyProfileEvent(state, {
        id: "blind",
        baseRevision: state.revision,
        type: "confirm",
        field: "budgetAmount",
        fieldRevision: state.fields.budgetAmount.revision,
        proposalId: null,
      }),
    ).toMatchObject({ ok: false, error: "invalid_transition" });
  });
  it("rejects a proposal without turning missing into zero", () => {
    let state = propose(createProfile(), "budgetAmount", 10000);
    state = event(state, {
      type: "reject_proposal",
      field: "budgetAmount",
      proposalId: state.fields.budgetAmount.proposals[0]!.id,
    });
    expect(state.fields.budgetAmount).toMatchObject({
      status: "missing",
      value: null,
    });
  });
  it("retains a direct answer when its competing proposal is rejected", () => {
    let state = propose(
      answer(createProfile(), "budgetAmount", 10000),
      "budgetAmount",
      25000,
    );
    state = event(state, {
      type: "reject_proposal",
      field: "budgetAmount",
      proposalId: state.fields.budgetAmount.proposals[0]!.id,
    });
    expect(trustedValue(state, "budgetAmount")).toBe(10000);
  });
  it("retains contradictory assertions until a user resolves one", () => {
    let state = answer(
      answer(createProfile(), "preferredCountries", ["DE"]),
      "preferredCountries",
      ["IT"],
    );
    expect(state.fields.preferredCountries).toMatchObject({
      status: "conflicting",
      value: null,
    });
    expect(
      state.fields.preferredCountries.candidates.map((c) => c.value),
    ).toEqual([["DE"], ["IT"]]);
    state = event(state, {
      type: "resolve",
      field: "preferredCountries",
      fieldRevision: state.fields.preferredCountries.revision,
      value: ["IT"],
    });
    expect(state.fields.preferredCountries).toMatchObject({
      status: "confirmed",
      value: ["IT"],
    });
  });
  it("rejects a resolution that invents a third candidate", () => {
    const state = answer(
      answer(createProfile(), "preferredCountries", ["DE"]),
      "preferredCountries",
      ["IT"],
    );
    expect(
      applyProfileEvent(state, {
        id: "third",
        baseRevision: state.revision,
        type: "resolve",
        field: "preferredCountries",
        fieldRevision: state.fields.preferredCountries.revision,
        value: ["NL"],
      }),
    ).toMatchObject({ ok: false, error: "invalid_transition" });
  });
  it("allows a deliberate correction and does not downgrade an identical confirmed answer", () => {
    let state = confirm(
      answer(createProfile(), "budgetAmount", 10000),
      "budgetAmount",
    );
    state = answer(state, "budgetAmount", 10000);
    expect(state.fields.budgetAmount.status).toBe("confirmed");
    state = answer(state, "budgetAmount", 12000, "replace");
    expect(state.fields.budgetAmount).toMatchObject({
      status: "user_stated",
      value: 12000,
    });
    expect(state.history.at(-1)?.changes[0]).toMatchObject({
      before: { value: 10000 },
      after: { value: 12000 },
    });
  });
  it("is idempotent, detects reused IDs and rejects stale global revisions", () => {
    const state = createProfile(),
      data = {
        id: "one",
        baseRevision: 0,
        type: "user_answer",
        field: "studyLevel",
        value: "master",
        mode: "assert",
      };
    const first = applyProfileEvent(state, data);
    if (!first.ok) throw new Error("failed");
    expect(applyProfileEvent(first.state, data)).toMatchObject({
      ok: true,
      changed: false,
    });
    expect(
      applyProfileEvent(first.state, { ...data, value: "phd" }),
    ).toMatchObject({ ok: false, error: "event_id_reused" });
    expect(
      applyProfileEvent(first.state, { ...data, id: "two" }),
    ).toMatchObject({ ok: false, error: "stale_revision" });
  });
  it("rejects an invalid event and preserves the exact input state", () => {
    const state = createProfile();
    const result = applyProfileEvent(state, {
      id: "bad",
      baseRevision: 0,
      type: "user_answer",
      field: "admissionChance",
      value: 99,
      mode: "assert",
    });
    expect(result).toMatchObject({ ok: false, error: "invalid_input" });
    expect(result.state).toBe(state);
  });
  it("bounds competing document proposals", () => {
    let state = createProfile();
    for (const amount of [10, 20, 30])
      state = propose(state, "budgetAmount", amount);
    expect(
      applyProfileEvent(state, {
        id: "four",
        baseRevision: state.revision,
        type: "propose",
        field: "budgetAmount",
        value: 40,
        origin: "document",
        sourceRef: "SYNTHETIC",
      }),
    ).toMatchObject({ ok: false, error: "invalid_transition" });
  });
  it("invalidates dependent answers after a resolved field change, retaining qualifications", () => {
    let state = answer(createProfile(), "fieldOfStudy", "Economics");
    state = answer(state, "masterIntent", "specialisation");
    state = answer(
      state,
      "previousQualification",
      undergraduateAnswers.previousQualification,
    );
    state = answer(state, "fieldOfStudy", "Data science");
    state = event(state, {
      type: "resolve",
      field: "fieldOfStudy",
      fieldRevision: state.fields.fieldOfStudy.revision,
      value: "Data science",
    });
    expect(state.fields.masterIntent.status).toBe("extracted_unconfirmed");
    expect(state.fields.previousQualification.status).toBe("user_stated");
  });
  it("removes inactive doctoral answers from search input after a level change", () => {
    let state = answer(
      answer(createProfile(), "studyLevel", "phd"),
      "phdTopic",
      "Synthetic research",
    );
    state = answer(state, "studyLevel", "undergraduate", "replace");
    expect(state.fields.phdTopic.status).toBe("extracted_unconfirmed");
    expect(activeProfileProjection(state)).not.toHaveProperty("phdTopic");
    expect(
      advanceConversation(state, policy).questions.some(
        (q) => q.field === "phdTopic",
      ),
    ).toBe(false);
  });
  it("supports maximum-length user event IDs during context invalidation", () => {
    const state = answer(
      answer(createProfile(), "studyLevel", "phd"),
      "phdTopic",
      "Synthetic research",
    );
    const result = applyProfileEvent(state, {
      id: "a".repeat(120),
      baseRevision: state.revision,
      type: "user_answer",
      field: "studyLevel",
      value: "master",
      mode: "replace",
    });
    expect(result.ok).toBe(true);
  });
});
describe("golden questions and limited readiness", () => {
  it("lists unknown details inside a stated qualification without inventing an institution", () => {
    const readiness = assessProfile(complete(), policy);
    expect(readiness.status).toBe("ready_limited");
    expect(readiness.unknownDetails).toEqual([
      "previousQualification.institution",
      "previousQualification.credits",
    ]);
  });
  it("does not interrogate an inactive PhD conflict after switching to undergraduate", () => {
    let state = answer(complete(), "studyLevel", "phd", "replace");
    state = answer(answer(state, "phdTopic", "Topic A"), "phdTopic", "Topic B");
    state = answer(state, "studyLevel", "undergraduate", "replace");
    expect(advanceConversation(state, policy).status).toBe("ready_limited");
    expect(activeProfileProjection(state)).not.toHaveProperty("phdTopic");
  });
  it("has unique versioned IDs, all nine groups and valid follow-ups", () => {
    const config = goldenQuestionConfig;
    expect(new Set(config.questions.map((q) => q.group)).size).toBe(9);
    expect(new Set(config.questions.map((q) => q.id)).size).toBe(
      config.questions.length,
    );
    for (const q of config.questions) {
      expect(questionSchema.safeParse(q).success).toBe(true);
      if (q.followUp)
        expect(config.questions.some((next) => next.id === q.followUp)).toBe(
          true,
        );
    }
  });
  it("asks only level and field first, with at most two English questions", () => {
    const turn = advanceConversation(createProfile(), policy);
    expect(turn.questions.map((q) => q.field)).toEqual([
      "studyLevel",
      "fieldOfStudy",
    ]);
    expect(
      turn.questions.every(
        (q) => /[a-zA-Z]/.test(q.prompt) && !/[čćšđž]/i.test(q.prompt),
      ),
    ).toBe(true);
  });
  it("returns pending questions unchanged without consuming another attempt", () => {
    const first = advanceConversation(createProfile(), policy),
      second = advanceConversation(first.state, policy);
    expect(second.state).toEqual(first.state);
    expect(second.questions.map((q) => q.id)).toEqual(
      first.questions.map((q) => q.id),
    );
  });
  it("stops at enough information and lists unknown details", () => {
    const turn = advanceConversation(complete(), policy);
    expect(turn.status).toBe("ready_limited");
    expect(turn.questions).toHaveLength(0);
    expect(turn.readiness.unknownFields).toContain("languageResults");
    expect(turn.explanation).toContain("No recommendations have been computed");
  });
  it("does not re-ask a confirmed answer while another required field is missing", () => {
    let state = confirm(
      answer(createProfile(), "studyLevel", "undergraduate"),
      "studyLevel",
    );
    state = answer(state, "fieldOfStudy", "Computer science");
    const turn = advanceConversation(state, policy);
    expect(turn.questions.some((q) => q.field === "studyLevel")).toBe(false);
  });
  it("asks currency, period and coverage without an exchange rate or scope assumption", () => {
    let state = complete();
    const missing = createProfile();
    state.fields.budgetCurrency = missing.fields.budgetCurrency;
    state.fields.budgetPeriod = missing.fields.budgetPeriod;
    state.fields.budgetIncludesLiving = missing.fields.budgetIncludesLiving;
    let turn = advanceConversation(state, policy);
    expect(turn.questions.map((q) => q.field)).toEqual([
      "budgetCurrency",
      "budgetPeriod",
    ]);
    state = answer(turn.state, "budgetCurrency", "EUR");
    state = answer(state, "budgetPeriod", "year");
    turn = advanceConversation(state, policy);
    expect(turn.questions.map((q) => q.field)).toEqual([
      "budgetIncludesLiving",
    ]);
    expect(turn.readiness.status).toBe("needs_clarification");
  });
  it("prioritizes cross-field country conflict and resolves both lists atomically", () => {
    let state = answer(complete(), "excludedCountries", ["DE"]);
    expect(effectiveFieldStatus(state, "preferredCountries")).toBe(
      "conflicting",
    );
    expect(advanceConversation(state, policy).questions[0]?.id).toBe(
      "clarify-countries",
    );
    expect(
      applyProfileEvent(state, {
        id: "overlap",
        baseRevision: state.revision,
        type: "resolve_countries",
        preferredCountries: ["DE"],
        excludedCountries: ["DE"],
      }),
    ).toMatchObject({ ok: false, error: "invalid_transition" });
    state = event(state, {
      type: "resolve_countries",
      preferredCountries: ["NL"],
      excludedCountries: ["DE"],
    });
    expect(profileConflicts(state)).toEqual([]);
    expect(assessProfile(state, policy).status).toBe("ready_limited");
  });
  it("rejects an empty list as an only-country hard restriction", () => {
    const state = answer(complete(), "preferredCountries", [], "replace");
    expect(assessProfile(state, policy).conflicts.map((c) => c.id)).toContain(
      "empty-country-limit",
    );
    expect(advanceConversation(state, policy).status).toBe("asking");
  });
  it("flags contradictory PhD funding without waiving the requirement", () => {
    const result = replayConversation(
      profileConversations.find((f) => f.id === "PROFILE-PHD-FUNDED")!,
    );
    const state = answer(result.state, "phdFunding", "self_funded", "replace");
    expect(assessProfile(state, policy).conflicts.map((c) => c.id)).toContain(
      "funding-disagreement",
    );
    expect(trustedValue(state, "scholarshipNeed")).toBe("required");
  });
  it("clarifies a past intake instead of silently advancing its year", () => {
    const state = answer(complete(), "startYear", 2025, "replace");
    expect(assessProfile(state, policy).conflicts.map((c) => c.id)).toContain(
      "past-start-year",
    );
    expect(advanceConversation(state, policy).questions[0]?.field).toBe(
      "startYear",
    );
    expect(trustedValue(state, "startYear")).toBe(2025);
    expect(() => assessProfile(state, { asOfYear: NaN })).toThrow();
  });
  it("requires relevant subjects for a master's field change", () => {
    let state = answer(complete(), "studyLevel", "master", "replace");
    state = answer(state, "masterIntent", "change_field");
    expect(requiredFields(state)).toContain("relevantSubjects");
    expect(assessProfile(state, policy).requiredMissing).toContain(
      "relevantSubjects",
    );
  });
  it("skipping a required field never creates a usable value", () => {
    let state = complete();
    state.fields.teachingLanguages = createProfile().fields.teachingLanguages;
    state = event(state, { type: "skip", field: "teachingLanguages" });
    expect(advanceConversation(state, policy).status).toBe("paused_for_review");
    expect(state.fields.teachingLanguages.value).toBeNull();
    state = event(state, { type: "resume", field: "teachingLanguages" });
    expect(advanceConversation(state, policy).questions[0]?.field).toBe(
      "teachingLanguages",
    );
  });
  it("bounds retries at two per unchanged question context", () => {
    let state = complete();
    state.fields.teachingLanguages = createProfile().fields.teachingLanguages;
    state = advanceConversation(state, policy).state;
    state = answer(state, "interests", ["Optional voluntary answer"]);
    state = advanceConversation(state, policy).state;
    state = answer(state, "orientation", "practical");
    expect(advanceConversation(state, policy).status).toBe("paused_for_review");
    expect(state.progress.presentations).toBe(2);
  });
  it("caps total presentations even when new contexts are created", () => {
    let state = complete();
    state.fields.teachingLanguages = createProfile().fields.teachingLanguages;
    for (let i = 0; i < 30; i++) {
      state = event(state, { type: "resume", field: "teachingLanguages" });
      state = advanceConversation(state, policy).state;
    }
    expect(state.progress.presentations).toBe(24);
    expect(advanceConversation(state, policy).status).toBe("paused_for_review");
  });
  it("does not use deferred optional extracted data in a ready limited profile", () => {
    let state = propose(complete(), "professionalExperience", [
      "Synthetic work",
    ]);
    state = event(state, { type: "skip", field: "professionalExperience" });
    expect(advanceConversation(state, policy).status).toBe("ready_limited");
    expect(activeProfileProjection(state)).not.toHaveProperty(
      "professionalExperience",
    );
  });
  it("rejects a forged stored question identifier", () => {
    const state = advanceConversation(createProfile(), policy).state;
    state.progress.awaiting[0]!.id = "not-a-question";
    expect(() => advanceConversation(state, policy)).toThrow(
      "Invalid stored question reference",
    );
  });
});
