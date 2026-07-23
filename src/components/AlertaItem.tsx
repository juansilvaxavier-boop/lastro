"use client";

import Link from "next/link";
import { useState } from "react";

interface Props {
  id: string;
  titulo: string;
  mensagem: string;
  lido: boolean;
  empreendimentoId: string | null;
  criadoEm: string;
}

export function AlertaItem({ id, titulo, mensagem, lido: lidoInicial, empreendimentoId, criadoEm }: Props) {
  const [lido, setLido] = useState(lidoInicial);

  async function marcarComoLido() {
    setLido(true);
    await fetch("/api/alertas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const conteudo = (
    <div className={`rounded-lg border p-4 ${lido ? "border-slate-200 bg-white" : "border-slate-900 bg-slate-50"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{titulo}</p>
          <p className="text-sm text-slate-600">{mensagem}</p>
          <p className="mt-1 text-xs text-slate-400">{new Date(criadoEm).toLocaleString("pt-BR")}</p>
        </div>
        {!lido && (
          <button
            onClick={(e) => {
              e.preventDefault();
              marcarComoLido();
            }}
            className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
          >
            Marcar como lido
          </button>
        )}
      </div>
    </div>
  );

  return empreendimentoId ? (
    <Link href={`/dashboard/${empreendimentoId}`} onClick={() => !lido && marcarComoLido()}>
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
}
