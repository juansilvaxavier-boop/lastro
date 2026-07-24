export interface SerieChart {
  key: string;
  label: string;
  color: string;
}

export function ChartLegend({ series }: { series: SerieChart[] }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-5">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-2 text-sm text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

export const CORES_SERIE = ["#1d4ed8", "#facc15", "#16a34a"];
