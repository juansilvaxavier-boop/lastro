"use client";

import { useState } from "react";

export function WatchlistButtons({ empreendimentoId }: { empreendimentoId: string }) {
  const [status, setStatus] = useState<"salvo" | "descartado" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [mostrarMotivo, setMostrarMotivo] = useState(false);

  async function enviar(novoStatus: "salvo" | "descartado", motivoDescarte?: string) {
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empreendimentoId, status: novoStatus, motivoDescarte }),
    });
    if (res.ok) {
      setStatus(novoStatus);
      setMostrarMotivo(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => enviar("salvo")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            status === "salvo" ? "bg-emerald-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {status === "salvo" ? "Salvo na watchlist" : "Salvar na watchlist"}
        </button>
        <button
          onClick={() => setMostrarMotivo(true)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            status === "descartado" ? "bg-red-600 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          {status === "descartado" ? "Descartado" : "Descartar"}
        </button>
      </div>
      {mostrarMotivo && (
        <div className="flex gap-2">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por que descartar? (fica salvo para não reavaliar do zero)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
          />
          <button
            onClick={() => enviar("descartado", motivo)}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  );
}
