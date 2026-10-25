import {
  profileSchema,
  profileEventSchema,
  profileValueSchemas,
  fieldKeys,
  emptyField,
  trustedValue,
  type FieldKey,
  type ProfileField,
  type ProfileState,
  type ProfileValues,
  type Provenance,
} from "./schema.ts";

export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export interface ProfileConflict {
  id: string;
  fields: FieldKey[];
  message: string;
}
export function profileConflicts(state: ProfileState): ProfileConflict[] {
  const result: ProfileConflict[] = [];
  for (const key of fieldKeys)
    if (state.fields[key].status === "conflicting")
      result.push({
        id: `field-${key}`,
        fields: [key],
        message: `Your answers for ${key} disagree. Choose the value to keep.`,
      });
  const preferred = trustedValue(state, "preferredCountries"),
    excluded = trustedValue(state, "excludedCountries");
  if (preferred && excluded && preferred.some((c) => excluded.includes(c)))
    result.push({
      id: "country-overlap",
      fields: ["preferredCountries", "excludedCountries"],
      message:
        "A country appears in both your preferred and excluded lists. Confirm which countries to keep in each list.",
    });
  const limits = trustedValue(state, "hardConstraints");
  if (limits?.countries === "only_preferred" && preferred?.length === 0)
    result.push({
      id: "empty-country-limit",
      fields: ["preferredCountries", "hardConstraints"],
      message:
        "A hard country limit needs at least one allowed country, or an explicit change to that limit.",
    });
  const funding = trustedValue(state, "phdFunding"),
    scholarship = trustedValue(state, "scholarshipNeed");
  if (
    trustedValue(state, "studyLevel") === "phd" &&
    funding === "self_funded" &&
    scholarship === "required"
  )
    result.push({
      id: "funding-disagreement",
      fields: ["phdFunding", "scholarshipNeed"],
      message:
        "Self-funding and a required scholarship disagree. Correct the requirement you want to change.",
    });
  return result;
}
export function effectiveFieldStatus(state: ProfileState, key: FieldKey) {
  return profileConflicts(state).some((c) => c.fields.includes(key))
    ? "conflicting"
    : state.fields[key].status;
}
type Transition =
  | { ok: true; state: ProfileState; changed: boolean }
  | {
      ok: false;
      state: ProfileState;
      error:
        | "invalid_input"
        | "stale_revision"
        | "invalid_transition"
        | "capacity_reached"
        | "event_id_reused";
    };
