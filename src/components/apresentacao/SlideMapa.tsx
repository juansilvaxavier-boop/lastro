"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { RankingBairros, type ItemRankingBairro } from "@/components/regioes/RankingBairros";
import { corPorFaixaPreco } from "@/lib/colorScale";
import type { Localizacao, PrecoMercadoLocal, PontoInteresse } from "@/types/dominio";

const MapaCidade = dynamic(() => import("@/components/regioes/MapaCidade").then((m) => m.MapaCidade), {
  ssr: false,
});

export function SlideMapa({ cidade }: { cidade: Localizacao }) {
  const [bairros, setBairros] = useState<Localizacao[]>([]);
  const [precos, setPrecos] = useState<PrecoMercadoLocal[]>([]);
  const [pontosInteresse, setPontosInteresse] = useState<PontoInteresse[]>([]);

  useEffect(() => {
    fetch("/api/localizacoes?tipo=bairro")
      .then((r) => r.json())
      .then((d) => setBairros((d.localizacoes ?? []).filter((b: Localizacao) => b.parent_id === cidade.id)));
    fetch("/api/precos-mercado")
      .then((r) => r.json())
      .then((d) => setPrecos(d.precos ?? []));
    fetch(`/api/pontos-interesse?cidadeId=${cidade.id}`)
      .then((r) => r.json())
      .then((d) => setPontosInteresse(d.pontosInteresse ?? []));
  }, [cidade.id]);

  const ranking: ItemRankingBairro[] = useMemo(
    () =>
      bairros
        .map((bairro) => {
          const historico = precos.filter((p) => p.localizacao_id === bairro.id && p.tipo === "venda");
          const ultimo = historico.at(-1);
          if (!ultimo) return null;
          return { id: bairro.id, nome: bairro.nome, precoM2: ultimo.valor_m2, variacao12m: ultimo.variacao_anual_12m };
        })
        .filter((x): x is ItemRankingBairro => x !== null)
        .sort((a, b) => b.precoM2 - a.precoM2),
    [bairros, precos]
  );

  const pontosMapa = useMemo(() => {
    const precoPorBairro = new Map(ranking.map((r) => [r.id, r.precoM2]));
    const comCoordenada = bairros.filter((b) => b.latitude !== null && b.longitude !== null);
    const precosVals = comCoordenada.map((b) => precoPorBairro.get(b.id)).filter((v): v is number => v !== undefined);
    const min = precosVals.length ? Math.min(...precosVals) : 0;
    const max = precosVals.length ? Math.max(...precosVals) : 0;
    return comCoordenada.map((b) => {
      const preco = precoPorBairro.get(b.id);
      const cor = preco === undefined || max === min ? "#1d4ed8" : corPorFaixaPreco((preco - min) / (max - min));
      return { id: b.id, nome: b.nome, latitude: b.latitude!, longitude: b.longitude!, cor };
    });
  }, [bairros, ranking]);

  const pontosInteresseMapa = pontosInteresse
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({ id: p.id, nome: p.nome, tipo: p.tipo, latitude: p.latitude!, longitude: p.longitude! }));

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Mapa e bairros mais valorizados</h1>
      {pontosMapa.length > 0 ? (
        <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200">
          <MapaCidade pontos={pontosMapa} pontosInteresse={pontosInteresseMapa} />
        </div>
      ) : (
        <p className="mb-8 text-sm text-slate-400">Nenhum bairro com coordenadas cadastradas para esta cidade.</p>
      )}
      <RankingBairros itens={ranking} />
    </div>
  );
}
