"use client";

import { useState } from "react";

export interface ItemComparavel {
  id: string;
  nome: string;
  bairro: string;
  preco: number;
  scoreValorizacao: number | null;
  scoreRenda: number | null;
  scoreEncaixe: number | null;
  yieldLiquidoAnual: number | null;
}

const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);
const nota = (v: number | null) => (v == null ? "—" : v.toFixed(0));

const MAX_SELECAO = 4;

export function ComparadorClient({ itens }: { itens: ItemComparavel[] }) {
  const [selecionados, setSelecionados] = useState<string[]>([]);

  function alternar(id: string) {
    setSelecionados((atual) => {
      if (atual.includes(id)) return atual.filter((i) => i !== id);
      if (atual.length >= MAX_SELECAO) return atual;
      return [...atual, id];
    });
  }

  const escolhidos = itens.filter((i) => selecionados.includes(i.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Comparativo lado a lado</h1>
        <p className="text-sm text-slate-500">Selecione até {MAX_SELECAO} empreendimentos para comparar.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((item) => {
          const marcado = selecionados.includes(item.id);
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                marcado ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <input type="checkbox" checked={marcado} onChange={() => alternar(item.id)} className="mt-1" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{item.bairro}</p>
                <p className="font-semibold text-slate-900">{item.nome}</p>
                <p className="text-sm text-slate-500">{moeda(item.preco)}</p>
              </div>
            </label>
          );
        })}
      </div>

      {escolhidos.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Métrica</th>
                {escolhidos.map((i) => (
                  <th key={i.id} className="px-4 py-3">
                    {i.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <LinhaComparativa titulo="Bairro" valores={escolhidos.map((i) => i.bairro)} />
              <LinhaComparativa titulo="Preço" valores={escolhidos.map((i) => moeda(i.preco))} />
              <LinhaComparativa titulo="Score valorização" valores={escolhidos.map((i) => nota(i.scoreValorizacao))} />
              <LinhaComparativa titulo="Score renda" valores={escolhidos.map((i) => nota(i.scoreRenda))} />
              <LinhaComparativa titulo="Encaixe" valores={escolhidos.map((i) => nota(i.scoreEncaixe))} />
              <LinhaComparativa titulo="Yield líquido anual" valores={escolhidos.map((i) => pct(i.yieldLiquidoAnual))} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LinhaComparativa({ titulo, valores }: { titulo: string; valores: string[] }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 font-medium text-slate-700">{titulo}</td>
      {valores.map((v, idx) => (
        <td key={idx} className="px-4 py-3 text-slate-900">
          {v}
        </td>
      ))}
    </tr>
  );
}
