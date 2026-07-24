"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { IndicadorCard } from "@/components/dados/IndicadorCard";
import { DadoForm } from "@/components/dados/DadoForm";
import { TrendChart } from "@/components/TrendChart";
import { useUsuario, podeEditar } from "@/components/UsuarioContext";
import { formatarData } from "@/lib/format";
import type { Localizacao, PrecoMercadoLocal } from "@/types/dominio";

interface IndicadorResumo {
  tipo: string;
  atual: { valor: number; data_referencia: string } | null;
  tendencia: "alta" | "queda" | null;
}

const NACIONAIS_AUTOMATIZADOS = ["selic", "cdi", "ipca", "igpm"];

export default function DadosPage() {
  const usuario = useUsuario();
  const editavel = podeEditar(usuario.papel);

  const [indicadores, setIndicadores] = useState<IndicadorResumo[] | null>(null);
  const [precosLocais, setPrecosLocais] = useState<PrecoMercadoLocal[]>([]);
  const [localizacoes, setLocalizacoes] = useState<Localizacao[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
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

  async function sincronizar() {
    setSincronizando(true);
    await fetch("/api/jobs/sync-bacen");
    setSincronizando(false);
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
            Selic, Inflação (IPCA), INCC (correção durante a obra), Preço médio por m² (venda residencial) e Aluguel,
            IGP-M e CDI
          </p>
        </div>
        <div className="flex gap-3">
          {editavel && (
            <Button onClick={() => setModalAberto(true)}>
              <Plus size={16} /> Novo dado
            </Button>
          )}
          <Button variant="outline" onClick={sincronizar} disabled={sincronizando}>
            <RefreshCw size={16} className={sincronizando ? "animate-spin" : ""} /> Sincronizar agora
          </Button>
        </div>
      </div>

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

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Preços locais (venda e aluguel por região)
      </h2>
      {precosLocais.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum preço local cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Localização</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Valor/m²</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {precosLocais.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3">{p.localizacao?.nome ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{p.tipo}</td>
                  <td className="px-4 py-3">{p.valor_m2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                  <td className="px-4 py-3">{formatarData(p.data_referencia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
