import { describe, expect, it } from "vitest";
import { tokenUsageSchema } from "@/features/ai/schema";
import { currentPricing, estimateCost } from "@/server/ai/pricing";
describe("dated cache-write pricing", () => {
  const p = currentPricing("gpt-6-luna", "2026-10-15")!;
  it.each([
    [0, 0, 0.00015],
    [1000, 0, 0.00006],
    [0, 1000, 0.000175],
    [100, 200, 0.000146],
  ])(
    "accounts read %i and write %i without double charging",
    (cachedInputTokens, cacheWriteTokens, cost) => {
      expect(
        estimateCost(
          {
            inputTokens: 1000,
            cachedInputTokens,
            cacheWriteTokens,
            outputTokens: 100,
          },
          p,
        ),
      ).toBeCloseTo(cost, 12);
    },
  );
  it("older logs without cache-write counts remain valid and retain their old calculation", () => {
    const usage = {
      inputTokens: 1000,
      cachedInputTokens: 100,
      outputTokens: 100,
    };
    expect(tokenUsageSchema.parse(usage)).toEqual(usage);
    expect(estimateCost(usage, p)).toBeCloseTo(0.000141, 12);
  });
  it("positive writes require a verified write price, never silently charged zero", () => {
    expect(() =>
      estimateCost(
        {
          inputTokens: 1000,
          cachedInputTokens: 0,
          cacheWriteTokens: 1000,
          outputTokens: 100,
        },
        currentPricing("gpt-6-luna", "2026-10-11")!,
      ),
    ).toThrow();
  });
  it("counts cache reads and writes within total input and expires the latest price after seven days", () => {
    expect(
      tokenUsageSchema.safeParse({
        inputTokens: 1000,
        cachedInputTokens: 600,
        cacheWriteTokens: 500,
        outputTokens: 100,
      }).success,
    ).toBe(false);
    expect(currentPricing("gpt-6-luna", "2026-10-31")?.checkedOn).toBe(
      "2026-10-24",
    );
    expect(currentPricing("gpt-6-luna", "2026-11-01")).toBeNull();
  });
});
