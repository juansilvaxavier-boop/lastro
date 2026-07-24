"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, MapPin, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LocalizacaoForm } from "@/components/regioes/LocalizacaoForm";
import { useUsuario, podeEditar } from "@/components/UsuarioContext";
import { formatarPercentual } from "@/lib/format";
import type { Localizacao, PrecoMercadoLocal } from "@/types/dominio";

export default function RegioesPage() {
  const usuario = useUsuario();
  const editavel = podeEditar(usuario.papel);

  const [localizacoes, setLocalizacoes] = useState<Localizacao[] | null>(null);
  const [caminho, setCaminho] = useState<Localizacao[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [precos, setPrecos] = useState<PrecoMercadoLocal[]>([]);

  const carregar = useCallback(async () => {
    const res = await fetch("/api/localizacoes");
    const data = await res.json();
    setLocalizacoes(data.localizacoes ?? []);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregar);
  }, [carregar]);

  const nivelAtual = caminho[caminho.length - 1] ?? null;

  const filhos = useMemo(() => {
    if (!localizacoes) return [];
    return localizacoes
      .filter((l) => l.parent_id === (nivelAtual?.id ?? null))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [localizacoes, nivelAtual]);

  useEffect(() => {
    if (nivelAtual && (nivelAtual.tipo === "bairro" || nivelAtual.tipo === "cidade")) {
      fetch(`/api/precos-mercado?localizacaoId=${nivelAtual.id}`)
        .then((r) => r.json())
        .then((d) => setPrecos(d.precos ?? []));
    } else {
      Promise.resolve().then(() => setPrecos([]));
    }
  }, [nivelAtual]);

  const precoVenda = precos.filter((p) => p.tipo === "venda").at(-1);
  const precoAluguel = precos.filter((p) => p.tipo === "aluguel").at(-1);
  const yieldEstimado =
    precoVenda && precoAluguel ? (precoAluguel.valor_m2 * 12) / precoVenda.valor_m2 : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Cadastro de estados, regiões, cidades e bairros</h1>
        {editavel && (
          <Button onClick={() => setModalAberto(true)}>
            <Plus size={16} /> Novo cadastro
          </Button>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <button type="button" onClick={() => setCaminho([])} className="hover:text-slate-900">
          Início
        </button>
        {caminho.map((item, i) => (
          <span key={item.id} className="flex items-center gap-1">
            <ChevronRight size={14} />
            <button type="button" onClick={() => setCaminho(caminho.slice(0, i + 1))} className="hover:text-slate-900">
              {item.nome}
            </button>
          </span>
        ))}
      </div>

      {nivelAtual && (nivelAtual.tipo === "bairro" || nivelAtual.tipo === "cidade") && (precoVenda || precoAluguel) && (
        <div className="mb-5 flex flex-wrap gap-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
          {precoVenda && <p><span className="text-slate-500">Preço médio/m²: </span><span className="font-semibold">{precoVenda.valor_m2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></p>}
          {precoAluguel && <p><span className="text-slate-500">Aluguel médio/m²: </span><span className="font-semibold">{precoAluguel.valor_m2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></p>}
          {yieldEstimado !== null && <p><span className="text-slate-500">Yield estimado: </span><span className="font-semibold">{formatarPercentual(yieldEstimado, 1)}</span></p>}
        </div>
      )}

      {localizacoes === null && <CardGridSkeleton />}

      {localizacoes !== null && filhos.length === 0 && (
        <EmptyState
          icon={MapPin}
          titulo={nivelAtual ? `Nada cadastrado em ${nivelAtual.nome}` : "Nenhuma localização cadastrada"}
          descricao="Cadastre estados, regiões, cidades e bairros para organizar os imóveis por localização."
          acao={
            editavel && (
              <Button onClick={() => setModalAberto(true)}>
                <Plus size={16} /> Novo cadastro
              </Button>
            )
          }
        />
      )}

      {localizacoes !== null && filhos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {filhos.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setCaminho([...caminho, l])}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 text-left hover:border-blue-300"
            >
              <span className="text-lg font-medium text-slate-900">{l.nome}</span>
              {l.tipo !== "bairro" && <ChevronRight size={18} className="text-slate-400" />}
            </button>
          ))}
        </div>
      )}

      <Modal aberto={modalAberto} titulo="Novo cadastro" onFechar={() => setModalAberto(false)}>
        <LocalizacaoForm
          paisagem={localizacoes ?? []}
          parentSugerido={nivelAtual}
          onSucesso={() => {
            setModalAberto(false);
            carregar();
          }}
        />
      </Modal>
    </div>
  );
}
