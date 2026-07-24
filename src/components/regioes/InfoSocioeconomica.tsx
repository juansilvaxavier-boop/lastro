"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatarMoeda } from "@/lib/format";
import type { Localizacao } from "@/types/dominio";

function formatarNumero(valor: number | null, casas = 0): string {
  if (valor === null) return "—";
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

export function InfoSocioeconomica({
  localizacao,
  editavel,
  onAtualizado,
}: {
  localizacao: Localizacao;
  editavel: boolean;
  onAtualizado: () => void;
}) {
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const temDados =
    localizacao.populacao !== null || localizacao.area_km2 !== null || localizacao.pib_per_capita !== null;
  const densidade =
    localizacao.populacao && localizacao.area_km2 ? localizacao.populacao / localizacao.area_km2 : null;

  async function atualizar() {
    setAtualizando(true);
    setErro(null);
    const res = await fetch(`/api/localizacoes/${localizacao.id}/ibge`, { method: "POST" });
    const data = await res.json();
    setAtualizando(false);
    if (!res.ok) {
      setErro(data.error ?? "Não foi possível buscar os dados no IBGE.");
      return;
    }
    onAtualizado();
  }

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Informações socioeconômicas</h2>
        {editavel && (
          <Button variant="outline" onClick={atualizar} disabled={atualizando || !localizacao.codigo_ibge}>
            <RefreshCw size={14} className={atualizando ? "animate-spin" : ""} />
            {atualizando ? "Buscando..." : "Atualizar dados do IBGE"}
          </Button>
        )}
      </div>

      {!localizacao.codigo_ibge && editavel && (
        <p className="mb-3 text-sm text-amber-600">
          Cadastre o código IBGE do município (editando esta cidade) para poder buscar os dados automaticamente.
        </p>
      )}
      {erro && <p className="mb-3 text-sm text-red-600">{erro}</p>}

      {!temDados ? (
        <p className="text-sm text-slate-400">Nenhum dado do IBGE sincronizado ainda.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">
              População residente {localizacao.populacao_ano ? `(${localizacao.populacao_ano})` : ""}
            </p>
            <p className="text-lg font-semibold text-slate-900">{formatarNumero(localizacao.populacao)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Área territorial</p>
            <p className="text-lg font-semibold text-slate-900">
              {localizacao.area_km2 ? `${formatarNumero(localizacao.area_km2, 1)} km²` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Densidade demográfica</p>
            <p className="text-lg font-semibold text-slate-900">
              {densidade ? `${formatarNumero(densidade, 1)} hab/km²` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">
              PIB per capita {localizacao.pib_per_capita_ano ? `(${localizacao.pib_per_capita_ano})` : ""}
            </p>
            <p className="text-lg font-semibold text-slate-900">{formatarMoeda(localizacao.pib_per_capita)}</p>
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-400">Fonte: IBGE (SIDRA)</p>
    </div>
  );
}
