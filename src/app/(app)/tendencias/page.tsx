"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, SlidersHorizontal, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmpreendimentoCard } from "@/components/imoveis/EmpreendimentoCard";
import { TrendChart } from "@/components/TrendChart";
import { RankedList } from "@/components/tendencias/RankedList";
import { CalculadoraModal } from "@/components/tendencias/CalculadoraModal";
import { CORES_SERIE } from "@/components/ui/ChartLegend";
import {
  serieEvolucaoValor,
  indexarBase100,
  indexarIndicador,
  serieMomentoVenda,
  serieParcelaAluguel,
  serieRoiAcumulado,
  capRatePorBairro,
  mesclarSeries,
} from "@/lib/tendenciasCalc";
import { simularFinanciamento } from "@/lib/engine";
import type { Empreendimento, Cliente, Localizacao, PrecoMercadoLocal, IndicadorMercado } from "@/types/dominio";

export default function TendenciasPage() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [regiaoId, setRegiaoId] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const [precosPorBairro, setPrecosPorBairro] = useState<Map<string, PrecoMercadoLocal[]>>(new Map());
  const [cdiHistorico, setCdiHistorico] = useState<IndicadorMercado[]>([]);
  const [ipcaHistorico, setIpcaHistorico] = useState<IndicadorMercado[]>([]);

  const [calculadoraAlvo, setCalculadoraAlvo] = useState<Empreendimento | null>(null);

  useEffect(() => {
    fetch("/api/empreendimentos")
      .then((r) => r.json())
      .then((d) => setEmpreendimentos(d.empreendimentos ?? []));
    fetch("/api/localizacoes")
      .then((r) => r.json())
      .then((d) => setLocalizacoes(d.localizacoes ?? []));
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((d) => setClientes(d.clientes ?? []));
    fetch("/api/indicadores?tipo=cdi")
      .then((r) => r.json())
      .then((d) => setCdiHistorico(d.historico ?? []));
    fetch("/api/indicadores?tipo=ipca")
      .then((r) => r.json())
      .then((d) => setIpcaHistorico(d.historico ?? []));
  }, []);

  const empreendimentosSelecionados = useMemo(
    () => empreendimentos.filter((e) => selecionados.includes(e.id)),
    [empreendimentos, selecionados]
  );

  useEffect(() => {
    const bairrosNecessarios = [...new Set(empreendimentosSelecionados.map((e) => e.bairro_id).filter(Boolean))] as string[];
    bairrosNecessarios.forEach((bairroId) => {
      if (precosPorBairro.has(bairroId)) return;
      fetch(`/api/precos-mercado?localizacaoId=${bairroId}`)
        .then((r) => r.json())
        .then((d) => setPrecosPorBairro((atual) => new Map(atual).set(bairroId, d.precos ?? [])));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empreendimentosSelecionados]);

  const clienteSelecionado = clientes.find((c) => c.id === clienteId) ?? null;

  const imoveisFiltrados = regiaoId ? empreendimentos.filter((e) => e.bairro_id === regiaoId) : empreendimentos;

  function alternarSelecao(id: string) {
    setSelecionados((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      if (atual.length >= 3) return atual;
      return [...atual, id];
    });
  }

  const serieEvolucao = mesclarSeries(
    Object.fromEntries(
      empreendimentosSelecionados.map((e) => [
        e.nome,
        e.bairro_id ? serieEvolucaoValor(e, precosPorBairro.get(e.bairro_id) ?? []) : [],
      ])
    ) as Record<string, { data: string; valor: number }[]>
  );

  const primeiroSelecionado = empreendimentosSelecionados[0] ?? null;
  const serieCdiImovel = primeiroSelecionado
    ? mesclarSeries({
        [primeiroSelecionado.nome]: indexarBase100(
          (primeiroSelecionado.bairro_id ? serieEvolucaoValor(primeiroSelecionado, precosPorBairro.get(primeiroSelecionado.bairro_id) ?? []) : []) as {
            data: string;
            valor: number;
          }[]
        ),
        CDI: indexarIndicador(cdiHistorico),
        IPCA: indexarIndicador(ipcaHistorico),
      })
    : [];

  const serieMomento = mesclarSeries(
    Object.fromEntries(
      empreendimentosSelecionados.map((e) => {
        const historico = e.bairro_id ? precosPorBairro.get(e.bairro_id)?.filter((p) => p.tipo === "venda") : [];
        const variacaoMedia =
          historico && historico.length > 0
            ? historico.reduce((soma, p) => soma + (p.variacao_anual_12m ?? 0), 0) / historico.length
            : 0.06;
        return [e.nome, serieMomentoVenda(e, variacaoMedia)];
      })
    ) as Record<string, { data: string; valor: number }[]>
  );

  const parcelaEstimada = primeiroSelecionado
    ? simularFinanciamento({
        preco: primeiroSelecionado.preco_total,
        valorEntrada: primeiroSelecionado.preco_total * 0.2,
        numParcelas: 360,
        taxaJurosAnual: 0.11,
        sistema: "SAC",
      }).parcelaInicial
    : 0;
  const serieParcela = primeiroSelecionado?.bairro_id
    ? serieParcelaAluguel(
        parcelaEstimada,
        precosPorBairro.get(primeiroSelecionado.bairro_id) ?? [],
        primeiroSelecionado.metragem_privativa ?? primeiroSelecionado.metragem_total
      )
    : [];

  const serieRoi = mesclarSeries(
    Object.fromEntries(
      empreendimentosSelecionados.map((e) => {
        const historicoValor = e.bairro_id ? serieEvolucaoValor(e, precosPorBairro.get(e.bairro_id) ?? []) : [];
        const historicoAluguel = e.bairro_id ? precosPorBairro.get(e.bairro_id)?.filter((p) => p.tipo === "aluguel") : [];
        const aluguelMensal =
          historicoAluguel && historicoAluguel.length > 0 && (e.metragem_privativa ?? e.metragem_total)
            ? (historicoAluguel.at(-1)!.valor_m2 * (e.metragem_privativa ?? e.metragem_total)!)
            : 0;
        return [e.nome, serieRoiAcumulado(e.preco_total, historicoValor, aluguelMensal, e.data_lancamento)];
      })
    ) as Record<string, { data: string; valor: number }[]>
  );

  const serieVelocidade = mesclarSeries(
    Object.fromEntries(
      empreendimentosSelecionados.map((e) => {
        const inicio = e.data_lancamento ?? e.created_at;
        return [
          e.nome,
          [
            { data: inicio, valor: 0 },
            { data: new Date().toISOString().slice(0, 10), valor: (e.percentual_vendido ?? 0) * 100 },
          ],
        ];
      })
    ) as Record<string, { data: string; valor: number }[]>
  );

  const aluguelPorBairro = new Map<string, number>();
  for (const [bairroId, precos] of precosPorBairro.entries()) {
    const ultimoAluguel = precos.filter((p) => p.tipo === "aluguel").at(-1);
    if (ultimoAluguel) aluguelPorBairro.set(bairroId, ultimoAluguel.valor_m2);
  }
  const capRates = capRatePorBairro(empreendimentos, aluguelPorBairro);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Tendências</h1>
        <div className="flex gap-3">
          <Button
            onClick={() => primeiroSelecionado && setCalculadoraAlvo(primeiroSelecionado)}
            disabled={!primeiroSelecionado}
          >
            <Calculator size={16} /> Calculadora
          </Button>
          <Button variant="outline" onClick={() => setFiltrosAbertos((v) => !v)}>
            <SlidersHorizontal size={16} /> Filtros
          </Button>
        </div>
      </div>

      {filtrosAbertos && (
        <div className="mb-6 flex flex-wrap gap-3">
          <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Filtrar cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <select className="input" value={regiaoId} onChange={(e) => setRegiaoId(e.target.value)}>
            <option value="">Região</option>
            {localizacoes
              .filter((l) => l.tipo === "bairro")
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
          </select>
        </div>
      )}

      {clienteSelecionado && (
        <div className="mb-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-400">Dados do cliente</h2>
          <p className="text-lg font-bold text-slate-900">
            {clienteSelecionado.nome} <span className="font-normal text-slate-500">{clienteSelecionado.telefone}</span>
          </p>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Imóveis {selecionados.length > 0 && `(${selecionados.length}/3 selecionados)`}
      </h2>
      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {imoveisFiltrados.map((e) => (
          <div
            key={e.id}
            className={`rounded-2xl ${selecionados.includes(e.id) ? "ring-2 ring-blue-600" : ""}`}
          >
            <EmpreendimentoCard empreendimento={e} onClick={() => alternarSelecao(e.id)} />
          </div>
        ))}
      </div>

      {empreendimentosSelecionados.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          titulo="Selecione um imóvel para começar"
          descricao="Clique em até 3 cards acima para ver a evolução de valor, comparativos e projeções."
        />
      ) : (
        <div className="flex flex-col gap-10">
          <TrendChart
            titulo="Evolução de valor de imóveis"
            series={empreendimentosSelecionados.map((e, i) => ({ key: e.nome, label: e.nome, color: CORES_SERIE[i] }))}
            dados={serieEvolucao}
          />
          {primeiroSelecionado && (
            <TrendChart
              titulo="CDI x Imóvel"
              series={[
                { key: primeiroSelecionado.nome, label: primeiroSelecionado.nome, color: CORES_SERIE[0] },
                { key: "CDI", label: "CDI", color: CORES_SERIE[1] },
                { key: "IPCA", label: "IPCA", color: CORES_SERIE[2] },
              ]}
              dados={serieCdiImovel}
            />
          )}
          <TrendChart
            titulo="Momento da venda"
            series={empreendimentosSelecionados.map((e, i) => ({ key: e.nome, label: e.nome, color: CORES_SERIE[i] }))}
            dados={serieMomento}
          />
          {primeiroSelecionado && (
            <TrendChart
              titulo="Parcela x Aluguel"
              series={[
                { key: "parcela", label: "Parcela", color: CORES_SERIE[0] },
                { key: "aluguel", label: "Aluguel", color: CORES_SERIE[1] },
              ]}
              dados={serieParcela}
            />
          )}
          <TrendChart
            titulo="ROI acumulado"
            series={empreendimentosSelecionados.map((e, i) => ({ key: e.nome, label: e.nome, color: CORES_SERIE[i] }))}
            dados={serieRoi}
          />
          <RankedList titulo="Cap rate por bairro" itens={capRates.map((c) => ({ rotulo: c.bairro, valor: c.capRate }))} />
          <TrendChart
            titulo="Velocidade de vendas"
            series={empreendimentosSelecionados.map((e, i) => ({ key: e.nome, label: e.nome, color: CORES_SERIE[i] }))}
            dados={serieVelocidade}
          />
        </div>
      )}

      <CalculadoraModal
        aberto={calculadoraAlvo !== null}
        onFechar={() => setCalculadoraAlvo(null)}
        empreendimento={calculadoraAlvo}
        cliente={clienteSelecionado}
      />
    </div>
  );
}
