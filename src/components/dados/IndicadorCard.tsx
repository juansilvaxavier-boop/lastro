"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatarData } from "@/lib/format";

const LABELS: Record<string, string> = {
  selic: "Selic",
  cdi: "CDI",
  ipca: "IPCA",
  igpm: "IGP-M",
  incc: "INCC",
};

export function IndicadorCard({
  tipo,
  valor,
  dataReferencia,
  tendencia,
  automatizado,
  onClick,
}: {
  tipo: string;
  valor: number | null;
  dataReferencia: string | null;
  tendencia: "alta" | "queda" | null;
  automatizado?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-5 text-left hover:border-blue-300"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          {LABELS[tipo] ?? tipo}
          {automatizado && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-600">
              Auto
            </span>
          )}
        </span>
        {tendencia && (
          <span className={`flex items-center gap-1 text-sm font-medium ${tendencia === "alta" ? "text-emerald-600" : "text-red-600"}`}>
            {tendencia === "alta" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {valor !== null ? `${(valor * 100).toFixed(2)}%` : "—"}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500">
        {dataReferencia ? `Atualizado em ${formatarData(dataReferencia)}` : "Sem dados coletados"}
      </p>
    </button>
  );
}
