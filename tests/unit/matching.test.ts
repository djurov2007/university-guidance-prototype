import { describe, expect, it } from "vitest";
import {
  matchingFixture,
  syntheticProgram,
  syntheticProof,
  changeSyntheticProfile,
} from "../../src/test-fixtures/matching.ts";
import {
  recommend,
  evaluateMatching,
  changeAlternativeConsent,
} from "../../src/features/matching/engine.ts";
import { rankComponents } from "../../src/features/matching/ranking.ts";
import {
  matchingInputSchema,
  publicMatchingOutputSchema,
} from "../../src/features/matching/schema.ts";
import { createProfile } from "../../src/features/profiles/schema.ts";
import { applyProfileEvent } from "../../src/features/profiles/state.ts";
const cost = (amount: number) => ({
  amount,
  currency: "EUR" as const,
  period: "year" as const,
  coverage: "tuition_and_living" as const,
  proof: syntheticProof(),
});
describe("ordered deterministic filtering", () => {
  it("rejects wrong level before any recommendation", () =>
    expect(
      recommend(
        matchingFixture([syntheticProgram("wrong-level", { level: "master" })]),
      ).options,
    ).toEqual([]));
  it("rejects unrelated fields", () =>
    expect(
      recommend(
        matchingFixture([
          syntheticProgram("wrong-field", { topics: ["psychology"] }),
        ]),
      ).status,
    ).toBe("no_match"));
  it("returns one option without fabricating two more", () => {
    const o = recommend(matchingFixture());
    expect(o.options).toHaveLength(1);
    expect(o.options[0]?.kind).toBe("verified_constraints");
  });
  it("returns two without padding", () =>
    expect(
      recommend(matchingFixture([syntheticProgram("a"), syntheticProgram("b")]))
        .options,
    ).toHaveLength(2));
  it("caps initial options at three", () =>
    expect(
      recommend(
        matchingFixture(["a", "b", "c", "d"].map((id) => syntheticProgram(id))),
      ).options,
    ).toHaveLength(3));
  it("distinguishes catalog empty from known no match", () => {
    expect(recommend(matchingFixture([])).status).toBe("catalog_empty");
    expect(
      recommend(matchingFixture([syntheticProgram("wrong", { level: "phd" })]))
        .status,
    ).toBe("no_match");
  });
  it("requires a usable profile", () => {
    const i = matchingFixture();
    i.profile = createProfile();
    expect(recommend(i).status).toBe("needs_profile");
  });
  it("never substitutes staging for published", () => {
    const i = matchingFixture();
    i.catalog.channel = "staging_preview";
    expect(recommend(i)).toMatchObject({
      status: "catalog_unpublished",
      options: [],
      permissionRequests: [],
    });
  });
  it("rejects invalid proof references", () => {
    const i = matchingFixture();
    i.catalog.programs[0]!.identityProof.sourceIds = ["nonexistent"];
    expect(() => recommend(i)).toThrow();
  });
  it("rejects verified proof without evidence", () => {
    const i = matchingFixture();
    i.catalog.programs[0]!.identityProof.factIds = [];
    expect(matchingInputSchema.safeParse(i).success).toBe(false);
  });
  it("rejects duplicate program-intake identities", () => {
    const p = syntheticProgram();
    expect(() => recommend(matchingFixture([p, p]))).toThrow();
  });
  it("does not change the original input", () => {
    const i = matchingFixture();
    const before = structuredClone(i);
    recommend(i);
    expect(i).toEqual(before);
  });
});
describe("budgets, languages and permission boundaries", () => {
  it("hides wrong-language identity before permission", () => {
    const o = recommend(
      matchingFixture([syntheticProgram("secret", { languages: ["german"] })]),
    );
    expect(o.options).toEqual([]);
    expect(o.permissionRequests[0]?.deviations[0]?.code).toBe("language");
    expect(JSON.stringify(o)).not.toContain("secret");
  });
  it("hides above-hard-budget identity", () => {
    const o = recommend(
      matchingFixture([syntheticProgram("costly", { cost: cost(20000) })]),
    );
    expect(o.options).toEqual([]);
    expect(
      o.permissionRequests[0]?.deviations.some(
        (d) => d.code === "budget" && d.hard,
      ),
    ).toBe(true);
  });
  it("a possible scholarship never reduces the cost", () => {
    const i = matchingFixture([
      syntheticProgram("funding", { cost: cost(20000), funding: "possible" }),
    ]);
    const o = recommend(i);
    expect(o.options).toHaveLength(0);
    expect(
      o.permissionRequests[0]?.deviations.some((d) => d.code === "budget"),
    ).toBe(true);
    expect(evaluateMatching(i).evaluations[0]?.components.finance).toBe(0);
  });
  it("required scholarship is conditional even within budget", () => {
    const i = matchingFixture([
      syntheticProgram("funding", { funding: "possible" }),
    ]);
    i.profile = changeSyntheticProfile(i, "scholarshipNeed", "required");
    expect(
      recommend(i).permissionRequests[0]?.deviations.some(
        (d) => d.code === "scholarship",
      ),
    ).toBe(true);
  });
  it("excludes a known absent required funding route", () => {
    const i = matchingFixture();
    i.profile = changeSyntheticProfile(i, "scholarshipNeed", "required");
    expect(recommend(i).status).toBe("no_match");
  });
  it("asks permission for an alternative country", () => {
    const o = recommend(
      matchingFixture([syntheticProgram("italy-secret", { country: "IT" })]),
    );
    expect(o.options).toHaveLength(0);
    expect(o.permissionRequests[0]?.deviations[0]?.code).toBe("country");
    expect(JSON.stringify(o)).not.toContain("italy-secret");
  });
  it("soft country preference changes internal ranking but still requires permission", () => {
    const i = matchingFixture([
      syntheticProgram("de"),
      syntheticProgram("it", { country: "IT" }),
    ]);
    i.profile = changeSyntheticProfile(i, "hardConstraints", {
      countries: "any_in_scope",
      languages: "only_listed",
      budget: "hard_maximum",
      other: [],
    });
    const e = evaluateMatching(i).evaluations;
    expect(e.find((v) => v.program.id === "de")!.ranking.score).toBeGreaterThan(
      e.find((v) => v.program.id === "it")!.ranking.score,
    );
    expect(recommend(i).permissionRequests[0]?.deviations[0]?.hard).toBe(false);
  });
  it("does not infer total living costs from tuition", () => {
    const i = matchingFixture([
      syntheticProgram("tuition", {
        cost: { ...cost(5000), coverage: "tuition" },
      }),
    ]);
    expect(recommend(i).options[0]?.kind).toBe("needs_verification");
    expect(evaluateMatching(i).evaluations[0]?.components.finance).toBe(0);
  });
  it("can establish an excessive tuition lower bound for total budget", () => {
    const i = matchingFixture([
      syntheticProgram("tuition", {
        cost: { ...cost(15000), coverage: "tuition" },
      }),
    ]);
    expect(recommend(i).options).toHaveLength(0);
    expect(recommend(i).permissionRequests[0]?.deviations[0]?.code).toBe(
      "budget",
    );
  });
  it("does not use currency exchange assumptions", () => {
    const i = matchingFixture([
      syntheticProgram("currency", {
        cost: { ...cost(8000), currency: "USD" },
      }),
    ]);
    expect(recommend(i).options[0]?.kind).toBe("needs_verification");
  });
  it("normalizes a monthly budget to annual units explicitly", () => {
    const i = matchingFixture();
    i.profile = changeSyntheticProfile(i, "budgetPeriod", "month");
    i.profile = changeSyntheticProfile(i, "budgetAmount", 1000);
    expect(recommend(i).options[0]?.kind).toBe("verified_constraints");
  });
  it("does not infer degree duration for whole-degree budgets", () => {
    const i = matchingFixture();
    i.profile = changeSyntheticProfile(i, "budgetPeriod", "total_degree");
    expect(recommend(i).options[0]?.kind).toBe("needs_verification");
  });
  it("unknown cost is not zero", () => {
    const i = matchingFixture([
      syntheticProgram("unknown", {
        cost: null,
        costProof: syntheticProof({ status: "unknown" }),
      }),
    ]);
    expect(recommend(i).options[0]?.kind).toBe("needs_verification");
  });
});
describe("institutional rules are independent of consent", () => {
  it("rejects impossible institutional test bounds", () => {
    expect(() =>
      matchingFixture([
        syntheticProgram("bad-bounds", {
          rules: [
            {
              id: "bad-test",
              kind: "language_test",
              language: "english",
              test: "Synthetic test",
              scale: "0-9",
              minimum: 10,
              maximum: 9,
              notBefore: null,
              mandatory: true,
              proof: syntheticProof(),
            },
          ],
        }),
      ]),
    ).toThrow();
  });
  it("a partial inventory remains unknown even when its known rule passes", () => {
    expect(
      recommend(
        matchingFixture([
          syntheticProgram("partial", { requirementsComplete: false }),
        ]),
      ).options[0]?.kind,
    ).toBe("needs_verification");
  });
  it("reports known exclusion reasons without leaking withheld program identity", () => {
    const i = matchingFixture([
      syntheticProgram("secret-failed", {
        rules: [
          {
            id: "q-rule",
            kind: "qualification",
            accepted: ["master"],
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    expect(recommend(i).rejections[0]?.code).toBe("institution_not_met");
    expect(JSON.stringify(recommend(i))).not.toContain("secret-failed");
  });
  it("checks a credit minimum in the same system", () => {
    const i = matchingFixture([
      syntheticProgram("credits", {
        rules: [
          {
            id: "credit-rule",
            kind: "credits",
            minimum: 180,
            system: "ECTS",
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    i.profile = changeSyntheticProfile(i, "previousQualification", {
      ...i.profile.fields.previousQualification.value!,
      kind: "bachelor",
      credits: { amount: 120, system: "ECTS", label: "Synthetic ECTS" },
    });
    expect(evaluateMatching(i).evaluations[0]?.checks[0]?.status).toBe(
      "not_met",
    );
    expect(recommend(i).options).toHaveLength(0);
  });
  it("never assumes another credit system is equivalent to ECTS", () => {
    const i = matchingFixture([
      syntheticProgram("credits", {
        rules: [
          {
            id: "credit-rule",
            kind: "credits",
            minimum: 180,
            system: "ECTS",
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    i.profile = changeSyntheticProfile(i, "previousQualification", {
      ...i.profile.fields.previousQualification.value!,
      credits: {
        amount: 200,
        system: "other",
        label: "Different synthetic system",
      },
    });
    expect(recommend(i).options[0]?.checks[0]?.status).toBe("unknown");
  });
  it("uses an adequate same-scale language result even if an earlier result failed", () => {
    const i = matchingFixture([
      syntheticProgram("test", {
        rules: [
          {
            id: "test-rule",
            kind: "language_test",
            language: "english",
            test: "IELTS",
            scale: "0-9",
            minimum: 6.5,
            maximum: 9,
            notBefore: null,
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    i.profile = changeSyntheticProfile(
      i,
      "languageResults",
      [5, 7].map((overall) => ({
        language: "english",
        test: "IELTS",
        overall,
        scale: "0-9",
        takenOn: null,
        note: null,
      })),
    );
    expect(recommend(i).options[0]?.checks[0]?.status).toBe("likely_met");
  });
  it("below-minimum same-scale language results cannot be waived", () => {
    const i = matchingFixture([
      syntheticProgram("test", {
        rules: [
          {
            id: "test-rule",
            kind: "language_test",
            language: "english",
            test: "IELTS",
            scale: "0-9",
            minimum: 6.5,
            maximum: 9,
            notBefore: null,
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    i.profile = changeSyntheticProfile(i, "languageResults", [
      {
        language: "english",
        test: "IELTS",
        overall: 5,
        scale: "0-9",
        takenOn: null,
        note: null,
      },
    ]);
    expect(evaluateMatching(i).evaluations[0]?.checks[0]?.status).toBe(
      "not_met",
    );
    expect(recommend(i).options).toHaveLength(0);
  });
  it("a result outside the known scale remains unknown", () => {
    const i = matchingFixture([
      syntheticProgram("test", {
        rules: [
          {
            id: "test-rule",
            kind: "language_test",
            language: "english",
            test: "IELTS",
            scale: "0-9",
            minimum: 6.5,
            maximum: 9,
            notBefore: null,
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    i.profile = changeSyntheticProfile(i, "languageResults", [
      {
        language: "english",
        test: "IELTS",
        overall: 15,
        scale: "0-9",
        takenOn: null,
        note: null,
      },
    ]);
    expect(recommend(i).options[0]?.checks[0]?.status).toBe("unknown");
  });
  it("marks a self-reported qualification likely met, not institution-confirmed", () => {
    const i = matchingFixture([
      syntheticProgram("q", {
        rules: [
          {
            id: "q-rule",
            kind: "qualification",
            accepted: ["secondary"],
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    expect(recommend(i).options[0]?.checks[0]?.status).toBe("likely_met");
    expect(recommend(i).options[0]?.kind).toBe("needs_verification");
  });
  it("known wrong qualification excludes and cannot obtain permission", () => {
    const i = matchingFixture([
      syntheticProgram("q", {
        country: "IT",
        rules: [
          {
            id: "q-rule",
            kind: "qualification",
            accepted: ["master"],
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    expect(recommend(i).permissionRequests).toHaveLength(0);
    expect(() =>
      changeAlternativeConsent(i, "alternative-1", "granted"),
    ).toThrow();
  });
  it("marks an unknown manual requirement", () => {
    const i = matchingFixture([
      syntheticProgram("manual", {
        rules: [
          {
            id: "manual-rule",
            kind: "manual",
            label: "Check prior recognition",
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    expect(recommend(i).options[0]?.checks[0]?.status).toBe("unknown");
  });
  it("does not compare a conflicting institutional source", () => {
    const i = matchingFixture([
      syntheticProgram("conflict", {
        rules: [
          {
            id: "q-rule",
            kind: "qualification",
            accepted: ["master"],
            mandatory: true,
            proof: syntheticProof({ status: "conflicting" }),
          },
        ],
      }),
    ]);
    expect(recommend(i).options[0]?.checks[0]?.status).toBe("source_conflict");
  });
  it("a closed deadline is a mandatory failure", () => {
    const i = matchingFixture([
      syntheticProgram("closed", {
        rules: [
          {
            id: "deadline-rule",
            kind: "deadline",
            date: "2026-10-05",
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    expect(recommend(i).options).toHaveLength(0);
    expect(evaluateMatching(i).evaluations[0]?.checks[0]?.status).toBe(
      "not_met",
    );
  });
  it("a deadline today cannot prove remaining closing time", () => {
    const i = matchingFixture([
      syntheticProgram("today", {
        rules: [
          {
            id: "deadline-rule",
            kind: "deadline",
            date: "2026-10-06",
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    expect(recommend(i).options[0]?.checks[0]?.status).toBe("unknown");
  });
  it("future and old proof dates remain unknown", () => {
    for (const date of ["2026-10-07", "2026-08-01"]) {
      const i = matchingFixture([
        syntheticProgram("old", {
          languageProof: syntheticProof({ checkedOn: date }),
        }),
      ]);
      expect(recommend(i).options[0]?.kind).toBe("needs_verification");
    }
  });
  it("a year or applicant scope mismatch remains unknown", () => {
    for (const proof of [
      syntheticProof({ startYear: 2026 }),
      syntheticProof({ candidateScope: "unresolved" }),
    ]) {
      const i = matchingFixture([
        syntheticProgram("scope", { languageProof: proof }),
      ]);
      expect(recommend(i).options[0]?.kind).toBe("needs_verification");
    }
  });
  it("unknown language does not claim English eligibility", () => {
    const i = matchingFixture([
      syntheticProgram("unknown", {
        languages: [],
        languageProof: syntheticProof({ status: "unknown" }),
      }),
    ]);
    expect(recommend(i).options[0]?.kind).toBe("needs_verification");
  });
  it("explicitly no subjects can fail a mandatory subject requirement", () => {
    const i = matchingFixture([
      syntheticProgram("subjects", {
        rules: [
          {
            id: "subject-rule",
            kind: "subjects",
            required: ["Calculus"],
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    i.profile = changeSyntheticProfile(i, "relevantSubjects", []);
    expect(recommend(i).options).toHaveLength(0);
  });
  it("an incomplete subject list is unknown rather than known failure", () => {
    const i = matchingFixture([
      syntheticProgram("subjects", {
        rules: [
          {
            id: "subject-rule",
            kind: "subjects",
            required: ["Calculus"],
            mandatory: true,
            proof: syntheticProof(),
          },
        ],
      }),
    ]);
    i.profile = changeSyntheticProfile(i, "relevantSubjects", [
      { name: "Statistics", result: null, credits: null },
    ]);
    expect(recommend(i).options[0]?.checks[0]?.status).toBe("unknown");
  });
  it("does not assume an empty institutional requirement inventory is complete", () =>
    expect(
      recommend(matchingFixture([syntheticProgram("no-rules", { rules: [] })]))
        .options[0]?.kind,
    ).toBe("needs_verification"));
  it("uncompiled textual hard constraints do not pass silently", () => {
    const i = matchingFixture();
    i.profile = changeSyntheticProfile(i, "hardConstraints", {
      ...i.profile.fields.hardConstraints.value!,
      other: ["Only accredited routes recognised for my profession"],
    });
    expect(recommend(i).options[0]?.kind).toBe("needs_verification");
  });
});
describe("scoped alternative consent", () => {
  const alternative = () =>
    matchingFixture([
      syntheticProgram("private-id", {
        country: "IT",
        cost: cost(20000),
        funding: "possible",
      }),
    ]);
  it("reveals only the authorised alternative and retains warnings", () => {
    const i = alternative();
    i.consents = changeAlternativeConsent(i, "alternative-1", "granted");
    const o = recommend(i);
    expect(o.options[0]).toMatchObject({
      programId: "private-id",
      kind: "conditional_alternative",
    });
    expect(o.options[0]?.warnings.join(" ")).toContain("not approved");
    expect(o.options[0]?.deviations.map((d) => d.code)).toEqual([
      "country",
      "budget",
    ]);
  });
  it("revocation removes the card and repeated permission request", () => {
    const i = alternative();
    i.consents = changeAlternativeConsent(i, "alternative-1", "granted");
    i.consents = changeAlternativeConsent(i, "alternative-1", "revoked");
    expect(recommend(i).options).toHaveLength(0);
    expect(recommend(i).permissionRequests).toHaveLength(0);
  });
  it("a profile change invalidates consent", () => {
    const i = alternative();
    i.consents = changeAlternativeConsent(i, "alternative-1", "granted");
    i.profile = changeSyntheticProfile(
      i,
      "studyGoal",
      "A corrected synthetic goal",
    );
    expect(recommend(i).options).toHaveLength(0);
  });
  it("a catalog change invalidates consent", () => {
    const i = alternative();
    i.consents = changeAlternativeConsent(i, "alternative-1", "granted");
    i.catalog.programs[0]!.cost!.amount = 25000;
    expect(recommend(i).options).toHaveLength(0);
  });
  it("does not transfer permission to another program or intake", () => {
    const i = alternative();
    i.consents = changeAlternativeConsent(i, "alternative-1", "granted");
    i.consents[0]!.intakeId = "different-intake";
    expect(recommend(i).options).toHaveLength(0);
  });
  it("rejects an unoffered request", () =>
    expect(() =>
      changeAlternativeConsent(alternative(), "alternative-99", "granted"),
    ).toThrow());
  it("cannot relax a newly unmet mandatory institutional rule", () => {
    const i = alternative();
    i.consents = changeAlternativeConsent(i, "alternative-1", "granted");
    i.catalog.programs[0]!.rules = [
      {
        id: "must-master",
        kind: "qualification",
        accepted: ["master"],
        mandatory: true,
        proof: syntheticProof(),
      },
    ];
    expect(recommend(i).options).toHaveLength(0);
    expect(recommend(i).permissionRequests).toHaveLength(0);
  });
});
describe("ranking and safe public output", () => {
  it("uses other preferences only after their explicit confirmation", () => {
    const i = matchingFixture();
    i.profile = changeSyntheticProfile(i, "orientation", "practical");
    expect(evaluateMatching(i).evaluations[0]?.components.other).toBeNull();
    const result = applyProfileEvent(i.profile, {
      id: "confirm-orientation",
      baseRevision: i.profile.revision,
      type: "confirm",
      field: "orientation",
      fieldRevision: i.profile.fields.orientation.revision,
      proposalId: null,
    });
    if (!result.ok) throw new Error(result.error);
    i.profile = result.state;
    expect(evaluateMatching(i).evaluations[0]?.components.other).toBe(1);
  });
  it("normalises irrelevant categories", () => {
    const r = rankComponents({
      interest: 1,
      finance: 1,
      location: null,
      language: 1,
      other: null,
    });
    expect(r.weights.interest).toBeCloseTo(40 / 75);
    expect(r.weights.location).toBe(0);
    expect(Object.values(r.weights).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
  it("uses the requested weights when all categories are relevant", () => {
    expect(
      rankComponents({
        interest: 1,
        finance: 1,
        location: 1,
        language: 1,
        other: 1,
      }).weights,
    ).toEqual({
      interest: 0.4,
      finance: 0.2,
      location: 0.15,
      language: 0.15,
      other: 0.1,
    });
  });
  it("all irrelevant categories safely yield zero", () =>
    expect(
      rankComponents({
        interest: null,
        finance: null,
        location: null,
        language: null,
        other: null,
      }).score,
    ).toBe(0));
  it("rejects invalid internal component numbers", () =>
    expect(() =>
      rankComponents({
        interest: NaN,
        finance: null,
        location: null,
        language: null,
        other: null,
      }),
    ).toThrow());
  it("is stable for the same input and catalog order permutations", () => {
    const i = matchingFixture([syntheticProgram("z"), syntheticProgram("a")]);
    const a = recommend(i);
    expect(recommend(i)).toEqual(a);
    i.catalog.programs.reverse();
    expect(recommend(i)).toEqual(a);
    expect(a.options.map((p) => p.programId)).toEqual(["a", "z"]);
  });
  it("never returns score, fit percentage or admission probability fields", () => {
    const o = recommend(matchingFixture());
    const json = JSON.stringify(o);
    expect(json).not.toMatch(
      /"(?:score|weights|fitPercent|admissionProbability|probability)"/,
    );
    expect(
      publicMatchingOutputSchema.safeParse({ ...o, admissionProbability: 0.9 })
        .success,
    ).toBe(false);
  });
});
