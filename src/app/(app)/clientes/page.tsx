"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, SlidersHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClienteCard } from "@/components/clientes/ClienteCard";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { InteracoesPainel } from "@/components/clientes/InteracoesPainel";
import { ETAPAS_FUNIL, LABEL_ETAPA_FUNIL } from "@/types/dominio";
import type { Cliente, Usuario, Empreendimento } from "@/types/dominio";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [corretorId, setCorretorId] = useState("");
  const [empreendimentoId, setEmpreendimentoId] = useState("");
  const [modalAberto, setModalAberto] = useState<"novo" | Cliente | null>(null);

  const carregar = useCallback(async () => {
    const query = new URLSearchParams();
    if (corretorId) query.set("corretorId", corretorId);
    if (empreendimentoId) query.set("empreendimentoId", empreendimentoId);
    const res = await fetch(`/api/clientes?${query}`);
    const data = await res.json();
    setClientes(data.clientes ?? []);
  }, [corretorId, empreendimentoId]);

  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((d) => setUsuarios(d.usuarios ?? []));
    fetch("/api/empreendimentos")
      .then((r) => r.json())
      .then((d) => setEmpreendimentos(d.empreendimentos ?? []));
  }, []);

  async function mover(clienteId: string, etapa: (typeof ETAPAS_FUNIL)[number]) {
    setClientes((atual) =>
      atual ? atual.map((c) => (c.id === clienteId ? { ...c, etapa_funil: etapa } : c)) : atual
    );
    await fetch(`/api/clientes/${clienteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ etapaFunil: etapa }),
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Customer Relationship Management (CRM)</h1>
        <div className="flex gap-3">
          <Button onClick={() => setModalAberto("novo")}>
            <Plus size={16} /> Novo cliente
          </Button>
          <Button variant="outline" onClick={() => setFiltrosAbertos((v) => !v)}>
            <SlidersHorizontal size={16} /> Filtros
          </Button>
        </div>
      </div>

      {filtrosAbertos && (
        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white p-4">
          <select className="input" value={corretorId} onChange={(e) => setCorretorId(e.target.value)}>
            <option value="">Todos os corretores</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome ?? u.email}
              </option>
            ))}
          </select>
          <select className="input" value={empreendimentoId} onChange={(e) => setEmpreendimentoId(e.target.value)}>
            <option value="">Todos os imóveis</option>
            {empreendimentos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {clientes !== null && clientes.length === 0 && !corretorId && !empreendimentoId && (
        <EmptyState
          icon={Users}
          titulo="Nenhum cliente cadastrado"
          descricao="Cadastre o primeiro lead para começar a acompanhar o funil de vendas."
          acao={
            <Button onClick={() => setModalAberto("novo")}>
              <Plus size={16} /> Novo cliente
            </Button>
          }
        />
      )}

      {clientes !== null && (clientes.length > 0 || corretorId || empreendimentoId) && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS_FUNIL.map((etapa) => {
            const doEtapa = clientes.filter((c) => c.etapa_funil === etapa);
            return (
              <div key={etapa} className="w-72 shrink-0">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">{LABEL_ETAPA_FUNIL[etapa]}</h2>
                  <span className="rounded-full bg-blue-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {String(doEtapa.length).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {doEtapa.map((cliente) => (
                    <ClienteCard
                      key={cliente.id}
                      cliente={cliente}
                      onClick={() => setModalAberto(cliente)}
                      onMover={(novaEtapa) => mover(cliente.id, novaEtapa)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        aberto={modalAberto !== null}
        titulo={modalAberto === "novo" ? "Novo cliente" : "Editar cliente"}
        onFechar={() => setModalAberto(null)}
        largura="max-w-2xl"
      >
        <ClienteForm
          usuarios={usuarios}
          empreendimentos={empreendimentos}
          cliente={modalAberto === "novo" ? undefined : (modalAberto ?? undefined)}
          onSucesso={() => {
            setModalAberto(null);
            carregar();
          }}
        />
        {modalAberto !== "novo" && modalAberto !== null && <InteracoesPainel clienteId={modalAberto.id} />}
      </Modal>
    </div>
  );
}