export function applyProfileEvent(
  input: ProfileState,
  eventInput: unknown,
): Transition {
  const p = profileSchema.safeParse(input),
    e = profileEventSchema.safeParse(eventInput);
  const fail = (
    error: Extract<Transition, { ok: false }>["error"],
  ): Transition => ({ ok: false, state: input, error });
  if (!p.success || !e.success) return fail("invalid_input");
  const event = e.data;
  const signature = canonical(event);
  const oldEvent = p.data.seenEvents.find((v) => v.id === event.id);
  if (oldEvent)
    return oldEvent.signature === signature
      ? { ok: true, state: input, changed: false }
      : fail("event_id_reused");
  if (event.baseRevision !== p.data.revision) return fail("stale_revision");
  if (p.data.seenEvents.length >= 256 || p.data.history.length >= 256)
    return fail("capacity_reached");
  const next = structuredClone(p.data);
  const fields = next.fields as Record<FieldKey, ProfileField<unknown>>;
  const provenance: Provenance = {
    origin: "user",
    eventId: event.id,
    sourceRef: null,
  };
  let target: FieldKey | null = null;
  if (event.type === "resolve_countries") {
    if (
      event.preferredCountries.some((c) => event.excludedCountries.includes(c))
    )
      return fail("invalid_transition");
    for (const key of ["preferredCountries", "excludedCountries"] as const)
      fields[key] = {
        ...emptyField(),
        status: "confirmed",
        value: event[key],
        revision: fields[key].revision + 1,
        provenance: { ...provenance, origin: "user_confirmation" },
      };
  } else {
    target = event.field;
    const current = fields[target];
    if (
      event.type === "user_answer" ||
      event.type === "propose" ||
      event.type === "resolve"
    ) {
      const parsed = profileValueSchemas[target].safeParse(event.value);
      if (!parsed.success) return fail("invalid_input");
      const value: unknown = parsed.data;
      if (event.type === "resolve") {
        if (event.fieldRevision !== current.revision)
          return fail("stale_revision");
        if (
          current.status !== "conflicting" ||
          !current.candidates.some(
            (c) => canonical(c.value) === canonical(value),
          )
        )
          return fail("invalid_transition");
        fields[target] = {
          ...emptyField(),
          status: "confirmed",
          value,
          revision: current.revision + 1,
          provenance: { ...provenance, origin: "user_confirmation" },
        };
      } else if (event.type === "propose") {
        if (current.proposals.length >= 3 || current.status === "conflicting")
          return fail("invalid_transition");
        const proposal = {
          id: event.id,
          value,
          provenance: {
            ...provenance,
            origin: event.origin,
            sourceRef: event.sourceRef,
          },
        };
        if (
          current.status === "missing" ||
          current.status === "extracted_unconfirmed"
        )
          fields[target] = {
            ...current,
            status: "extracted_unconfirmed",
            value: current.value ?? value,
            provenance: current.provenance ?? proposal.provenance,
            revision: current.revision + 1,
            proposals: [...current.proposals, proposal],
            reason: "Review this extracted value before using it.",
          };
        else
          fields[target] = {
            ...current,
            revision: current.revision + 1,
            proposals: [...current.proposals, proposal],
            reason:
              "Your current answer is kept; the proposed change needs your confirmation.",
          };
      } else {
        if (event.mode === "assert" && current.status === "conflicting")
          return fail("invalid_transition");
        const trusted =
          current.status === "user_stated" || current.status === "confirmed";
        if (
          event.mode === "assert" &&
          trusted &&
          canonical(current.value) !== canonical(value)
        ) {
          fields[target] = {
            ...emptyField(),
            status: "conflicting",
            revision: current.revision + 1,
            candidates: [
              { value: current.value, provenance: current.provenance! },
              { value, provenance },
            ],
            reason:
              "Two direct answers disagree. Choose one or explicitly correct the value.",
          };
        } else if (
          trusted &&
          canonical(current.value) === canonical(value) &&
          !current.proposals.length
        ) {
          // An identical direct answer does not downgrade a confirmation.
        } else
          fields[target] = {
            ...emptyField(),
            status: "user_stated",
            value,
            revision: current.revision + 1,
            provenance,
          };
      }
    } else if (event.type === "confirm") {
      if (event.fieldRevision !== current.revision)
        return fail("stale_revision");
      const proposal = event.proposalId
        ? current.proposals.find((p) => p.id === event.proposalId)
        : null;
      if (
        (event.proposalId && !proposal) ||
        current.status === "missing" ||
        current.status === "conflicting" ||
        (!proposal && current.status === "extracted_unconfirmed") ||
        (!proposal && current.proposals.length)
      )
        return fail("invalid_transition");
      fields[target] = {
        ...emptyField(),
        status: "confirmed",
        value: proposal?.value ?? current.value,
        revision: current.revision + 1,
        provenance: {
          origin: "user_confirmation",
          eventId: event.id,
          sourceRef:
            proposal?.provenance.sourceRef ??
            current.provenance?.sourceRef ??
            null,
        },
      };
    } else if (event.type === "reject_proposal") {
      if (!current.proposals.some((p) => p.id === event.proposalId))
        return fail("invalid_transition");
      const remaining = current.proposals.filter(
        (p) => p.id !== event.proposalId,
      );
      if (current.status === "extracted_unconfirmed") {
        if (!remaining.length)
          fields[target] = {
            ...emptyField(),
            revision: current.revision + 1,
            reason:
              "The extracted suggestion was rejected; this field is still missing.",
          };
        else
          fields[target] = {
            ...current,
            value: remaining[0]!.value,
            provenance: remaining[0]!.provenance,
            proposals: remaining,
            revision: current.revision + 1,
          };
      } else
        fields[target] = {
          ...current,
          proposals: remaining,
          revision: current.revision + 1,
          reason: remaining.length ? current.reason : null,
        };
    } else if (event.type === "skip") {
      if (!next.progress.deferredFields.includes(target))
        next.progress.deferredFields.push(target);
    } else if (event.type === "resume") {
      next.progress.deferredFields = next.progress.deferredFields.filter(
        (k) => k !== target,
      );
      // Only this field/context is reopened; the global presentation cap stays.
      next.progress.attempts = next.progress.attempts.filter(
        (a) => !a.context.startsWith(`${target}:`),
      );
    }
  }
  if (target && !["skip", "resume"].includes(event.type))
    next.progress.deferredFields = next.progress.deferredFields.filter(
      (k) => k !== target,
    );
  // Context-dependent answers become suggestions for review, never silently reused.
  const invalidate = (key: FieldKey) => {
    const f = fields[key];
    if (
      (f.status === "confirmed" || f.status === "user_stated") &&
      f.value !== null
    ) {
      const proposal = {
        id: `review-${next.revision + 1}-${key}`,
        value: f.value,
        provenance: {
          origin: "context_review" as const,
          eventId: event.id,
          sourceRef: "Study goal context changed",
        },
      };
      fields[key] = {
        ...emptyField(),
        status: "extracted_unconfirmed",
        value: f.value,
        provenance: proposal.provenance,
        revision: f.revision + 1,
        proposals: [proposal],
        reason:
          "The level or study field changed. Review whether this answer still applies.",
      };
    }
  };
  // A conflict preserves the previous answer as its first candidate. Resolving
  // to a different candidate must invalidate context just like an explicit edit.
  const previousContext = (key: "studyLevel" | "fieldOfStudy") =>
    trustedValue(p.data, key) ??
    (p.data.fields[key].status === "conflicting"
      ? p.data.fields[key].candidates[0]?.value
      : null);
  const previousLevel = previousContext("studyLevel"),
    nextLevel = trustedValue(next, "studyLevel");
  const previousField = previousContext("fieldOfStudy"),
    nextField = trustedValue(next, "fieldOfStudy");
  if (previousLevel && nextLevel && previousLevel !== nextLevel) {
    for (const key of [
      "masterIntent",
      "phdTopic",
      "phdFunding",
      "phdPositionType",
      "phdFocus",
      "researchProposal",
      "relevantSubjects",
    ] as const)
      invalidate(key);
  } else if (previousField && nextField && previousField !== nextField) {
    for (const key of ["masterIntent", "relevantSubjects", "phdTopic"] as const)
      invalidate(key);
  }
  const changedFields = fieldKeys.filter(
    (k) => canonical(p.data.fields[k]) !== canonical(fields[k]),
  );
  next.revision++;
  next.progress.awaiting = [];
  next.seenEvents.push({ id: event.id, signature });
  next.history.push({
    eventId: event.id,
    revision: next.revision,
    kind: event.type,
    changedFields,
    changes: changedFields.map((field) => ({
      field,
      before: p.data.fields[field],
      after: fields[field],
    })),
  });
  const checked = profileSchema.safeParse(next);
  if (!checked.success) return fail("invalid_transition");
  return { ok: true, state: checked.data, changed: true };
}
export function usableProfileProjection(
  state: ProfileState,
): Partial<ProfileValues> {
  return Object.fromEntries(
    fieldKeys
      .filter(
        (k) =>
          ["user_stated", "confirmed"].includes(state.fields[k].status) &&
          effectiveFieldStatus(state, k) !== "conflicting",
      )
      .map((k) => [k, trustedValue(state, k)]),
  ) as Partial<ProfileValues>;
}
