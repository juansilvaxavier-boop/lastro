"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import { formatarMoeda, formatarPercentual, formatarData } from "@/lib/format";
import type { Empreendimento } from "@/types/dominio";

export function SlideCasosSucesso() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);

  useEffect(() => {
    fetch("/api/empreendimentos")
      .then((r) => r.json())
      .then((d) => setEmpreendimentos(d.empreendimentos ?? []));
  }, []);

  const casos = empreendimentos
    .filter((e) => e.valorizacaoBairroDesdeLancamento !== null && e.valorizacaoBairroDesdeLancamento !== undefined)
    .sort((a, b) => (b.valorizacaoBairroDesdeLancamento ?? 0) - (a.valorizacaoBairroDesdeLancamento ?? 0))
    .slice(0, 3);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Casos de sucesso</h1>
      {casos.length === 0 ? (
        <p className="text-slate-400">Nenhum empreendimento com histórico de valorização suficiente ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {casos.map((e) => (
            <div key={e.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-lg font-semibold text-slate-900">{e.nome}</p>
              <p className="text-sm text-slate-500">
                {e.bairro?.nome ?? "—"} · {e.construtora?.nome ?? "—"}
              </p>
              <p className="mt-3 text-xs text-slate-400">Lançado em {formatarData(e.data_lancamento)}</p>
              <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-emerald-600">
                <TrendingUp size={22} /> +{formatarPercentual(e.valorizacaoBairroDesdeLancamento!, 0)}
              </p>
              <p className="text-xs text-slate-400">valorização do bairro desde o lançamento</p>
              {e.observacao_valorizacao && <p className="mt-3 text-sm text-slate-600">{e.observacao_valorizacao}</p>}
              <p className="mt-3 text-sm font-medium text-slate-900">{formatarMoeda(e.preco_total)} hoje</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
