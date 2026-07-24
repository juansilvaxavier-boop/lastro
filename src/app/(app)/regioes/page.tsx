"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, MapPin, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LocalizacaoForm } from "@/components/regioes/LocalizacaoForm";
import { InfoSocioeconomica } from "@/components/regioes/InfoSocioeconomica";
import { RankingBairros, type ItemRankingBairro } from "@/components/regioes/RankingBairros";
import { TrendChart } from "@/components/TrendChart";
import { CORES_SERIE } from "@/components/ui/ChartLegend";
import { mesclarSeries } from "@/lib/tendenciasCalc";
import { useUsuario, podeEditar } from "@/components/UsuarioContext";
import { formatarPercentual } from "@/lib/format";
import type { Localizacao, PrecoMercadoLocal, IndicadorMercado } from "@/types/dominio";

export default function RegioesPage() {
  const usuario = useUsuario();
  const editavel = podeEditar(usuario.papel);

  const [localizacoes, setLocalizacoes] = useState<Localizacao[] | null>(null);
  const [caminho, setCaminho] = useState<Localizacao[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [precos, setPrecos] = useState<PrecoMercadoLocal[]>([]);
  const [precosCidade, setPrecosCidade] = useState<PrecoMercadoLocal[]>([]);
  const [ipcaHistorico, setIpcaHistorico] = useState<IndicadorMercado[]>([]);

  const carregar = useCallback(async () => {
    const res = await fetch("/api/localizacoes");
    const data = await res.json();
    setLocalizacoes(data.localizacoes ?? []);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const nivelAtualId = caminho[caminho.length - 1]?.id ?? null;
  const nivelAtual = nivelAtualId
    ? (localizacoes?.find((l) => l.id === nivelAtualId) ?? caminho[caminho.length - 1])
    : null;

  const filhos = useMemo(() => {
    if (!localizacoes) return [];
    return localizacoes
      .filter((l) => l.parent_id === (nivelAtual?.id ?? null))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [localizacoes, nivelAtual]);

  const bairrosDaCidade = useMemo(
    () => (nivelAtual?.tipo === "cidade" ? filhos.filter((f) => f.tipo === "bairro") : []),
    [filhos, nivelAtual]
  );

  useEffect(() => {
    if (nivelAtual && (nivelAtual.tipo === "bairro" || nivelAtual.tipo === "cidade")) {
      fetch(`/api/precos-mercado?localizacaoId=${nivelAtual.id}`)
        .then((r) => r.json())
        .then((d) => setPrecos(d.precos ?? []));
    } else {
      Promise.resolve().then(() => setPrecos([]));
    }
  }, [nivelAtual]);

  useEffect(() => {
    if (nivelAtual?.tipo === "cidade") {
      fetch("/api/precos-mercado")
        .then((r) => r.json())
        .then((d) => setPrecosCidade(d.precos ?? []));
      fetch("/api/indicadores?tipo=ipca")
        .then((r) => r.json())
        .then((d) => setIpcaHistorico(d.historico ?? []));
    } else {
      Promise.resolve().then(() => setPrecosCidade([]));
    }
  }, [nivelAtual]);

  const precoVenda = precos.filter((p) => p.tipo === "venda").at(-1);
  const precoAluguel = precos.filter((p) => p.tipo === "aluguel").at(-1);
  const yieldEstimado =
    precoVenda && precoAluguel ? (precoAluguel.valor_m2 * 12) / precoVenda.valor_m2 : null;

  const idsBairros = new Set(bairrosDaCidade.map((b) => b.id));
  const rankingBairros: ItemRankingBairro[] = bairrosDaCidade
    .map((bairro) => {
      const historicoVenda = precosCidade.filter((p) => p.localizacao_id === bairro.id && p.tipo === "venda");
      const ultimo = historicoVenda.at(-1);
      if (!ultimo) return null;
      return { id: bairro.id, nome: bairro.nome, precoM2: ultimo.valor_m2, variacao12m: ultimo.variacao_anual_12m };
    })
    .filter((x): x is ItemRankingBairro => x !== null)
    .sort((a, b) => b.precoM2 - a.precoM2);

  const serieVariacaoCidade = useMemo(() => {
    if (!nivelAtual || nivelAtual.tipo !== "cidade") return [];
    const porData = new Map<string, number[]>();
    for (const p of precosCidade) {
      if (p.tipo !== "venda" || !idsBairros.has(p.localizacao_id ?? "") || p.variacao_anual_12m === null) continue;
      const lista = porData.get(p.data_referencia) ?? [];
      lista.push(p.variacao_anual_12m);
      porData.set(p.data_referencia, lista);
    }
    return [...porData.entries()]
      .map(([data, valores]) => ({ data, valor: (valores.reduce((a, b) => a + b, 0) / valores.length) * 100 }))
      .sort((a, b) => a.data.localeCompare(b.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precosCidade, nivelAtual]);

  const serieIpca = ipcaHistorico.map((i) => ({ data: i.data_referencia, valor: i.valor * 100 }));

  const dadosGrafico = mesclarSeries({
    [`Preço médio (${nivelAtual?.nome ?? ""})`]: serieVariacaoCidade,
    IPCA: serieIpca,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Cadastro de estados, regiões, cidades e bairros</h1>
        {editavel && (
          <Button onClick={() => setModalAberto(true)}>
            <Plus size={16} /> Novo cadastro
          </Button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <button type="button" onClick={() => setCaminho([])} className="hover:text-slate-900">
          Início
        </button>
        {caminho.map((item, i) => (
          <span key={item.id} className="flex items-center gap-1">
            <ChevronRight size={14} />
            <button type="button" onClick={() => setCaminho(caminho.slice(0, i + 1))} className="hover:text-slate-900">
              {localizacoes?.find((l) => l.id === item.id)?.nome ?? item.nome}
            </button>
          </span>
        ))}
        {nivelAtual && editavel && (
          <button
            type="button"
            onClick={() => setModalEditarAberto(true)}
            className="ml-1 flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-slate-400 hover:bg-gray-100 hover:text-slate-700"
          >
            <Pencil size={13} /> Editar
          </button>
        )}
      </div>

      {nivelAtual?.tipo === "cidade" && (
        <InfoSocioeconomica localizacao={nivelAtual} editavel={editavel} onAtualizado={carregar} />
      )}

      {nivelAtual && (nivelAtual.tipo === "bairro" || nivelAtual.tipo === "cidade") && (precoVenda || precoAluguel) && (
        <div className="mb-5 flex flex-wrap gap-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
          {precoVenda && <p><span className="text-slate-500">Preço médio/m²: </span><span className="font-semibold">{precoVenda.valor_m2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></p>}
          {precoAluguel && <p><span className="text-slate-500">Aluguel médio/m²: </span><span className="font-semibold">{precoAluguel.valor_m2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></p>}
          {yieldEstimado !== null && <p><span className="text-slate-500">Yield estimado: </span><span className="font-semibold">{formatarPercentual(yieldEstimado, 1)}</span></p>}
        </div>
      )}

      {nivelAtual?.tipo === "cidade" && bairrosDaCidade.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Bairros mais representativos
          </h2>
          <RankingBairros itens={rankingBairros} />
        </div>
      )}

      {nivelAtual?.tipo === "cidade" && dadosGrafico.length > 0 && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
          <TrendChart
            titulo="Variação dos preços de venda em 12 meses"
            series={[
              { key: `Preço médio (${nivelAtual.nome})`, label: `Preço médio (${nivelAtual.nome})`, color: CORES_SERIE[0] },
              { key: "IPCA", label: "IPCA", color: CORES_SERIE[1] },
            ]}
            dados={dadosGrafico}
          />
        </div>
      )}

      {localizacoes === null && <CardGridSkeleton />}

      {localizacoes !== null && filhos.length === 0 && (
        <EmptyState
          icon={MapPin}
          titulo={nivelAtual ? `Nada cadastrado em ${nivelAtual.nome}` : "Nenhuma localização cadastrada"}
          descricao="Cadastre estados, regiões, cidades e bairros para organizar os imóveis por localização."
          acao={
            editavel && (
              <Button onClick={() => setModalAberto(true)}>
                <Plus size={16} /> Novo cadastro
              </Button>
            )
          }
        />
      )}

      {localizacoes !== null && filhos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {filhos.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setCaminho([...caminho, l])}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 text-left hover:border-blue-300"
            >
              <span className="text-lg font-medium text-slate-900">{l.nome}</span>
              {l.tipo !== "bairro" && <ChevronRight size={18} className="text-slate-400" />}
            </button>
          ))}
        </div>
      )}

      <Modal aberto={modalAberto} titulo="Novo cadastro" onFechar={() => setModalAberto(false)}>
        <LocalizacaoForm
          paisagem={localizacoes ?? []}
          parentSugerido={nivelAtual}
          onSucesso={() => {
            setModalAberto(false);
            carregar();
          }}
        />
      </Modal>

      {nivelAtual && (
        <Modal aberto={modalEditarAberto} titulo={`Editar ${nivelAtual.nome}`} onFechar={() => setModalEditarAberto(false)}>
          <LocalizacaoForm
            paisagem={localizacoes ?? []}
            parentSugerido={nivelAtual}
            localizacao={nivelAtual}
            onSucesso={async () => {
              setModalEditarAberto(false);
              await carregar();
            }}
          />
        </Modal>
      )}
    </div>
  );
}
