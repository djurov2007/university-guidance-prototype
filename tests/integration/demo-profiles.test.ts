import { expect, it } from "vitest";
import { ConversationService } from "../../src/server/conversation/service";
import {
  demoProfiles,
  demoValues,
} from "../../src/test-fixtures/demo-profiles";

for (const variant of ["missing", "none", "complete"] as const) {
  it(`master demo prerequisite subjects are ${variant}, never silently waived`, async () => {
    const service = new ConversationService({
      now: () => Date.parse("2026-10-11T12:00Z"),
    });
    const { token, view: initial } = service.start({
      action: "start",
      scenario: "master",
    });
    let view = initial;
    const mutate = async (
      endpoint: "profile" | "recommendations",
      body: Record<string, unknown>,
    ) => {
      view = await service.mutate(token, endpoint, {
        ...body,
        revision: view.revision,
      });
    };
    try {
      expect(demoProfiles).toHaveLength(7);
      for (const p of demoProfiles)
        expect(demoValues(p.id).budgetAmount).toBe(10000);
      const values = demoValues("D12-02");
      await mutate("profile", { action: "prepare_example" });
      await mutate("profile", { action: "confirm" });
      await mutate("profile", {
        action: "answer",
        field: "previousQualification",
        mode: "replace",
        value: values.previousQualification,
      });
      if (variant !== "missing")
        await mutate("profile", {
          action: "answer",
          field: "relevantSubjects",
          mode: "replace",
          value: variant === "none" ? [] : values.relevantSubjects,
        });
      await mutate("profile", { action: "confirm" });
      await mutate("recommendations", { action: "search", explain: true });
      expect(view.matching?.status).toBe(
        variant === "none" ? "no_match" : "needs_verification",
      );
      expect(view.matching?.options).toHaveLength(variant === "none" ? 0 : 1);
      if (variant !== "none") {
        const check = view.matching?.options[0]?.checks.find(
          (c) => c.ruleId === "synthetic-prior-subjects",
        );
        expect(check?.status).toBe(
          variant === "missing" ? "unknown" : "likely_met",
        );
        expect(check?.sourceIds).toEqual(["synthetic-source"]);
        expect(check?.mandatory).toBe(true);
        expect(
          service.details(token, "synthetic-computing-master").sources[0]?.url,
        ).toBeNull();
      }
    } finally {
      service.delete(token);
    }
  });
}
