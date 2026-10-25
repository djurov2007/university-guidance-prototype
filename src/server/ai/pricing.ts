import "server-only";
import type { TokenUsage } from "../../features/ai/schema.ts";

export interface Pricing {
  model: string;
  version: string;
  checkedOn: string;
  inputPerMillion: number;
  cachedPerMillion: number;
  cacheWritePerMillion?: number;
  outputPerMillion: number;
}
// Historical Standard short-context snapshots did not support cache writes.
const historicalSnapshots: Pricing[] = [
  {
    model: "gpt-6-luna",
    version: "standard-short-2026-10-06-luna",
    checkedOn: "2026-10-06",
    inputPerMillion: 0.1,
    cachedPerMillion: 0.01,
    outputPerMillion: 0.5,
  },
  {
    model: "gpt-6.1-sol",
    version: "standard-short-2026-10-06-sol",
    checkedOn: "2026-10-06",
    inputPerMillion: 2,
    cachedPerMillion: 0.1,
    outputPerMillion: 10,
  },
];
// Standard default service tier, api.openai.com, no regional processing.
// Reverified 2026-10-24 using the official pricing and gpt-6-luna model pages:
// https://developers.openai.com/api/docs/pricing
// https://developers.openai.com/api/docs/models/gpt-6-luna
const snapshots: Pricing[] = [
  ...historicalSnapshots,
  ...historicalSnapshots.map((p) => ({
    ...p,
    checkedOn: "2026-10-11",
    version: p.version.replace("2026-10-06", "2026-10-11"),
  })),
  {
    model: "gpt-6-luna",
    version: "standard-short-2026-10-15-luna-cache-writes",
    checkedOn: "2026-10-15",
    inputPerMillion: 0.1,
    cachedPerMillion: 0.01,
    cacheWritePerMillion: 0.125,
    outputPerMillion: 0.5,
  },
  {
    model: "gpt-6-luna",
    version: "standard-short-2026-10-24-luna-cache-writes",
    checkedOn: "2026-10-24",
    inputPerMillion: 0.1,
    cachedPerMillion: 0.01,
    cacheWritePerMillion: 0.125,
    outputPerMillion: 0.5,
  },
];
export function currentPricing(model: string, asOf: string): Pricing | null {
  const p = snapshots
    .filter((p) => p.model === model && p.checkedOn <= asOf)
    .sort((a, b) => b.checkedOn.localeCompare(a.checkedOn))[0];
  if (!p) return null;
  const age = (Date.parse(asOf) - Date.parse(p.checkedOn)) / 86400000;
  return Number.isFinite(age) && age >= 0 && age <= 7 ? { ...p } : null;
}
export function estimateCost(usage: TokenUsage, pricing: Pricing): number {
  const writes = usage.cacheWriteTokens ?? 0;
  if (
    usage.cachedInputTokens + writes > usage.inputTokens ||
    [
      usage.inputTokens,
      usage.cachedInputTokens,
      writes,
      usage.outputTokens,
    ].some((x) => !Number.isSafeInteger(x) || x < 0) ||
    (writes > 0 && pricing.cacheWritePerMillion === undefined)
  )
    throw new Error("Invalid token usage.");
  return (
    ((usage.inputTokens - usage.cachedInputTokens - writes) *
      pricing.inputPerMillion +
      usage.cachedInputTokens * pricing.cachedPerMillion +
      writes * (pricing.cacheWritePerMillion ?? 0) +
      usage.outputTokens * pricing.outputPerMillion) /
    1000000
  );
}
