"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PlaceholderIllustration } from "@/components/PlaceholderIllustration";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { LABEL_STATUS_EMPREENDIMENTO } from "@/types/dominio";
import type { Construtora, Empreendimento } from "@/types/dominio";

export function ConstrutoraCard({
  construtora,
  editavel,
  onEditar,
}: {
  construtora: Construtora;
  editavel: boolean;
  onEditar: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[] | null>(null);

  async function alternar() {
    const abrir = !expandido;
    setExpandido(abrir);
    if (abrir && empreendimentos === null) {
      const res = await fetch(`/api/construtoras/${construtora.id}`);
      const data = await res.json();
      setEmpreendimentos(data.empreendimentos ?? []);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={editavel ? onEditar : undefined} className="flex flex-1 items-center gap-3 text-left">
          <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-200">
            <PlaceholderIllustration className="h-full w-full" />
          </span>
          <span className="text-lg font-semibold text-slate-900">{construtora.nome}</span>
        </button>
        <button
          type="button"
          onClick={alternar}
          aria-label="Ver empreendimentos"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100"
        >
          {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div className="mt-3 space-y-0.5 text-sm text-slate-600">
        <p>{construtora.ano_fundacao ? `No mercado desde ${construtora.ano_fundacao}` : "Ano de fundação não informado"}</p>
        <p>{construtora.numeroEmpreendimentosAtivos ?? 0} empreendimento(s) ativo(s)</p>
        <p>
          Entregas no prazo:{" "}
          {construtora.percentualEntregasNoPrazo === null || construtora.percentualEntregasNoPrazo === undefined
            ? "sem histórico"
            : formatarPercentual(construtora.percentualEntregasNoPrazo, 0)}
        </p>
      </div>

      {expandido && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          {empreendimentos === null && <p className="text-sm text-slate-400">Carregando...</p>}
          {empreendimentos?.length === 0 && <p className="text-sm text-slate-400">Nenhum empreendimento vinculado.</p>}
          <ul className="space-y-2">
            {empreendimentos?.map((e) => (
              <li key={e.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-800">{e.nome}</span>
                <span className="text-slate-500">
                  {formatarMoeda(e.preco_total)} · {LABEL_STATUS_EMPREENDIMENTO[e.status] ?? e.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
