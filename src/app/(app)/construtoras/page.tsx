"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, HardHat } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConstrutoraCard } from "@/components/construtoras/ConstrutoraCard";
import { ConstrutoraForm } from "@/components/construtoras/ConstrutoraForm";
import { useUsuario, podeEditar } from "@/components/UsuarioContext";
import type { Construtora } from "@/types/dominio";

export default function ConstrutorasPage() {
  const usuario = useUsuario();
  const editavel = podeEditar(usuario.papel);

  const [construtoras, setConstrutoras] = useState<Construtora[] | null>(null);
  const [modalAberto, setModalAberto] = useState<"novo" | Construtora | null>(null);

  const carregar = useCallback(async () => {
    const res = await fetch("/api/construtoras");
    const data = await res.json();
    setConstrutoras(data.construtoras ?? []);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Cadastro de construtoras</h1>
        {editavel && (
          <Button onClick={() => setModalAberto("novo")}>
            <Plus size={16} /> Novo cadastro
          </Button>
        )}
      </div>

      {construtoras === null && <CardGridSkeleton />}

      {construtoras !== null && construtoras.length === 0 && (
        <EmptyState
          icon={HardHat}
          titulo="Nenhuma construtora cadastrada"
          descricao="Cadastre as construtoras parceiras para vincular seus empreendimentos."
          acao={
            editavel && (
              <Button onClick={() => setModalAberto("novo")}>
                <Plus size={16} /> Novo cadastro
              </Button>
            )
          }
        />
      )}

      {construtoras !== null && construtoras.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {construtoras.map((c) => (
            <ConstrutoraCard
              key={c.id}
              construtora={c}
              editavel={editavel}
              onEditar={() => setModalAberto(c)}
            />
          ))}
        </div>
      )}

      <Modal
        aberto={modalAberto !== null}
        titulo={modalAberto === "novo" ? "Nova construtora" : "Editar construtora"}
        onFechar={() => setModalAberto(null)}
      >
        <ConstrutoraForm
          construtora={modalAberto === "novo" ? undefined : (modalAberto ?? undefined)}
          onSucesso={() => {
            setModalAberto(null);
            carregar();
          }}
        />
      </Modal>
    </div>
  );
}
