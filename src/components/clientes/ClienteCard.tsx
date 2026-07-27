"use client";

import { Flame } from "lucide-react";
import { estaEsfriando } from "@/lib/engine";
import { ETAPAS_FUNIL, LABEL_ETAPA_FUNIL, LABEL_ESTRATEGIA_SAIDA } from "@/types/dominio";
import type { Cliente } from "@/types/dominio";

const LABEL_PERFIL: Record<string, string> = {
  primeira_moradia: "Primeira moradia",
  investidor: "Investidor",
  troca_imovel: "Troca de imóvel",
};

export function ClienteCard({
  cliente,
  onClick,
  onMover,
}: {
  cliente: Cliente;
  onClick: () => void;
  onMover: (etapa: (typeof ETAPAS_FUNIL)[number]) => void;
}) {
  const esfriando = estaEsfriando(cliente.ultimaInteracaoEm ?? null);

  return (
    <div className="w-full rounded-lg border-l-4 border-blue-700 bg-gray-100 p-3 text-left">
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-900">{cliente.nome}</p>
          {esfriando && (
            <span title="Sem interação recente" className="text-amber-500">
              <Flame size={14} />
            </span>
          )}
        </div>
        {cliente.telefone && <p className="text-sm text-slate-600">{cliente.telefone}</p>}
        {cliente.email && <p className="truncate text-sm text-slate-600">{cliente.email}</p>}
        {cliente.perfil && <p className="text-xs text-slate-500">{LABEL_PERFIL[cliente.perfil] ?? cliente.perfil}</p>}
        {cliente.estrategia_saida && (
          <p className="text-xs text-slate-500">
            {LABEL_ESTRATEGIA_SAIDA[cliente.estrategia_saida as keyof typeof LABEL_ESTRATEGIA_SAIDA] ??
              cliente.estrategia_saida}
          </p>
        )}
        {cliente.imovelInteresse && (
          <p className="mt-1 truncate text-xs font-medium text-blue-700">{cliente.imovelInteresse.nome}</p>
        )}
      </button>
      <select
        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-slate-600"
        value={cliente.etapa_funil}
        onChange={(e) => onMover(e.target.value as (typeof ETAPAS_FUNIL)[number])}
        onClick={(e) => e.stopPropagation()}
      >
        {ETAPAS_FUNIL.map((etapa) => (
          <option key={etapa} value={etapa}>
            {LABEL_ETAPA_FUNIL[etapa]}
          </option>
        ))}
      </select>
    </div>
  );
}
