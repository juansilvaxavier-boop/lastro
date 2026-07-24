"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { formatarData } from "@/lib/format";
import type { Interacao } from "@/types/dominio";

const LABEL_TIPO: Record<string, string> = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  reuniao: "Reunião",
  visita: "Visita",
};

export function InteracoesPainel({ clienteId }: { clienteId: string }) {
  const [interacoes, setInteracoes] = useState<Interacao[] | null>(null);
  const [tipo, setTipo] = useState("ligacao");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function carregar() {
    const res = await fetch(`/api/clientes/${clienteId}/interacoes`);
    const data = await res.json();
    setInteracoes(data.interacoes ?? []);
  }

  useEffect(() => {
    void Promise.resolve().then(carregar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    await fetch(`/api/clientes/${clienteId}/interacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, observacao: observacao || undefined }),
    });
    setEnviando(false);
    setObservacao("");
    carregar();
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Histórico de interações</h3>

      <form onSubmit={registrar} className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="Tipo" className="w-40">
          <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="ligacao">Ligação</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
            <option value="reuniao">Reunião</option>
            <option value="visita">Visita</option>
          </select>
        </Field>
        <Field label="Observação" className="flex-1">
          <input className="input" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
        </Field>
        <Button type="submit" disabled={enviando}>
          Registrar
        </Button>
      </form>

      {interacoes === null && <p className="text-sm text-slate-400">Carregando...</p>}
      {interacoes?.length === 0 && <p className="text-sm text-slate-400">Nenhuma interação registrada.</p>}
      <ul className="space-y-3">
        {interacoes?.map((i) => (
          <li key={i.id} className="text-sm">
            <span className="font-medium text-slate-800">{LABEL_TIPO[i.tipo] ?? i.tipo}</span>{" "}
            <span className="text-slate-400">— {formatarData(i.data)}</span>
            {i.observacao && <p className="text-slate-600">{i.observacao}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
