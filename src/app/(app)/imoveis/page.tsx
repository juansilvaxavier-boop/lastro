"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, SlidersHorizontal, Home, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmpreendimentoCard } from "@/components/imoveis/EmpreendimentoCard";
import { EmpreendimentoForm } from "@/components/imoveis/EmpreendimentoForm";
import { useUsuario, podeEditar } from "@/components/UsuarioContext";
import type { Empreendimento, Construtora, Localizacao } from "@/types/dominio";

export default function ImoveisPage() {
  const usuario = useUsuario();
  const editavel = podeEditar(usuario.papel);

  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[] | null>(null);
  const [construtoras, setConstrutoras] = useState<Construtora[]>([]);
  const [bairros, setBairros] = useState<Localizacao[]>([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [status, setStatus] = useState("");
  const [construtoraId, setConstrutoraId] = useState("");
  const [modalAberto, setModalAberto] = useState<"novo" | Empreendimento | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Empreendimento | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (construtoraId) query.set("construtoraId", construtoraId);
    const res = await fetch(`/api/empreendimentos?${query}`);
    const data = await res.json();
    setEmpreendimentos(data.empreendimentos ?? []);
  }, [status, construtoraId]);

  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  useEffect(() => {
    fetch("/api/construtoras")
      .then((r) => r.json())
      .then((d) => setConstrutoras(d.construtoras ?? []));
    fetch("/api/localizacoes?tipo=bairro")
      .then((r) => r.json())
      .then((d) => setBairros(d.localizacoes ?? []));
  }, []);

  async function favoritar(id: string) {
    await fetch("/api/favoritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ empreendimentoId: id }),
    });
    carregar();
  }

  async function duplicar(id: string) {
    await fetch(`/api/empreendimentos/${id}/duplicar`, { method: "POST" });
    carregar();
  }

  async function excluir() {
    if (!paraExcluir) return;
    setExcluindo(true);
    await fetch(`/api/empreendimentos/${paraExcluir.id}`, { method: "DELETE" });
    setExcluindo(false);
    setParaExcluir(null);
    carregar();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Controle de Imóveis</h1>
        <div className="flex gap-3">
          {editavel && (
            <Button onClick={() => setModalAberto("novo")}>
              <Plus size={16} /> Novo imóvel
            </Button>
          )}
          <Button variant="outline" onClick={() => setFiltrosAbertos((v) => !v)}>
            <SlidersHorizontal size={16} /> Filtros
          </Button>
        </div>
      </div>

      {filtrosAbertos && (
        <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white p-4">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="lancamento">Lançamento</option>
            <option value="em_obra">Em obra</option>
            <option value="pronto">Pronto</option>
          </select>
          <select className="input" value={construtoraId} onChange={(e) => setConstrutoraId(e.target.value)}>
            <option value="">Todas as construtoras</option>
            {construtoras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {empreendimentos === null && <CardGridSkeleton />}

      {empreendimentos !== null && empreendimentos.length === 0 && (
        <EmptyState
          icon={Home}
          titulo="Nenhum imóvel cadastrado"
          descricao="Cadastre o primeiro empreendimento para começar a acompanhar tendências e montar propostas."
          acao={
            editavel && (
              <Button onClick={() => setModalAberto("novo")}>
                <Plus size={16} /> Novo imóvel
              </Button>
            )
          }
        />
      )}

      {empreendimentos !== null && empreendimentos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {empreendimentos.map((e) => (
            <div key={e.id}>
              <EmpreendimentoCard
                empreendimento={e}
                onFavoritar={favoritar}
                onClick={() => editavel && setModalAberto(e)}
              />
              {editavel && (
                <div className="mt-1 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => duplicar(e.id)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-gray-100"
                  >
                    <Copy size={13} /> Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => setParaExcluir(e)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        aberto={modalAberto !== null}
        titulo={modalAberto === "novo" ? "Novo imóvel" : "Editar imóvel"}
        onFechar={() => setModalAberto(null)}
        largura="max-w-2xl"
      >
        <EmpreendimentoForm
          construtoras={construtoras}
          bairros={bairros}
          empreendimento={modalAberto === "novo" ? undefined : (modalAberto ?? undefined)}
          onSucesso={() => {
            setModalAberto(null);
            carregar();
          }}
        />
      </Modal>

      <ConfirmDialog
        aberto={paraExcluir !== null}
        titulo="Excluir imóvel"
        descricao={`Tem certeza que deseja excluir "${paraExcluir?.nome}"? Essa ação não pode ser desfeita.`}
        confirmando={excluindo}
        onConfirmar={excluir}
        onCancelar={() => setParaExcluir(null)}
      />
    </div>
  );
}
