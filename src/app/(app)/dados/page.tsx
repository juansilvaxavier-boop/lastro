"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { IndicadorCard } from "@/components/dados/IndicadorCard";
import { DadoForm } from "@/components/dados/DadoForm";
import { ImportarPlanilhaModal } from "@/components/dados/ImportarPlanilhaModal";
import { GraficoCrescimentoPrecos } from "@/components/dados/GraficoCrescimentoPrecos";
import { ResetarDadosMercadoModal } from "@/components/dados/ResetarDadosMercadoModal";
import { CenarioMacroBloco } from "@/components/dados/CenarioMacroBloco";
import { TrendChart } from "@/components/TrendChart";
import { useUsuario, podeEditar } from "@/components/UsuarioContext";
import { formatarData } from "@/lib/format";
import type { Localizacao, PrecoMercadoLocal } from "@/types/dominio";

function dataIsoMenosAnos(anos: number): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  return data.toISOString().slice(0, 10);
}

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface IndicadorResumo {
  tipo: string;
  atual: { valor: number; data_referencia: string } | null;
  tendencia: "alta" | "queda" | null;
}

interface PontoPreview {
  indicador: string;
  valor: number;
  dataReferencia: string;
  fonte: string;
}

const LABEL_INDICADOR: Record<string, string> = { selic: "Selic", cdi: "CDI", ipca: "IPCA", igpm: "IGP-M" };

const LABEL_TIPO_PRECO: Record<string, string> = {
  venda: "Venda",
  aluguel: "Aluguel",
  hospedagem: "Hospedagem (Airbnb)",
};

const NACIONAIS_AUTOMATIZADOS = ["selic", "cdi", "ipca", "igpm"];

