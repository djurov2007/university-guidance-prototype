import { describe, it, expect } from "vitest";
import { goldenCases } from "../../src/test-fixtures/golden-set";
import { runGoldenCase } from "../../src/test-fixtures/golden-runner";
describe("frozen Phase 1 golden set", () => {
  for (const c of goldenCases)
    for (let repeat = 1; repeat <= c.repeats; repeat++)
      it(`${c.id} ${c.key} (${repeat}/${c.repeats})`, async () => {
        expect((await runGoldenCase(c)).passed).toBe(true);
      });
});
