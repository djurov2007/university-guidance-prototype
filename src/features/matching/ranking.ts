export const baseWeights = {
  interest: 40,
  finance: 20,
  location: 15,
  language: 15,
  other: 10,
} as const;
export type RankingCategory = keyof typeof baseWeights;
export type RankingComponents = Record<RankingCategory, number | null>;
export function rankComponents(components: RankingComponents) {
  for (const value of Object.values(components))
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1))
      throw new Error("Invalid ranking component");
  const active = (Object.keys(baseWeights) as RankingCategory[]).filter(
    (k) => components[k] !== null,
  );
  const total = active.reduce((sum, k) => sum + baseWeights[k], 0);
  const weights = Object.fromEntries(
    (Object.keys(baseWeights) as RankingCategory[]).map((k) => [
      k,
      components[k] === null ? 0 : baseWeights[k] / total,
    ]),
  ) as Record<RankingCategory, number>;
  const score = active.reduce((sum, k) => sum + weights[k] * components[k]!, 0);
  return { weights, score }; // Internal ordering only. Never exported to product output.
}