export default function DadosPage() {
  const usuario = useUsuario();
  const editavel = podeEditar(usuario.papel);

  const [indicadores, setIndicadores] = useState<IndicadorResumo[] | null>(null);
  const [precosLocais, setPrecosLocais] = useState<PrecoMercadoLocal[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [modalResetarAberto, setModalResetarAberto] = useState(false);
  const [abaPrecos, setAbaPrecos] = useState<"tabela" | "grafico">("tabela");
  const [modalSincronizarAberto, setModalSincronizarAberto] = useState(false);
  const [dataInicialSync, setDataInicialSync] = useState(dataIsoMenosAnos(2));
  const [dataFinalSync, setDataFinalSync] = useState(hojeIso());
  const [sincronizando, setSincronizando] = useState(false);
  const [lancando, setLancando] = useState(false);
  const [resultadoSync, setResultadoSync] = useState<string | null>(null);
  const [erroSync, setErroSync] = useState<string | null>(null);
  const [previa, setPrevia] = useState<PontoPreview[] | null>(null);
  const [historicoTipo, setHistoricoTipo] = useState<string | null>(null);
  const [historico, setHistorico] = useState<{ data: string; valor: number }[]>([]);

  const carregar = useCallback(async () => {
    const [resIndicadores, resPrecos] = await Promise.all([
      fetch("/api/indicadores"),
      fetch("/api/precos-mercado"),
    ]);
    const dIndicadores = await resIndicadores.json();
    const dPrecos = await resPrecos.json();
    setIndicadores(dIndicadores.indicadores ?? []);
    setPrecosLocais((dPrecos.precos ?? []).slice(-10).reverse());
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregar);
    fetch("/api/localizacoes")
      .then((r) => r.json())
      .then((d) => setLocalizacoes(d.localizacoes ?? []));
  }, [carregar]);

  async function buscarPreview() {
    setSincronizando(true);
    setErroSync(null);
    setResultadoSync(null);
    const res = await fetch(`/api/jobs/sync-bacen?dataInicial=${dataInicialSync}&dataFinal=${dataFinalSync}&preview=1`);
    const data = await res.json();
    setSincronizando(false);
    if (!res.ok) {
      setErroSync(data.error ?? "Não foi possível buscar os dados no Bacen.");
      return;
    }
    setPrevia(data.indicadores);
  }

  async function lancarPreview() {
    if (!previa) return;
    setLancando(true);
    setErroSync(null);
    const res = await fetch("/api/jobs/sync-bacen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ indicadores: previa }),
    });
    const data = await res.json();
    setLancando(false);
    if (!res.ok) {
      setErroSync(data.error ?? "Não foi possível lançar os dados.");
      return;
    }
    setResultadoSync(`${data.sincronizados} ponto(s) lançado(s).`);
    setPrevia(null);
    carregar();
  }

  async function sincronizarRapido() {
    setSincronizando(true);
    setErroSync(null);
    setResultadoSync(null);
    const res = await fetch("/api/jobs/sync-bacen");
    const data = await res.json();
    setSincronizando(false);
    if (!res.ok) {
      setErroSync(data.error ?? "Não foi possível sincronizar.");
      return;
    }
    setResultadoSync(`${data.sincronizados} ponto(s) sincronizado(s).`);
    carregar();
  }

  async function abrirHistorico(tipo: string) {
    setHistoricoTipo(tipo);
    const res = await fetch(`/api/indicadores?tipo=${tipo}`);
    const data = await res.json();
    setHistorico(
      (data.historico ?? []).map((h: { data_referencia: string; valor: number }) => ({
        data: h.data_referencia,
        valor: h.valor,
      }))
    );
  }

  const nacionais = indicadores?.filter((i) => ["selic", "cdi", "ipca", "igpm", "incc"].includes(i.tipo)) ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dados</h1>
          <p className="mt-1 text-sm text-slate-500">
            Selic, Inflação (IPCA), INCC (correção durante a obra), Preço médio por m² (venda, aluguel e hospedagem,
            residencial e comercial), IGP-M e CDI
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {editavel && (
            <Button onClick={() => setModalAberto(true)}>
              <Plus size={16} /> Novo dado
            </Button>
          )}
          {editavel && (
            <Button variant="outline" onClick={() => setModalImportarAberto(true)}>
              <Upload size={16} /> Importar planilha
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              setResultadoSync(null);
              setErroSync(null);
              setPrevia(null);
              setModalSincronizarAberto(true);
            }}
            disabled={sincronizando}
          >
            <RefreshCw size={16} className={sincronizando ? "animate-spin" : ""} /> Sincronizar agora
          </Button>
          {usuario.papel === "admin" && (
            <Button variant="danger" onClick={() => setModalResetarAberto(true)}>
              <Trash2 size={16} /> Resetar dados
            </Button>
          )}
        </div>
      </div>

      <CenarioMacroBloco editavel={editavel} />

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Indicadores nacionais</h2>
      {indicadores === null ? (
        <CardGridSkeleton quantidade={5} />
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {nacionais.map((i) => (
            <IndicadorCard
              key={i.tipo}
              tipo={i.tipo}
              valor={i.atual?.valor ?? null}
              dataReferencia={i.atual?.data_referencia ?? null}
              tendencia={i.tendencia}
              automatizado={NACIONAIS_AUTOMATIZADOS.includes(i.tipo)}
              onClick={() => abrirHistorico(i.tipo)}
            />
          ))}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Preços locais (venda, aluguel e hospedagem por região)
        </h2>
        <div className="flex gap-1 rounded-full bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setAbaPrecos("tabela")}
            className={`rounded-full px-3 py-1 font-medium ${abaPrecos === "tabela" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Tabela
          </button>
          <button
            type="button"
            onClick={() => setAbaPrecos("grafico")}
            className={`rounded-full px-3 py-1 font-medium ${abaPrecos === "grafico" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            Gráfico de crescimento
          </button>
        </div>
      </div>

      {abaPrecos === "tabela" ? (
        precosLocais.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum preço local cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Localização</th>
                  <th className="px-4 py-3 font-medium">Segmento</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {precosLocais.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">{p.localizacao?.nome ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{p.segmento}</td>
                    <td className="px-4 py-3">{LABEL_TIPO_PRECO[p.tipo] ?? p.tipo}</td>
                    <td className="px-4 py-3">{p.valor_m2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                    <td className="px-4 py-3">{formatarData(p.data_referencia)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <GraficoCrescimentoPrecos localizacoes={localizacoes} />
        </div>
      )}

      <Modal aberto={modalAberto} titulo="Novo dado" onFechar={() => setModalAberto(false)}>
        <DadoForm
          localizacoes={localizacoes}
          onSucesso={() => {
            setModalAberto(false);
            carregar();
          }}
        />
      </Modal>

      <Modal
        aberto={modalImportarAberto}
        titulo="Importar planilha de preços"
        onFechar={() => setModalImportarAberto(false)}
        largura="max-w-2xl"
      >
        <ImportarPlanilhaModal onSucesso={carregar} />
      </Modal>

      <Modal
        aberto={modalResetarAberto}
        titulo="Resetar dados de mercado"
        onFechar={() => setModalResetarAberto(false)}
        largura="max-w-xl"
      >
        <ResetarDadosMercadoModal
          onSucesso={() => {
            setModalResetarAberto(false);
            carregar();
          }}
        />
      </Modal>

      <Modal
        aberto={modalSincronizarAberto}
        titulo="Sincronizar indicadores do Bacen"
        onFechar={() => setModalSincronizarAberto(false)}
        largura="max-w-xl"
      >
        {previa === null ? (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Selic, CDI, IPCA e IGP-M são buscados diretamente do Bacen (SGS). Escolha um período, confira os
              pontos encontrados e só depois lance no sistema.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="De">
                <input
                  className="input"
                  type="date"
                  value={dataInicialSync}
                  onChange={(e) => setDataInicialSync(e.target.value)}
                />
              </Field>
              <Field label="Até">
                <input
                  className="input"
                  type="date"
                  value={dataFinalSync}
                  onChange={(e) => setDataFinalSync(e.target.value)}
                />
              </Field>
            </div>
            {erroSync && <p className="mt-4 text-sm text-red-600">{erroSync}</p>}
            {resultadoSync && <p className="mt-4 text-sm text-emerald-600">{resultadoSync}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={buscarPreview} disabled={sincronizando}>
                {sincronizando ? "Buscando..." : "Buscar período"}
              </Button>
              <Button variant="outline" onClick={sincronizarRapido} disabled={sincronizando}>
                Só lançar o dado mais recente
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {previa.length} ponto(s) encontrado(s) no Bacen para o período. Confira e clique em &ldquo;Lançar&rdquo;
              para gravar no sistema.
            </p>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-gray-100 bg-gray-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Indicador</th>
                    <th className="px-3 py-2 font-medium">Data</th>
                    <th className="px-3 py-2 font-medium">Valor (% a.a.)</th>
                  </tr>
                </thead>
                <tbody>
                  {previa.map((p, i) => (
                    <tr key={`${p.indicador}-${p.dataReferencia}-${i}`} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-2">{LABEL_INDICADOR[p.indicador] ?? p.indicador}</td>
                      <td className="px-3 py-2">{formatarData(p.dataReferencia)}</td>
                      <td className="px-3 py-2">{(p.valor * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {erroSync && <p className="mt-4 text-sm text-red-600">{erroSync}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={lancarPreview} disabled={lancando}>
                {lancando ? "Lançando..." : `Lançar ${previa.length} dado(s)`}
              </Button>
              <Button variant="outline" onClick={() => setPrevia(null)} disabled={lancando}>
                Voltar
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        aberto={historicoTipo !== null}
        titulo={`Histórico — ${historicoTipo?.toUpperCase()}`}
        onFechar={() => setHistoricoTipo(null)}
        largura="max-w-2xl"
      >
        {historico.length === 0 ? (
          <p className="text-sm text-slate-400">Sem histórico suficiente para exibir o gráfico.</p>
        ) : (
          <TrendChart
            titulo=""
            series={[{ key: "valor", label: historicoTipo?.toUpperCase() ?? "", color: "#1d4ed8" }]}
            dados={historico}
          />
        )}
      </Modal>
    </div>
  );
}
