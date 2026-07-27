"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SlideCenarioMacro } from "./SlideCenarioMacro";
import { SlideCidade } from "./SlideCidade";
import { SlideMapa } from "./SlideMapa";
import { SlideCasosSucesso } from "./SlideCasosSucesso";
import { SlideCliente } from "./SlideCliente";
import { SlideRecomendacao } from "./SlideRecomendacao";
import type { Localizacao } from "@/types/dominio";

const ETAPAS = [
  "Cenário de mercado",
  "A cidade",
  "Mapa e bairros",
  "Casos de sucesso",
  "Dados do cliente",
  "Recomendação",
] as const;

export function ApresentacaoClient() {
  const [cidades, setCidades] = useState<Localizacao[]>([]);
  const [cidadeId, setCidadeId] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(0);

  useEffect(() => {
    fetch("/api/localizacoes?tipo=cidade")
      .then((r) => r.json())
      .then((d) => setCidades(d.localizacoes ?? []));
  }, []);

  const cidade = cidades.find((l) => l.id === cidadeId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-slate-900">Lastro</span>
          <span className="text-sm text-slate-400">Modo apresentação</span>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input"
            value={cidadeId}
            onChange={(e) => {
              setCidadeId(e.target.value);
              setEtapa(0);
              setClienteId(null);
            }}
          >
            <option value="">Selecione a cidade...</option>
            {[...cidades]
              .sort((a, b) => a.nome.localeCompare(b.nome))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
          </select>
          <Link
            href="/tendencias"
            aria-label="Sair da apresentação"
            className="rounded-lg p-2 text-slate-400 hover:bg-gray-100 hover:text-slate-700"
          >
            <X size={20} />
          </Link>
        </div>
      </header>

      {cidade && (
        <div className="flex flex-wrap items-center justify-center gap-2 border-b border-gray-100 bg-white py-3">
          {ETAPAS.map((nome, i) => (
            <button
              key={nome}
              type="button"
              onClick={() => setEtapa(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i === etapa ? "bg-blue-700 text-white" : "bg-gray-100 text-slate-500"
              }`}
            >
              {i + 1}. {nome}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-6 py-8 sm:px-12">
        <div className="mx-auto max-w-5xl">
          {!cidade ? (
            <p className="mt-16 text-center text-lg text-slate-400">Selecione uma cidade acima para começar.</p>
          ) : (
            <>
              {etapa === 0 && <SlideCenarioMacro />}
              {etapa === 1 && <SlideCidade cidade={cidade} />}
              {etapa === 2 && <SlideMapa cidade={cidade} />}
              {etapa === 3 && <SlideCasosSucesso />}
              {etapa === 4 && <SlideCliente clienteId={clienteId} onClienteEscolhido={setClienteId} />}
              {etapa === 5 &&
                (clienteId ? (
                  <SlideRecomendacao clienteId={clienteId} />
                ) : (
                  <p className="text-slate-400">Informe os dados do cliente na etapa anterior primeiro.</p>
                ))}
            </>
          )}
        </div>
      </main>

      {cidade && (
        <footer className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => setEtapa((e) => Math.max(e - 1, 0))}
            disabled={etapa === 0}
            className="flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          <span className="text-sm text-slate-400">
            {etapa + 1} / {ETAPAS.length}
          </span>
          <button
            type="button"
            onClick={() => setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1))}
            disabled={etapa === ETAPAS.length - 1}
            className="flex items-center gap-1 rounded-full bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próximo <ChevronRight size={16} />
          </button>
        </footer>
      )}
    </div>
  );
}
