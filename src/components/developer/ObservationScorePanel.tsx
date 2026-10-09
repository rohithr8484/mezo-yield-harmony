import type { ObservationScore } from "@/lib/observationScore";

export function ObservationScorePanel({ title, result, limits }: { title: string; result: ObservationScore; limits: string }) {
  return <section aria-label={title} className="my-5 border-y border-accent/30 bg-accent/5 px-4 py-5 sm:px-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h4 className="text-sm font-semibold text-foreground">{title}</h4><p className="mt-1 text-xs text-muted-foreground">Higher = more observed concern · not a probability</p></div>
      <p className="font-mono text-3xl font-semibold text-foreground">{result.score === null ? <span className="text-lg">Insufficient data</span> : <>{result.score}<span className="text-base text-muted-foreground"> / 100</span></>}</p>
    </div>
    {result.score !== null && <progress aria-label={title} value={result.score} max={100} className="mt-4 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-bitcoin [&::-moz-progress-bar]:bg-bitcoin" />}
    <p className="mt-3 text-xs text-muted-foreground">{result.assessed} of {result.total} weighted checks assessed.{result.score !== null && result.assessed < result.total && ` Observed minimum ${result.score}/100; unassessed checks leave up to ${result.upperBound}/100 unresolved.`} Zero means no weighted signal observed—not safe or cleared.</p>
    <details className="mt-3 text-xs"><summary className="cursor-pointer font-medium text-primary">Score evidence & weights</summary><ul className="mt-3 divide-y divide-border">{result.checks.map(check => <li key={check.name} className="py-2"><div className="flex flex-wrap justify-between gap-2"><span className="font-medium">{check.name}</span><span className="font-mono">{check.available ? `${check.triggered ? check.weight : 0} / ${check.weight} points` : `${check.weight} points unassessed`}</span></div><p className="mt-1 leading-relaxed text-muted-foreground">{check.evidence}</p></li>)}</ul></details>
    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Fixed exploratory weights, not validated against labeled outcomes. {limits}</p>
  </section>;
}