"use client";

import { useEffect, useState } from "react";
import { CenarioMacroBloco } from "@/components/dados/CenarioMacroBloco";
import { IndicadorCard } from "@/components/dados/IndicadorCard";

interface IndicadorResumo {
  tipo: string;
  atual: { valor: number; data_referencia: string } | null;
  tendencia: "alta" | "queda" | null;
}

export function SlideCenarioMacro() {
  const [indicadores, setIndicadores] = useState<IndicadorResumo[]>([]);

  useEffect(() => {
    fetch("/api/indicadores")
      .then((r) => r.json())
      .then((d) => setIndicadores(d.indicadores ?? []));
  }, []);

  const nacionais = indicadores.filter((i) => ["selic", "cdi", "ipca", "igpm"].includes(i.tipo));

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Cenário de mercado</h1>
      <CenarioMacroBloco editavel={false} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {nacionais.map((i) => (
          <IndicadorCard
            key={i.tipo}
            tipo={i.tipo}
            valor={i.atual?.valor ?? null}
            dataReferencia={i.atual?.data_referencia ?? null}
            tendencia={i.tendencia}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
