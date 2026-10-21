export type RiskLevel = 'high' | 'suspicious' | 'low' | 'clean';

export const RISK_LABELS: Readonly<Record<RiskLevel, string>> = {
  high: 'High risk',
  suspicious: 'Suspicious',
  low: 'Low',
  clean: 'Clean',
};

export function riskOf(score: number): RiskLevel {
  if (score >= 75) return 'high';
  if (score >= 25) return 'suspicious';
  if (score > 0) return 'low';
  return 'clean';
}

/** Result grouping used by the summary cards; 'clean' covers both low and clean. */
export type ResultFilter = 'all' | 'high' | 'suspicious' | 'clean';
