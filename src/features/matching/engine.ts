import { assessProfile, activeProfileProjection } from "../profiles/engine.ts";
import { canonical } from "../profiles/state.ts";
import { rankComponents, type RankingComponents } from "./ranking.ts";
import {
  matchingInputSchema,
  publicMatchingOutputSchema,
  type MatchingInput,
  type MatchingOutput,
  type MatchingProgram,
  type Proof,
  type MatchReason,
  type RequirementCheck,
  type Deviation,
  type AlternativeConsent,
} from "./schema.ts";
const norm = (value: string) => value.trim().toLowerCase();
const aliases: Record<string, string[]> = {
  "computer science": [
    "computer science",
    "software engineering",
    "informatics",
  ],
  "software engineering": ["software engineering", "computer science"],
  "data science": ["data science"],
  economics: ["economics"],
  business: ["business", "business administration"],
  "machine learning": ["machine learning", "artificial intelligence"],
};
function proofStatus(
  proof: Proof,
  input: MatchingInput,
  maxAge = 30,
): "verified" | "unknown" | "source_conflict" {
  if (proof.status === "conflicting") return "source_conflict";
  const year = input.profile.fields.startYear.value;
  const age = (Date.parse(input.asOf) - Date.parse(proof.checkedOn)) / 86400000;
  if (
    proof.status !== "verified" ||
    proof.candidateScope !== "all" ||
    (proof.startYear !== null && proof.startYear !== year) ||
    age < 0 ||
    age > maxAge
  )
    return "unknown";
  return "verified";
}
function reason(
  code: string,
  category: MatchReason["category"],
  message: string,
  proof: Proof,
): MatchReason {
  return {
    code,
    category,
    message,
    factIds: proof.factIds,
    sourceIds: proof.sourceIds,
  };
}
export interface PrivateEvaluation {
  program: MatchingProgram;
  excluded: boolean;
  reasons: MatchReason[];
  checks: RequirementCheck[];
  deviations: Deviation[];
  warnings: string[];
  needsVerification: boolean;
  ranking: ReturnType<typeof rankComponents>;
  components: RankingComponents;
}
function evaluate(
  program: MatchingProgram,
  input: MatchingInput,
): PrivateEvaluation {
  const profile = activeProfileProjection(input.profile),
    reasons: MatchReason[] = [],
    checks: RequirementCheck[] = [],
    deviations: Deviation[] = [],
    warnings: string[] = [];
  let excluded = false,
    needsVerification = false;
  const components: RankingComponents = {
    interest: null,
    finance: 0,
    location: null,
    language: 0,
    other: null,
  };
  const addDeviation = (
    code: Deviation["code"],
    hard: boolean,
    message: string,
  ) => deviations.push({ code, hard, message });
  const markUnknown = (code: string, message: string, proof: Proof) => {
    needsVerification = true;
    warnings.push(message);
    reasons.push(reason(code, "source", message, proof));
  };
  if (program.level !== profile.studyLevel) {
    excluded = true;
    reasons.push(
      reason(
        "wrong-level",
        "level",
        "The study level differs from your requested level.",
        program.identityProof,
      ),
    );
  } else
    reasons.push(
      reason(
        "level-matches",
        "level",
        "The catalog level matches your requested level.",
        program.identityProof,
      ),
    );
  const desired = aliases[norm(profile.fieldOfStudy!)] ?? [
    norm(profile.fieldOfStudy!),
  ];
  const topics = program.topics.map(norm);
  const editorialProof = {
    ...program.identityProof,
    factIds: [],
    sourceIds: [],
  };
  if (!desired.some((t) => topics.includes(t))) {
    excluded = true;
    reasons.push(
      reason(
        "wrong-field",
        "interest",
        "The editorial subject mapping does not match your requested field.",
        editorialProof,
      ),
    );
  } else {
    const interests = profile.interests?.map(norm) ?? [];
    components.interest = interests.length
      ? 0.5 +
        (0.5 * interests.filter((i) => topics.includes(i)).length) /
          interests.length
      : 1;
    reasons.push(
      reason(
        "subject-matches",
        "interest",
        "The controlled editorial subject mapping matches your requested field; it is not an admissions assessment.",
        editorialProof,
      ),
    );
  }
  if (excluded)
    return {
      program,
      excluded,
      reasons,
      checks,
      deviations,
      warnings,
      needsVerification,
      components,
      ranking: rankComponents(components),
    };
  if (proofStatus(program.identityProof, input) !== "verified")
    markUnknown(
      "identity-unverified",
      "Verify the program identity and intake for your intended year.",
      program.identityProof,
    );
  const preferred = profile.preferredCountries!,
    excludedCountries = profile.excludedCountries ?? [];
  if (excludedCountries.includes(program.country))
    addDeviation(
      "excluded_country",
      true,
      `This option is in ${program.country}, a country you excluded.`,
    );
  else if (preferred.length && !preferred.includes(program.country))
    addDeviation(
      "country",
      profile.hardConstraints!.countries === "only_preferred",
      `This option is in ${program.country}, outside your preferred countries.`,
    );
  components.location = preferred.length
    ? preferred.includes(program.country)
      ? 1
      : 0
    : null;
  reasons.push(
    reason(
      "country-check",
      "location",
      preferred.includes(program.country)
        ? "The country is on your preferred list."
        : preferred.length
          ? "The country differs from your preference; permission is required."
          : "You explicitly have no preferred country.",
      program.identityProof,
    ),
  );
  if (
    proofStatus(program.languageProof, input) !== "verified" ||
    !program.languages.length
  )
    markUnknown(
      "language-unverified",
      "The teaching language needs source verification; no language match is assumed.",
      program.languageProof,
    );
  else {
    const matched = program.languages.some((language) =>
      profile.teachingLanguages!.map(norm).includes(norm(language)),
    );
    components.language = matched ? 1 : 0;
    if (!matched)
      addDeviation(
        "language",
        profile.hardConstraints!.languages === "only_listed",
        "The teaching language differs from your listed languages. Your permission does not waive an institution's language requirement.",
      );
    reasons.push(
      reason(
        "teaching-language-check",
        "language",
        matched
          ? "A verified teaching language matches your list."
          : "The teaching language differs from your list.",
        program.languageProof,
      ),
    );
  }
  const cost = program.cost;
  if (
    !cost ||
    proofStatus(program.costProof, input) !== "verified" ||
    proofStatus(cost.proof, input) !== "verified"
  )
    markUnknown(
      "cost-unverified",
      "Verify the cost for your applicant category, intake, period and living-cost scope.",
      program.costProof,
    );
  else {
    const desiredCoverage = profile.budgetIncludesLiving
      ? "tuition_and_living"
      : "tuition";
    const convert = (amount: number, period: string) =>
      period === "month" ? amount * 12 : amount;
    const periodsComparable =
      cost.period === profile.budgetPeriod ||
      (["year", "month"].includes(cost.period) &&
        ["year", "month"].includes(profile.budgetPeriod!));
    if (cost.currency !== profile.budgetCurrency || !periodsComparable)
      markUnknown(
        "cost-units-unknown",
        "The currency or budget period is not directly comparable. No exchange rate or degree duration is assumed.",
        cost.proof,
      );
    else {
      const price = convert(cost.amount, cost.period),
        budget = convert(profile.budgetAmount!, profile.budgetPeriod!);
      const knownExcess =
        price > budget &&
        (cost.coverage === desiredCoverage ||
          (cost.coverage === "tuition" &&
            desiredCoverage === "tuition_and_living"));
      if (knownExcess) {
        components.finance = 0;
        addDeviation(
          "budget",
          profile.hardConstraints!.budget === "hard_maximum",
          "The verified cost or tuition lower bound exceeds your stated budget. Funding is not assumed.",
        );
      } else if (cost.coverage !== desiredCoverage)
        markUnknown(
          "living-costs-unknown",
          "Tuition alone does not establish affordability including living costs, and total costs do not isolate tuition.",
          cost.proof,
        );
      else {
        components.finance = 1;
        reasons.push(
          reason(
            "budget-within-limit",
            "finance",
            "The recorded cost is within the stated budget in comparable units and coverage. This does not confirm all future charges.",
            cost.proof,
          ),
        );
      }
    }
  }
  if (profile.scholarshipNeed === "required") {
    if (
      program.funding === "none" &&
      proofStatus(program.fundingProof, input) === "verified"
    ) {
      excluded = true;
      reasons.push(
        reason(
          "required-funding-unavailable",
          "finance",
          "No funding route is recorded although you require a scholarship.",
          program.fundingProof,
        ),
      );
    } else
      addDeviation(
        "scholarship",
        true,
        "Funding or a scholarship is required but has not been awarded to you. This remains a conditional option.",
      );
  }
  if (program.funding === "possible")
    warnings.push(
      "A possible scholarship is not approved funding and is never deducted from the cost.",
    );
  if (profile.studyLevel === "phd")
    markUnknown(
      "phd-position-review",
      "Verify the research topic, position type and funding conditions for this exact doctoral position; they are not inferred from its title.",
      program.fundingProof,
    );
  if (profile.hardConstraints!.other.length)
    markUnknown(
      "uncompiled-hard-constraints",
      "Additional textual hard constraints need explicit rule checks before this can be treated as a verified match.",
      program.identityProof,
    );
  for (const rule of program.rules) {
    const deadlineAge =
      rule.kind === "deadline" &&
      (Date.parse(rule.date) - Date.parse(input.asOf)) / 86400000 <= 7
        ? 1
        : 7;
    const status = proofStatus(
      rule.proof,
      input,
      rule.kind === "deadline" ? deadlineAge : 30,
    );
    let value: RequirementCheck["status"] =
      status === "source_conflict" ? "source_conflict" : "unknown";
    let message =
      "This institutional condition requires source or applicant verification.";
    if (status === "verified") {
      switch (rule.kind) {
        case "qualification": {
          const q = profile.previousQualification;
          if (q) {
            value = rule.accepted.includes(q.kind) ? "likely_met" : "not_met";
            if (q.completion !== "completed" && value !== "not_met")
              value = "unknown";
          }
          break;
        }
        case "credits": {
          const credits = profile.previousQualification?.credits;
          if (
            credits &&
            credits.system === rule.system &&
            rule.system === "ECTS"
          )
            value = credits.amount >= rule.minimum ? "likely_met" : "not_met";
          break;
        }
        case "subjects": {
          const subjects = profile.relevantSubjects;
          if (subjects)
            value = rule.required.every((s) =>
              subjects.some((v) => norm(v.name) === norm(s)),
            )
              ? "likely_met"
              : subjects.length === 0
                ? "not_met"
                : "unknown";
          break;
        }
        case "language_test": {
          const results = profile.languageResults;
          const tests =
            results?.filter(
              (v) =>
                norm(v.language) === norm(rule.language) &&
                norm(v.test) === norm(rule.test) &&
                v.scale === rule.scale,
            ) ?? [];
          const usable = tests.filter(
            (v) =>
              v.overall !== null &&
              v.overall <= rule.maximum &&
              rule.minimum <= rule.maximum &&
              (!rule.notBefore || (v.takenOn && v.takenOn >= rule.notBefore)),
          );
          if (usable.some((test) => test.overall! >= rule.minimum))
            value = "likely_met";
          else if (tests.length && usable.length === tests.length)
            value = "not_met";
          else if (results?.length === 0) value = "not_met";
          break;
        }
        case "deadline":
          value =
            rule.date < input.asOf
              ? "not_met"
              : rule.date > input.asOf
                ? "met"
                : "unknown";
          break;
        case "manual":
          break;
      }
      message =
        value === "met"
          ? "The verified deadline has not passed; check the exact closing time before applying."
          : value === "likely_met"
            ? "Your self-reported information appears to satisfy this rule, but the institution must confirm it."
            : value === "not_met"
              ? "Your stated information does not meet this recorded condition."
              : "The available information cannot establish this institutional condition.";
    }
    const label =
      rule.kind === "qualification"
        ? `Accepted previous qualification: ${rule.accepted.join(", ")}.`
        : rule.kind === "credits"
          ? `Minimum ${rule.minimum} ${rule.system} credits.`
          : rule.kind === "subjects"
            ? `Required subjects: ${rule.required.join(", ")}.`
            : rule.kind === "language_test"
              ? `${rule.language} ${rule.test}: minimum ${rule.minimum}, scale ${rule.scale}.`
              : rule.kind === "deadline"
                ? `Application deadline date: ${rule.date}.`
                : rule.label;
    checks.push({
      ruleId: rule.id,
      label: label.slice(0, 500),
      status: value,
      mandatory: rule.mandatory,
      message,
      factIds: rule.proof.factIds,
      sourceIds: rule.proof.sourceIds,
    });
    if (rule.mandatory && value === "not_met") excluded = true;
    if (value !== "met") {
      needsVerification = true;
      warnings.push(message);
    }
  }
  if (!program.rules.length || !program.requirementsComplete)
    markUnknown(
      "requirements-inventory-unknown",
      "No complete institutional requirement inventory is available; this does not mean there are no requirements.",
      program.identityProof,
    );
  const preferences = [
    ...(input.profile.fields.flexiblePreferences.status === "confirmed"
      ? (profile.flexiblePreferences ?? [])
      : []),
    ...(input.profile.fields.orientation.status === "confirmed" &&
    profile.orientation &&
    profile.orientation !== "unsure" &&
    profile.orientation !== "balanced"
      ? [profile.orientation]
      : []),
  ].map(norm);
  if (
    preferences.length &&
    proofStatus(program.preferenceProof, input) === "verified"
  ) {
    components.other =
      preferences.filter((p) => program.preferences.map(norm).includes(p))
        .length / preferences.length;
    reasons.push(
      reason(
        "other-preferences-check",
        "preference",
        "Only exact preferences supported by evidence contribute to this internal ordering.",
        program.preferenceProof,
      ),
    );
  } else if (preferences.length)
    warnings.push(
      "Other stated preferences are not evidenced and do not receive an assumed ranking contribution.",
    );
  if (preferences.length && components.other === null) components.other = 0;
  return {
    program,
    excluded,
    reasons,
    checks,
    deviations,
    warnings: [...new Set(warnings)],
    needsVerification,
    components,
    ranking: rankComponents(components),
  };
}
export function evaluateMatching(inputValue: unknown): {
  input: MatchingInput;
  evaluations: PrivateEvaluation[];
} {
  const input = matchingInputSchema.parse(inputValue);
  if (
    assessProfile(input.profile, { asOfYear: Number(input.asOf.slice(0, 4)) })
      .status !== "ready_limited" ||
    input.catalog.channel === "staging_preview"
  )
    return { input, evaluations: [] };
  const evaluations = input.catalog.programs
    .map((p) => evaluate(p, input))
    .sort(
      (a, b) =>
        b.ranking.score - a.ranking.score ||
        a.program.id.localeCompare(b.program.id) ||
        a.program.intakeId.localeCompare(b.program.intakeId),
    );
  return { input, evaluations };
}
function alternatives(evaluations: PrivateEvaluation[]) {
  return evaluations.filter((e) => !e.excluded && e.deviations.length > 0);
}
function scopeKey(input: MatchingInput, e: PrivateEvaluation) {
  return canonical({
    profile: activeProfileProjection(input.profile),
    profileRevision: input.profile.revision,
    catalogVersion: input.catalog.version,
    channel: input.catalog.channel,
    asOf: input.asOf,
    program: e.program,
    deviations: e.deviations,
  });
}
export function changeAlternativeConsent(
  inputValue: unknown,
  requestId: string,
  decision: "granted" | "revoked",
): AlternativeConsent[] {
  if (decision !== "granted" && decision !== "revoked")
    throw new Error("Invalid consent decision");
  const { input, evaluations } = evaluateMatching(inputValue);
  const entries = alternatives(evaluations);
  const index = entries.findIndex(
    (_, i) => `alternative-${i + 1}` === requestId,
  );
  if (index < 0) throw new Error("Unknown or ineligible alternative request");
  const e = entries[index]!;
  if (
    decision === "granted" &&
    !recommend(input).permissionRequests.some((r) => r.requestId === requestId)
  )
    throw new Error("Alternative permission was not offered");
  if (scopeKey(input, e).length > 200000)
    throw new Error("Alternative scope exceeds local capacity");
  const grant: AlternativeConsent = {
    requestId,
    programId: e.program.id,
    intakeId: e.program.intakeId,
    profileRevision: input.profile.revision,
    scopeKey: scopeKey(input, e),
    decision,
  };
  return [...input.consents.filter((c) => c.requestId !== requestId), grant];
}
export function recommend(inputValue: unknown): MatchingOutput {
  const { input, evaluations } = evaluateMatching(inputValue);
  const output: MatchingOutput = {
    mode: input.catalog.channel,
    schemaVersion: 1,
    profileRevision: input.profile.revision,
    catalogVersion: input.catalog.version,
    status: "no_match",
    options: [],
    permissionRequests: [],
    rejections: [],
    gaps: [],
    message:
      "No verified match was found in this catalog. This does not mean that no suitable program exists.",
  };
  const readiness = assessProfile(input.profile, {
    asOfYear: Number(input.asOf.slice(0, 4)),
  });
  output.gaps = [
    ...readiness.unknownFields.map(
      (field) => `Optional or unresolved profile detail: ${field}.`,
    ),
    ...readiness.unknownDetails.map(
      (field) => `Unknown profile detail: ${field}.`,
    ),
  ];
  if (readiness.status !== "ready_limited") {
    output.status = "needs_profile";
    output.gaps = readiness.requiredMissing.map((k) => `Clarify ${k}.`);
    output.message = readiness.explanation;
  } else if (input.catalog.channel === "staging_preview") {
    output.status = "catalog_unpublished";
    output.message =
      "This catalog is a staging preview. It has not passed human publication review and is not used for recommendations.";
  } else if (!input.catalog.programs.length) {
    output.status = "catalog_empty";
    output.message =
      "The published catalog has no programs. This is a coverage gap, not a finding that you are ineligible.";
  } else {
    const rejected = [
      {
        code: "wrong_level" as const,
        count: evaluations.filter((e) =>
          e.reasons.some((r) => r.code === "wrong-level"),
        ).length,
        message:
          "Some catalog programs were excluded because the study level differs.",
      },
      {
        code: "wrong_field" as const,
        count: evaluations.filter((e) =>
          e.reasons.some((r) => r.code === "wrong-field"),
        ).length,
        message:
          "Some catalog programs were excluded by the controlled subject mapping.",
      },
      {
        code: "institution_not_met" as const,
        count: evaluations.filter((e) =>
          e.checks.some((c) => c.mandatory && c.status === "not_met"),
        ).length,
        message:
          "Some catalog programs were excluded by a known unmet mandatory institutional condition. User permission cannot waive it.",
      },
      {
        code: "funding_unavailable" as const,
        count: evaluations.filter((e) =>
          e.reasons.some((r) => r.code === "required-funding-unavailable"),
        ).length,
        message:
          "Some catalog programs have no recorded funding route although a scholarship is required.",
      },
    ];
    output.rejections = rejected.filter((r) => r.count > 0);
    const alt = alternatives(evaluations);
    const visible = evaluations
      .filter((e) => !e.excluded && !e.deviations.length)
      .sort(
        (a, b) =>
          Number(a.needsVerification) - Number(b.needsVerification) ||
          b.ranking.score - a.ranking.score ||
          a.program.id.localeCompare(b.program.id) ||
          a.program.intakeId.localeCompare(b.program.intakeId),
      );
    alt.forEach((e, i) => {
      const requestId = `alternative-${i + 1}`;
      const grant = input.consents.find((c) => c.requestId === requestId);
      const currentGrant =
        grant &&
        grant.profileRevision === input.profile.revision &&
        grant.programId === e.program.id &&
        grant.intakeId === e.program.intakeId &&
        grant.scopeKey === scopeKey(input, e);
      if (currentGrant && grant.decision === "granted") visible.push(e);
      else if (currentGrant && grant.decision === "revoked") return;
      else if (output.permissionRequests.length < 3)
        output.permissionRequests.push({
          requestId,
          profileRevision: input.profile.revision,
          deviations: e.deviations,
          message:
            "There is a subject-relevant option that differs from your requirements or preferences. Would you like to view it with these warnings?",
        });
    });
    output.options = visible.slice(0, 3).map((e) => ({
      programId: e.program.id,
      intakeId: e.program.intakeId,
      name: e.program.name,
      institution: e.program.institution,
      country: e.program.country,
      city: e.program.city,
      kind: e.deviations.length
        ? "conditional_alternative"
        : e.needsVerification
          ? "needs_verification"
          : "verified_constraints",
      reasons: e.reasons,
      checks: e.checks,
      warnings: e.warnings,
      deviations: e.deviations,
      nextStep:
        "Check the cited official conditions, applicant category and current intake before relying on this option. Admission and funding are not guaranteed.",
    }));
    output.gaps = [
      ...output.gaps,
      ...new Set(
        evaluations.filter((e) => !e.excluded).flatMap((e) => e.warnings),
      ),
    ];
    if (output.options.length) {
      output.status = output.options.some(
        (o) => o.kind === "verified_constraints",
      )
        ? "options_found"
        : "needs_verification";
      output.message =
        "These are limited catalog options with structured checks. Self-reported qualifications still require institutional confirmation; admission is not guaranteed.";
    } else if (output.permissionRequests.length) {
      output.status = "permission_required";
      output.message =
        "No normal option is available under the current constraints. Review the specific deviations before choosing whether to view an alternative.";
    }
  }
  return publicMatchingOutputSchema.parse(output);
}
