"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CalibracaoForm({ empreendimentoId }: { empreendimentoId: string }) {
  const router = useRouter();
  const [mesesDepois, setMesesDepois] = useState<"6" | "12">("6");
  const [projecaoValorizacao, setProjecaoValorizacao] = useState("");
  const [valorizacaoRealizada, setValorizacaoRealizada] = useState("");
  const [projecaoRenda, setProjecaoRenda] = useState("");
  const [rendaRealizada, setRendaRealizada] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function paraNumero(v: string): number | undefined {
    if (v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const res = await fetch(`/api/admin/empreendimentos/${empreendimentoId}/calibracao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mesesDepois: Number(mesesDepois),
        projecaoValorizacaoPct: paraNumero(projecaoValorizacao),
        valorizacaoRealizadaPct: paraNumero(valorizacaoRealizada),
        projecaoRenda: paraNumero(projecaoRenda),
        rendaRealizada: paraNumero(rendaRealizada),
        observacoes: observacoes || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(typeof data.error === "string" ? data.error : "Erro ao salvar.");
      setEnviando(false);
      return;
    }

    setProjecaoValorizacao("");
    setValorizacaoRealizada("");
    setProjecaoRenda("");
    setRendaRealizada("");
    setObservacoes("");
    setEnviando(false);
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">Nova medição de calibração</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Meses depois
          <select value={mesesDepois} onChange={(e) => setMesesDepois(e.target.value as "6" | "12")} className="input">
            <option value="6">6 meses</option>
            <option value="12">12 meses</option>
          </select>
        </label>
        <span />
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Projeção de valorização (%)
          <input type="number" value={projecaoValorizacao} onChange={(e) => setProjecaoValorizacao(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Valorização realizada (%)
          <input type="number" value={valorizacaoRealizada} onChange={(e) => setValorizacaoRealizada(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Projeção de renda (R$/mês)
          <input type="number" value={projecaoRenda} onChange={(e) => setProjecaoRenda(e.target.value)} className="input" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Renda realizada (R$/mês)
          <input type="number" value={rendaRealizada} onChange={(e) => setRendaRealizada(e.target.value)} className="input" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-slate-600">
        Observações
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="input" />
      </label>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {enviando ? "Salvando..." : "Registrar medição"}
      </button>
    </form>
  );
}
