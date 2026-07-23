function corPorScore(score: number): string {
  if (score >= 75) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${corPorScore(score)}`}>
      {label}: {score.toFixed(0)}
    </span>
  );
}
