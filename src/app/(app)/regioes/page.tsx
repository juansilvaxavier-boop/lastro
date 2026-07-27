"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, MapPin, ChevronRight, Pencil, LocateFixed, Building2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LocalizacaoForm } from "@/components/regioes/LocalizacaoForm";
import { InfoSocioeconomica } from "@/components/regioes/InfoSocioeconomica";
import { RankingBairros, type ItemRankingBairro } from "@/components/regioes/RankingBairros";
import { PontoInteresseForm } from "@/components/regioes/PontoInteresseForm";
import { TrendChart } from "@/components/TrendChart";
import { CORES_SERIE } from "@/components/ui/ChartLegend";
import { mesclarSeries } from "@/lib/tendenciasCalc";
import { useUsuario, podeEditar } from "@/components/UsuarioContext";
import { formatarPercentual } from "@/lib/format";
import { LABEL_TIPO_PONTO_INTERESSE } from "@/types/dominio";
import type { Localizacao, PrecoMercadoLocal, IndicadorMercado, PontoInteresse } from "@/types/dominio";
import { corPorFaixaPreco } from "@/lib/colorScale";

const MapaCidade = dynamic(() => import("@/components/regioes/MapaCidade").then((m) => m.MapaCidade), {
  ssr: false,
});

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
  const [geocodificando, setGeocodificando] = useState(false);
  const [progressoGeocodificacao, setProgressoGeocodificacao] = useState<string | null>(null);
  const [pontosInteresse, setPontosInteresse] = useState<PontoInteresse[]>([]);
  const [modalPontoInteresseAberto, setModalPontoInteresseAberto] = useState<"novo" | PontoInteresse | null>(null);
  const [paraExcluirPonto, setParaExcluirPonto] = useState<PontoInteresse | null>(null);
  const [excluindoPonto, setExcluindoPonto] = useState(false);
  const [geocodificandoPontos, setGeocodificandoPontos] = useState(false);
  const [progressoPontos, setProgressoPontos] = useState<string | null>(null);

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

  const pontosMapa = useMemo(
    () =>
      bairrosDaCidade
        .filter((b) => b.latitude !== null && b.longitude !== null)
        .map((b) => ({ id: b.id, nome: b.nome, latitude: b.latitude!, longitude: b.longitude! })),
    [bairrosDaCidade]
  );
  const bairrosSemCoordenada = useMemo(
    () => bairrosDaCidade.filter((b) => b.latitude === null || b.longitude === null),
    [bairrosDaCidade]
  );

  const pontosInteresseComCoordenada = useMemo(
    () => pontosInteresse.filter((p) => p.latitude !== null && p.longitude !== null),
    [pontosInteresse]
  );
  const pontosInteresseSemCoordenada = useMemo(
    () => pontosInteresse.filter((p) => p.latitude === null || p.longitude === null),
    [pontosInteresse]
  );

  const carregarPontosInteresse = useCallback(async () => {
    if (!nivelAtual || nivelAtual.tipo !== "cidade") {
      setPontosInteresse([]);
      return;
    }
    const res = await fetch(`/api/pontos-interesse?cidadeId=${nivelAtual.id}`);
    const data = await res.json();
    setPontosInteresse(data.pontosInteresse ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivelAtual?.id, nivelAtual?.tipo]);

  useEffect(() => {
    void Promise.resolve().then(carregarPontosInteresse);
  }, [carregarPontosInteresse]);

  async function geocodificarPontosSemCoordenada() {
    setGeocodificandoPontos(true);
    let falhas = 0;
    for (let i = 0; i < pontosInteresseSemCoordenada.length; i++) {
      const ponto = pontosInteresseSemCoordenada[i];
      setProgressoPontos(`Buscando ${i + 1} de ${pontosInteresseSemCoordenada.length}: ${ponto.nome}...`);
      try {
        const res = await fetch(`/api/pontos-interesse/${ponto.id}/geocodificar`, { method: "POST" });
        if (!res.ok) falhas++;
      } catch {
        falhas++;
      }
      if (i < pontosInteresseSemCoordenada.length - 1) await new Promise((r) => setTimeout(r, 1100));
    }
    setProgressoPontos(
      falhas > 0 ? `Concluído com ${falhas} ponto(s) não encontrado(s) — edite manualmente depois.` : "Concluído."
    );
    setGeocodificandoPontos(false);
    carregarPontosInteresse();
  }

  async function excluirPontoInteresse() {
    if (!paraExcluirPonto) return;
    setExcluindoPonto(true);
    await fetch(`/api/pontos-interesse/${paraExcluirPonto.id}`, { method: "DELETE" });
    setExcluindoPonto(false);
    setParaExcluirPonto(null);
    carregarPontosInteresse();
  }

  async function geocodificarBairrosSemCoordenada() {
    setGeocodificando(true);
    let falhas = 0;
    for (let i = 0; i < bairrosSemCoordenada.length; i++) {
      const bairro = bairrosSemCoordenada[i];
      setProgressoGeocodificacao(`Buscando ${i + 1} de ${bairrosSemCoordenada.length}: ${bairro.nome}...`);
      try {
        const res = await fetch(`/api/localizacoes/${bairro.id}/geocodificar`, { method: "POST" });
        if (!res.ok) falhas++;
      } catch {
        falhas++;
      }
      if (i < bairrosSemCoordenada.length - 1) await new Promise((r) => setTimeout(r, 1100));
    }
    setProgressoGeocodificacao(
      falhas > 0
        ? `Concluído com ${falhas} bairro(s) não encontrado(s) — tente editá-los manualmente depois.`
        : "Concluído."
    );
    setGeocodificando(false);
    carregar();
  }

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

  const precoM2PorBairro = new Map(rankingBairros.map((r) => [r.id, r.precoM2]));
  const pontosMapaComCor = useMemo(() => {
    const precos = pontosMapa.map((p) => precoM2PorBairro.get(p.id)).filter((v): v is number => v !== undefined);
    if (precos.length < 2) return pontosMapa.map((p) => ({ ...p, cor: "#1d4ed8" }));
    const min = Math.min(...precos);
    const max = Math.max(...precos);
    return pontosMapa.map((p) => {
      const preco = precoM2PorBairro.get(p.id);
      if (preco === undefined || max === min) return { ...p, cor: "#1d4ed8" };
      return { ...p, cor: corPorFaixaPreco((preco - min) / (max - min)) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontosMapa, rankingBairros]);

  const pontosInteresseMapa = pontosInteresseComCoordenada.map((p) => ({
    id: p.id,
    nome: p.nome,
    tipo: p.tipo,
    latitude: p.latitude!,
    longitude: p.longitude!,
  }));

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

      {nivelAtual?.tipo === "cidade" && bairrosDaCidade.length > 0 && (
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Mapa da cidade (cor pelo preço/m² do bairro)
            </h2>
            <div className="flex flex-wrap gap-2">
              {editavel && (
                <Button variant="outline" onClick={() => setModalPontoInteresseAberto("novo")}>
                  <Building2 size={16} /> Novo ponto de interesse
                </Button>
              )}
              {editavel && bairrosSemCoordenada.length > 0 && (
                <Button variant="outline" onClick={geocodificarBairrosSemCoordenada} disabled={geocodificando}>
                  <LocateFixed size={16} />
                  {geocodificando
                    ? "Buscando..."
                    : `Buscar coordenadas dos bairros sem localização (${bairrosSemCoordenada.length})`}
                </Button>
              )}
            </div>
          </div>
          {progressoGeocodificacao && <p className="mb-3 text-sm text-slate-500">{progressoGeocodificacao}</p>}
          {pontosMapa.length === 0 ? (
            <p className="mb-4 text-sm text-slate-400">
              Nenhum bairro com coordenadas ainda. {editavel && "Use o botão acima para buscar automaticamente."}
            </p>
          ) : (
            <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200">
              <MapaCidade pontos={pontosMapaComCor} pontosInteresse={pontosInteresseMapa} />
            </div>
          )}

          {pontosInteresse.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Pontos de interesse (infraestrutura futura)
                </h3>
                {editavel && pontosInteresseSemCoordenada.length > 0 && (
                  <Button variant="outline" onClick={geocodificarPontosSemCoordenada} disabled={geocodificandoPontos}>
                    <LocateFixed size={14} />
                    {geocodificandoPontos ? "Buscando..." : `Buscar coordenadas (${pontosInteresseSemCoordenada.length})`}
                  </Button>
                )}
              </div>
              {progressoPontos && <p className="mb-2 text-xs text-slate-500">{progressoPontos}</p>}
              <ul className="divide-y divide-gray-100 text-sm">
                {pontosInteresse.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <span className="font-medium text-slate-900">{p.nome}</span>{" "}
                      <span className="text-xs text-slate-500">
                        · {LABEL_TIPO_PONTO_INTERESSE[p.tipo as keyof typeof LABEL_TIPO_PONTO_INTERESSE] ?? p.tipo}
                        {p.previsao_conclusao && ` · previsão ${p.previsao_conclusao}`}
                        {p.latitude === null && " · sem coordenada"}
                      </span>
                    </div>
                    {editavel && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => setModalPontoInteresseAberto(p)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setParaExcluirPonto(p)}
                          className="rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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

      {nivelAtual?.tipo === "cidade" && (
        <Modal
          aberto={modalPontoInteresseAberto !== null}
          titulo={modalPontoInteresseAberto === "novo" ? "Novo ponto de interesse" : "Editar ponto de interesse"}
          onFechar={() => setModalPontoInteresseAberto(null)}
        >
          <PontoInteresseForm
            cidadeId={nivelAtual.id}
            pontoInteresse={modalPontoInteresseAberto === "novo" ? undefined : (modalPontoInteresseAberto ?? undefined)}
            onSucesso={() => {
              setModalPontoInteresseAberto(null);
              carregarPontosInteresse();
            }}
          />
        </Modal>
      )}

      <ConfirmDialog
        aberto={paraExcluirPonto !== null}
        titulo="Excluir ponto de interesse"
        descricao={`Tem certeza que deseja excluir "${paraExcluirPonto?.nome}"?`}
        confirmando={excluindoPonto}
        onConfirmar={excluirPontoInteresse}
        onCancelar={() => setParaExcluirPonto(null)}
      />
    </div>
  );
}
