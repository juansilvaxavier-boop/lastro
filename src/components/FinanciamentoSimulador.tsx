"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Termo } from "@/components/Termo";

interface ResultadoFinanciamento {
  sistema: "PRICE" | "SAC";
  valorFinanciado: number;
  parcelaInicial: number;
  parcelaFinal: number;
  totalPago: number;
  totalJuros: number;
  tabela: { mes: number; parcela: number; saldoDevedor: number }[];
}

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FinanciamentoSimulador({ empreendimentoId, preco }: { empreendimentoId: string; preco: number }) {
  const [valorEntrada, setValorEntrada] = useState(Math.round(preco * 0.2));
  const [numParcelas, setNumParcelas] = useState(360);
  const [taxaJurosAnual, setTaxaJurosAnual] = useState(0.11);
  const [sistema, setSistema] = useState<"PRICE" | "SAC">("SAC");
  const [resultado, setResultado] = useState<ResultadoFinanciamento | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function simular() {
    setCarregando(true);
    try {
      const res = await fetch("/api/financiamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empreendimentoId, valorEntrada, numParcelas, taxaJurosAnual, sistema }),
      });
      const data = await res.json();
      if (res.ok) setResultado(data.resultado);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Simulador de financiamento</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Entrada
          <input
            type="number"
            value={valorEntrada}
            onChange={(e) => setValorEntrada(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Parcelas (meses)
          <input
            type="number"
            value={numParcelas}
            onChange={(e) => setNumParcelas(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Taxa de juros anual
          <input
            type="number"
            step="0.001"
            value={taxaJurosAnual}
            onChange={(e) => setTaxaJurosAnual(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Sistema
          <select
            value={sistema}
            onChange={(e) => setSistema(e.target.value as "PRICE" | "SAC")}
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
          >
            <option value="SAC"><Termo termo="sistema sac">SAC</Termo></option>
            <option value="PRICE">PRICE</option>
          </select>
        </label>
      </div>

      <button
        onClick={simular}
        disabled={carregando}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {carregando ? "Calculando..." : "Simular"}
      </button>

      {resultado && (
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Stat label="1ª parcela" value={moeda(resultado.parcelaInicial)} />
            <Stat label="Última parcela" value={moeda(resultado.parcelaFinal)} />
            <Stat label="Total pago" value={moeda(resultado.totalPago)} />
            <Stat label="Total de juros" value={moeda(resultado.totalJuros)} />
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resultado.tabela.filter((_, i) => i % Math.ceil(resultado.tabela.length / 60 || 1) === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} label={{ value: "mês", position: "insideBottom", offset: -2, fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={70} tickFormatter={(v) => moeda(v)} />
                <Tooltip formatter={(v) => moeda(Number(v))} labelFormatter={(l) => `mês ${l}`} />
                <Line type="monotone" dataKey="parcela" stroke="#0f172a" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="saldoDevedor" stroke="#94a3b8" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
}
