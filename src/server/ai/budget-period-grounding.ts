import "server-only";

// Explicit English period labels only. No currency/amount conversion, defaults or inference.
const labels = {
  month: /\b(?:month|monthly)\b/i,
  year: /\b(?:year|yearly|annual|annually|per annum)\b/i,
  total_degree:
    /\b(?:total degree|whole degree|entire degree|total programme|total program)\b/i,
};
export function budgetPeriodGrounded(value: string, quote: string): boolean {
  if (/\b(?:not|never|no|without|rather than|instead of)\b/i.test(quote))
    return false;
  const matches = Object.entries(labels)
    .filter(([, pattern]) => pattern.test(quote))
    .map(([period]) => period);
  return matches.length === 1 && matches[0] === value;
}
