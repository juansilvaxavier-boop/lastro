"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function DescobrirBairrosModal({ cidadeId, onSucesso }: { cidadeId: string; onSucesso: () => void }) {
  const [buscando, setBuscando] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [nomes, setNomes] = useState<string[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  async function buscar() {
    setBuscando(true);
    setErro(null);
    const res = await fetch(`/api/localizacoes/${cidadeId}/bairros`);
    const data = await res.json();
    setBuscando(false);
    if (!res.ok) {
      setErro(data.error?.toString?.() ?? "Não foi possível buscar os bairros.");
      return;
    }
    setNomes(data.nomes);
    setSelecionados(new Set<string>(data.nomes));
  }

  function alternar(nome: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(nome)) novo.delete(nome);
      else novo.add(nome);
      return novo;
    });
  }

  async function cadastrar() {
    if (selecionados.size === 0) return;
    setCriando(true);
    setErro(null);
    const res = await fetch(`/api/localizacoes/${cidadeId}/bairros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomes: [...selecionados] }),
    });
    setCriando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error?.toString?.() ?? "Não foi possível cadastrar os bairros.");
      return;
    }
    onSucesso();
  }

  if (nomes === null) {
    return (
      <>
        <p className="mb-4 text-sm text-slate-500">
          Busca, num raio de ~15km ao redor da cidade, os bairros e distritos mapeados no OpenStreetMap. Você confere
          e escolhe quais cadastrar antes de gravar no sistema.
        </p>
        {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}
        <Button onClick={buscar} disabled={buscando}>
          <Search size={16} /> {buscando ? "Buscando..." : "Buscar bairros no mapa"}
        </Button>
      </>
    );
  }

  if (nomes.length === 0) {
    return <p className="text-sm text-slate-400">Nenhum bairro novo encontrado no mapa perto dessa cidade.</p>;
  }

  return (
    <>
      <p className="mb-3 text-sm text-slate-500">
        {nomes.length} bairro(s) encontrado(s) e ainda não cadastrado(s). Desmarque os que não quiser incluir.
      </p>
      <div className="mb-4 max-h-80 overflow-y-auto rounded-xl border border-gray-200 p-3">
        {nomes.map((nome) => (
          <label key={nome} className="flex items-center gap-2 py-1 text-sm text-slate-700">
            <input type="checkbox" checked={selecionados.has(nome)} onChange={() => alternar(nome)} />
            {nome}
          </label>
        ))}
      </div>
      {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}
      <div className="flex flex-wrap gap-3">
        <Button onClick={cadastrar} disabled={criando || selecionados.size === 0}>
          {criando ? "Cadastrando..." : `Cadastrar ${selecionados.size} bairro(s)`}
        </Button>
        <Button variant="outline" onClick={() => setNomes(null)} disabled={criando}>
          Voltar
        </Button>
      </div>
    </>
  );
}
