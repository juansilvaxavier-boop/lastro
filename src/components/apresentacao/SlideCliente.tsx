"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { paraNumero } from "@/lib/format";
import { ESTRATEGIAS_SAIDA, LABEL_ESTRATEGIA_SAIDA } from "@/types/dominio";
import type { Cliente } from "@/types/dominio";

export function SlideCliente({
  clienteId,
  onClienteEscolhido,
}: {
  clienteId: string | null;
  onClienteEscolhido: (id: string) => void;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [modo, setModo] = useState<"existente" | "novo">("novo");
  const [nome, setNome] = useState("");
  const [valorEntradaDisponivel, setValorEntradaDisponivel] = useState("");
  const [parcelaMaximaMensal, setParcelaMaximaMensal] = useState("");
  const [estrategiaSaida, setEstrategiaSaida] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clientes")
      .then((r) => r.json())
      .then((d) => setClientes(d.clientes ?? []));
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nome,
        valorEntradaDisponivel: paraNumero(valorEntradaDisponivel) ?? null,
        parcelaMaximaMensal: paraNumero(parcelaMaximaMensal) ?? null,
        estrategiaSaida: estrategiaSaida || null,
      }),
    });
    setEnviando(false);
    if (!res.ok) {
      setErro("Não foi possível salvar. Confira os campos.");
      return;
    }
    const data = await res.json();
    onClienteEscolhido(data.cliente.id);
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Dados do cliente</h1>
      <div className="mb-5 flex w-fit gap-2 rounded-full bg-gray-100 p-1 text-sm">
        <button
          type="button"
          onClick={() => setModo("novo")}
          className={`rounded-full px-3 py-1 font-medium ${modo === "novo" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          Novo cliente
        </button>
        <button
          type="button"
          onClick={() => setModo("existente")}
          className={`rounded-full px-3 py-1 font-medium ${modo === "existente" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          Cliente existente
        </button>
      </div>

      {modo === "existente" ? (
        <Field label="Selecione o cliente" className="max-w-lg">
          <select
            className="input"
            value={clienteId ?? ""}
            onChange={(e) => onClienteEscolhido(e.target.value)}
          >
            <option value="">Selecione...</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
      ) : (
        <form onSubmit={criar} className="flex max-w-lg flex-col gap-4">
          <Field label="Nome">
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Entrada disponível (R$)">
              <input
                className="input"
                type="number"
                value={valorEntradaDisponivel}
                onChange={(e) => setValorEntradaDisponivel(e.target.value)}
              />
            </Field>
            <Field label="Parcela máxima (R$/mês)">
              <input
                className="input"
                type="number"
                value={parcelaMaximaMensal}
                onChange={(e) => setParcelaMaximaMensal(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Estratégia de saída">
            <select className="input" value={estrategiaSaida} onChange={(e) => setEstrategiaSaida(e.target.value)}>
              <option value="">—</option>
              {ESTRATEGIAS_SAIDA.map((e) => (
                <option key={e} value={e}>
                  {LABEL_ESTRATEGIA_SAIDA[e]}
                </option>
              ))}
            </select>
          </Field>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          <Button type="submit" disabled={enviando} className="w-fit">
            {enviando ? "Salvando..." : "Salvar e continuar"}
          </Button>
        </form>
      )}

      {clienteId && (
        <p className="mt-4 text-sm text-emerald-600">Cliente selecionado — avance para ver a recomendação.</p>
      )}
    </div>
  );
}
