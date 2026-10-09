export type ScoreCheck = { name: string; weight: number; triggered: boolean; available: boolean; evidence: string };
export function summarizeObservationScore(checks: ScoreCheck[]) {
  const available = checks.filter(check => check.available);
  const points = available.reduce((sum, check) => sum + (check.triggered ? check.weight : 0), 0);
  const unassessed = checks.filter(check => !check.available).reduce((sum, check) => sum + check.weight, 0);
  return { score: available.length ? Math.min(100, points) : null, upperBound: Math.min(100, points + unassessed), assessed: available.length, total: checks.length, checks };
}
export type ObservationScore = ReturnType<typeof summarizeObservationScore>;