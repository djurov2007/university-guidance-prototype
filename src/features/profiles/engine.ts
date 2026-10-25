import {
  profileSchema,
  trustedValue,
  type FieldKey,
  type ProfileState,
  type QuestionRef,
  type ProfileValues,
} from "./schema.ts";
import {
  activeFields,
  requiredFields,
  conditionApplies,
  goldenQuestionConfig,
  type GoldenQuestion,
} from "./questions.ts";
import {
  profileConflicts,
  usableProfileProjection,
  type ProfileConflict,
} from "./state.ts";

export interface ProfilePolicy {
  asOfYear: number;
}
export interface ProfileReadiness {
  status: "needs_clarification" | "ready_limited";
  requiredMissing: FieldKey[];
  pendingReview: FieldKey[];
  unknownFields: FieldKey[];
  unknownDetails: string[];
  conflicts: ProfileConflict[];
  explanation: string;
}
export function assessProfile(
  input: ProfileState,
  policy: ProfilePolicy,
): ProfileReadiness {
  const state = profileSchema.parse(input);
  if (
    !Number.isInteger(policy.asOfYear) ||
    policy.asOfYear < 2000 ||
    policy.asOfYear > 2100
  )
    throw new Error("A valid current year is required");
  const active = activeFields(state);
  const conflicts = profileConflicts(state).filter((conflict) =>
    conflict.fields.some((field) => active.includes(field)),
  );
  const start = trustedValue(state, "startYear");
  if (start !== null && start < policy.asOfYear)
    conflicts.push({
      id: "past-start-year",
      fields: ["startYear"],
      message:
        "Your start year is in the past. Confirm a current or future year; no replacement year is assumed.",
    });
  const blocked = new Set(conflicts.flatMap((c) => c.fields));
  const pendingReview = active.filter(
    (key) => state.fields[key].proposals.length > 0,
  );
  const requiredMissing = requiredFields(state).filter(
    (key) =>
      trustedValue(state, key) === null ||
      blocked.has(key) ||
      pendingReview.includes(key),
  );
  const unknownFields = active.filter(
    (key) =>
      trustedValue(state, key) === null ||
      blocked.has(key) ||
      pendingReview.includes(key),
  );
  const ready =
    !requiredMissing.length &&
    !conflicts.length &&
    !pendingReview.some((key) => !state.progress.deferredFields.includes(key));
  // A recorded qualification/test can still contain unknown details. Listing
  // those gaps does not claim institution recognition or require a longer form.
  const unknownDetails: string[] = [];
  const qualification = trustedValue(state, "previousQualification");
  if (qualification)
    for (const key of ["institution", "completionYear", "credits"] as const) {
      if (qualification[key] === null)
        unknownDetails.push(`previousQualification.${key}`);
    }
  const subjects = trustedValue(state, "relevantSubjects");
  subjects?.forEach((subject, index) => {
    for (const key of ["result", "credits"] as const)
      if (subject[key] === null)
        unknownDetails.push(`relevantSubjects[${index}].${key}`);
  });
  const results = trustedValue(state, "languageResults");
  results?.forEach((result, index) => {
    for (const key of ["overall", "scale", "takenOn", "note"] as const)
      if (result[key] === null)
        unknownDetails.push(`languageResults[${index}].${key}`);
  });
  return {
    status: ready ? "ready_limited" : "needs_clarification",
    requiredMissing,
    pendingReview,
    unknownFields,
    unknownDetails,
    conflicts,
    explanation: ready
      ? "Your profile has enough information for a limited search. Unknown details remain listed. Qualifications and language results are self-reported; institutional eligibility, costs, deadlines and funding still need verified catalog evidence. No recommendations have been computed."
      : "Your profile still needs the listed answers, confirmations or conflict resolutions before a useful limited search. Missing values are not assumed.",
  };
}
export interface PresentedQuestion extends GoldenQuestion {
  context: string;
  reason: string;
  currentValue: unknown;
  proposals: { id: string; value: unknown; sourceRef: string | null }[];
  candidates: unknown[];
}
export interface ConversationTurn {
  state: ProfileState;
  status: "asking" | "ready_limited" | "paused_for_review";
  questions: PresentedQuestion[];
  readiness: ProfileReadiness;
  explanation: string;
}
function present(
  q: GoldenQuestion,
  state: ProfileState,
  reason: string,
): PresentedQuestion {
  const f = state.fields[q.field];
  return {
    ...q,
    context: `${q.field}:${f.revision}:${q.id}`,
    reason,
    currentValue: f.value,
    proposals: f.proposals.map((p) => ({
      id: p.id,
      value: p.value,
      sourceRef: p.provenance.sourceRef,
    })),
    candidates: f.candidates.map((c) => c.value),
  };
}
function candidates(
  state: ProfileState,
  readiness: ProfileReadiness,
): PresentedQuestion[] {
  const config = goldenQuestionConfig.questions;
  const active = activeFields(state);
  const needed = requiredFields(state);
  const questions: PresentedQuestion[] = [];
  for (const c of readiness.conflicts) {
    if (c.id === "country-overlap")
      questions.push(
        present(
          config.find((q) => q.id === "clarify-countries")!,
          state,
          c.message,
        ),
      );
    else
      for (const field of c.fields) {
        const q = config.find(
          (q) =>
            q.id ===
            `${c.id.startsWith("field-") ? "resolve" : "clarify"}-${field}`,
        )!;
        questions.push(present(q, state, c.message));
      }
  }
  for (const key of active)
    if (state.fields[key].proposals.length)
      questions.push(
        present(
          config.find((q) => q.id === `confirm-${key}`)!,
          state,
          state.fields[key].reason ?? "Confirm the proposed value.",
        ),
      );
  for (const q of config)
    if (
      q.kind === "answer" &&
      needed.includes(q.field) &&
      state.fields[q.field].status === "missing" &&
      conditionApplies(q.when, state)
    ) {
      // Establish the level before choosing a qualification or a branch-specific question.
      if (
        trustedValue(state, "studyLevel") === null &&
        q.field !== "studyLevel" &&
        q.field !== "fieldOfStudy"
      )
        continue;
      questions.push(
        present(q, state, "This answer is needed for a useful limited search."),
      );
    }
  const blocked = new Set<FieldKey>();
  return questions
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))
    .filter((q) => {
      if (
        blocked.has(q.field) ||
        state.progress.deferredFields.includes(q.field)
      )
        return false;
      if (
        q.kind === "country_conflict" &&
        state.progress.deferredFields.includes("excludedCountries")
      )
        return false;
      const count =
        state.progress.attempts.find((a) => a.context === q.context)?.count ??
        0;
      if (count >= goldenQuestionConfig.maxAttemptsPerContext) return false;
      blocked.add(q.field);
      if (q.kind === "country_conflict") blocked.add("excludedCountries");
      return true;
    });
}
export function advanceConversation(
  input: ProfileState,
  policy: ProfilePolicy,
): ConversationTurn {
  const state = profileSchema.parse(input);
  const readiness = assessProfile(state, policy);
  if (state.progress.awaiting.length) {
    const pending = state.progress.awaiting.map((ref) => {
      const q = goldenQuestionConfig.questions.find((q) => q.id === ref.id);
      if (!q || q.field !== ref.field || q.kind !== ref.kind)
        throw new Error("Invalid stored question reference");
      const shown = present(
        q,
        state,
        "Waiting for your answer; you may skip or correct it.",
      );
      if (shown.context !== ref.context)
        throw new Error("Stale stored question context");
      return shown;
    });
    return {
      state,
      status: "asking",
      questions: pending,
      readiness,
      explanation:
        "Answer the pending questions, correct a value or explicitly skip a field.",
    };
  }
  if (readiness.status === "ready_limited")
    return {
      state,
      status: "ready_limited",
      questions: [],
      readiness,
      explanation: readiness.explanation,
    };
  if (state.history.length >= 256)
    return {
      state,
      status: "paused_for_review",
      questions: [],
      readiness,
      explanation:
        "The local history limit has been reached. Review this synthetic profile before continuing.",
    };
  const remaining =
    goldenQuestionConfig.maxPresentations - state.progress.presentations;
  const questions = candidates(state, readiness).slice(
    0,
    Math.min(goldenQuestionConfig.maxQuestionsPerTurn, remaining),
  );
  if (!questions.length)
    return {
      state,
      status: "paused_for_review",
      questions: [],
      readiness,
      explanation:
        remaining <= 0
          ? "The question limit has been reached. Review or directly correct the remaining gaps; the profile is not assumed complete."
          : "Some needed fields were deferred or have reached their question limit. Resume a deferred field or directly correct the remaining gaps; no value is assumed.",
    };
  const next = structuredClone(state);
  for (const q of questions) {
    const attempt = next.progress.attempts.find((a) => a.context === q.context);
    if (attempt) attempt.count++;
    else next.progress.attempts.push({ context: q.context, count: 1 });
  }
  next.progress.presentations += questions.length;
  next.progress.awaiting = questions.map(
    ({ id, field, kind, context }): QuestionRef => ({
      id,
      field,
      kind,
      context,
    }),
  );
  next.revision++;
  next.history.push({
    eventId: `question-turn-${next.revision}`,
    revision: next.revision,
    kind: "questions_presented",
    changedFields: [],
    changes: [],
  });
  return {
    state: profileSchema.parse(next),
    status: "asking",
    questions,
    readiness,
    explanation:
      "Please answer these questions. Proposed values need an explicit confirmation; you can correct or skip a field.",
  };
}
// This is a profile input contract for future search, not a matching result.
export function activeProfileProjection(
  state: ProfileState,
): Partial<ProfileValues> {
  const projection = usableProfileProjection(state);
  return Object.fromEntries(
    activeFields(state)
      .filter(
        (key) =>
          projection[key] !== undefined && !state.fields[key].proposals.length,
      )
      .map((key) => [key, projection[key]]),
  ) as Partial<ProfileValues>;
}
