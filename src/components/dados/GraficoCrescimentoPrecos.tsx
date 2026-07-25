"use client";

import { useEffect, useState } from "react";
import { TrendChart } from "@/components/TrendChart";
import { CORES_SERIE } from "@/components/ui/ChartLegend";
import { Field } from "@/components/ui/Field";
import { indexarBase100, mesclarSeries } from "@/lib/tendenciasCalc";
import type { Localizacao, PrecoMercadoLocal } from "@/types/dominio";

export function GraficoCrescimentoPrecos({ localizacoes }: { localizacoes: Localizacao[] }) {
  const [localizacaoId, setLocalizacaoId] = useState("");
  const [segmento, setSegmento] = useState<"residencial" | "comercial">("residencial");
  const [precos, setPrecos] = useState<PrecoMercadoLocal[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!localizacaoId) {
      void Promise.resolve().then(() => setPrecos([]));
      return;
    }
    void Promise.resolve().then(() => setCarregando(true));
    fetch(`/api/precos-mercado?localizacaoId=${localizacaoId}&segmento=${segmento}`)
      .then((r) => r.json())
      .then((d) => {
        setPrecos(d.precos ?? []);
        setCarregando(false);
      });
  }, [localizacaoId, segmento]);

  const serieVenda = indexarBase100(
    precos.filter((p) => p.tipo === "venda").map((p) => ({ data: p.data_referencia, valor: p.valor_m2 }))
  );
  const serieAluguel = indexarBase100(
    precos.filter((p) => p.tipo === "aluguel").map((p) => ({ data: p.data_referencia, valor: p.valor_m2 }))
  );

  const dadosGrafico = mesclarSeries({ Venda: serieVenda, Aluguel: serieAluguel });
  const localizacoesOrdenadas = [...localizacoes].sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Localização">
          <select className="input" value={localizacaoId} onChange={(e) => setLocalizacaoId(e.target.value)}>
            <option value="">Selecione...</option>
            {localizacoesOrdenadas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Segmento">
          <select className="input" value={segmento} onChange={(e) => setSegmento(e.target.value as typeof segmento)}>
            <option value="residencial">Residencial</option>
            <option value="comercial">Comercial</option>
          </select>
        </Field>
      </div>

      {!localizacaoId && (
        <p className="text-sm text-slate-400">Selecione uma localização para ver a evolução de preços.</p>
      )}
      {localizacaoId && carregando && <p className="text-sm text-slate-400">Carregando...</p>}
      {localizacaoId && !carregando && dadosGrafico.length === 0 && (
        <p className="text-sm text-slate-400">Nenhum preço {segmento} cadastrado para essa localização.</p>
      )}
      {dadosGrafico.length > 0 && (
        <TrendChart
          titulo="Crescimento do preço por m² (base 100)"
          series={[
            { key: "Venda", label: "Venda", color: CORES_SERIE[0] },
            { key: "Aluguel", label: "Aluguel", color: CORES_SERIE[1] },
          ]}
          dados={dadosGrafico}
        />
      )}
    </div>
  );
}
