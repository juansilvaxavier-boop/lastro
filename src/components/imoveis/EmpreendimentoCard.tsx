"use client";

import { Bookmark } from "lucide-react";
import { PlaceholderIllustration } from "@/components/PlaceholderIllustration";
import { formatarMoeda, formatarData, formatarPercentual } from "@/lib/format";
import { LABEL_STATUS_EMPREENDIMENTO } from "@/types/dominio";
import type { Empreendimento } from "@/types/dominio";

const COR_STATUS: Record<string, string> = {
  lancamento: "bg-blue-100 text-blue-700",
  em_obra: "bg-amber-100 text-amber-700",
  pronto: "bg-green-100 text-green-700",
};

export function EmpreendimentoCard({
  empreendimento,
  onFavoritar,
  onClick,
}: {
  empreendimento: Empreendimento;
  onFavoritar?: (id: string) => void;
  onClick?: () => void;
}) {
  const e = empreendimento;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <button type="button" onClick={onClick} className="block w-full text-left">
        <h3 className="mb-2 truncate text-lg font-semibold text-slate-900">{e.nome}</h3>
        <div className="h-32 w-full overflow-hidden rounded-xl">
          {e.imagem_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={e.imagem_url} alt={e.nome} className="h-full w-full object-cover" />
          ) : (
            <PlaceholderIllustration className="h-full w-full" />
          )}
        </div>
      </button>

      <div className="mt-3 flex items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COR_STATUS[e.status] ?? "bg-gray-100 text-gray-700"}`}>
          {LABEL_STATUS_EMPREENDIMENTO[e.status] ?? e.status}
        </span>
        {e.percentual_vendido !== null && (
          <span className="text-xs text-slate-500">{formatarPercentual(e.percentual_vendido, 0)} vendido</span>
        )}
      </div>

      <div className="mt-2 space-y-0.5 text-sm text-slate-600">
        <p className="font-medium text-slate-900">{formatarMoeda(e.preco_total)}</p>
        <p>{e.bairro?.nome ?? "Localização não informada"}</p>
        <p>Entrega: {formatarData(e.data_entrega_prevista)}</p>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onFavoritar?.(e.id)}
          aria-label="Favoritar"
          className={`rounded-lg p-1.5 hover:bg-gray-100 ${e.favoritado ? "text-blue-700" : "text-slate-400"}`}
        >
          <Bookmark size={18} fill={e.favoritado ? "currentColor" : "none"} />
        </button>
      </div>
    </div>
  );
}
