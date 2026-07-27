"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatarData } from "@/lib/format";
import type { CenarioMacro } from "@/types/dominio";

export function CenarioMacroBloco({ editavel }: { editavel: boolean }) {
  const [cenario, setCenario] = useState<CenarioMacro | null | undefined>(undefined);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  function carregar() {
    fetch("/api/cenario-macro")
      .then((r) => r.json())
      .then((d) => setCenario(d.cenarioMacro ?? null));
  }

  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, []);

  async function salvar() {
    setEnviando(true);
    const res = await fetch("/api/cenario-macro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    setEnviando(false);
    if (res.ok) {
      setEditando(false);
      carregar();
    }
  }

  if (cenario === undefined) return null;

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Cenário macro (nacional/estadual)
        </h2>
        {editavel && !editando && (
          <button
            type="button"
            onClick={() => {
              setTexto(cenario?.texto ?? "");
              setEditando(true);
            }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700"
          >
            <Pencil size={13} /> Editar
          </button>
        )}
      </div>

      {editando ? (
        <div className="flex flex-col gap-3">
          <textarea
            className="input min-h-28"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex: Selic em trajetória de queda, mercado imobiliário aquecido no interior de SP, expectativa de..."
          />
          <div className="flex gap-3">
            <Button onClick={salvar} disabled={enviando || !texto.trim()}>
              {enviando ? "Salvando..." : "Salvar"}
            </Button>
            <Button variant="outline" onClick={() => setEditando(false)} disabled={enviando}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : cenario ? (
        <>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{cenario.texto}</p>
          <p className="mt-2 text-xs text-slate-400">Atualizado em {formatarData(cenario.criado_em)}</p>
        </>
      ) : (
        <p className="text-sm text-slate-400">
          Nenhuma leitura de mercado cadastrada ainda.{" "}
          {editavel && "Clique em Editar para escrever a leitura atual do cenário macro."}
        </p>
      )}
    </div>
  );
}
