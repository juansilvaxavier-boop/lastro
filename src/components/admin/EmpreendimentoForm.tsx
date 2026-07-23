"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Bairro {
  id: string;
  nome: string;
}

interface EmpreendimentoInicial {
  id?: string;
  nome: string;
  incorporadora: string;
  bairroId: string;
  endereco: string;
  tipo: string;
  statusObra: string;
  dataEntregaPrevista: string;
  preco: string;
  areaM2: string;
  quartos: string;
  vagas: string;
  valorCondominio: string;
  iptuAnual: string;
  aluguelEstimado: string;
  ativo: boolean;
  valorVenal: string;
  dueDiligenceOk: boolean;
}

const VAZIO: EmpreendimentoInicial = {
  nome: "",
  incorporadora: "",
  bairroId: "",
  endereco: "",
  tipo: "lancamento",
  statusObra: "nao_iniciada",
  dataEntregaPrevista: "",
  preco: "",
  areaM2: "",
  quartos: "",
  vagas: "",
  valorCondominio: "",
  iptuAnual: "",
  aluguelEstimado: "",
  ativo: true,
  valorVenal: "",
  dueDiligenceOk: false,
};

function paraNumero(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function EmpreendimentoForm({ bairros, inicial }: { bairros: Bairro[]; inicial?: EmpreendimentoInicial }) {
  const router = useRouter();
  const [form, setForm] = useState<EmpreendimentoInicial>(inicial ?? VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const editando = !!inicial?.id;

  function set<K extends keyof EmpreendimentoInicial>(campo: K, valor: EmpreendimentoInicial[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const payload = {
      nome: form.nome,
      incorporadora: form.incorporadora || undefined,
      bairroId: form.bairroId || undefined,
      endereco: form.endereco || undefined,
      tipo: form.tipo,
      statusObra: form.statusObra || undefined,
      dataEntregaPrevista: form.dataEntregaPrevista || undefined,
      preco: paraNumero(form.preco),
      areaM2: paraNumero(form.areaM2),
      quartos: paraNumero(form.quartos),
      vagas: paraNumero(form.vagas),
      valorCondominio: paraNumero(form.valorCondominio),
      iptuAnual: paraNumero(form.iptuAnual),
      aluguelEstimado: paraNumero(form.aluguelEstimado),
      valorVenal: paraNumero(form.valorVenal),
      dueDiligenceOk: form.dueDiligenceOk,
      ...(editando && { ativo: form.ativo }),
    };

    const res = await fetch(editando ? `/api/empreendimentos/${inicial!.id}` : "/api/empreendimentos", {
      method: editando ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(typeof data.error === "string" ? data.error : "Erro ao salvar. Confira os campos.");
      setEnviando(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome" required>
          <input value={form.nome} onChange={(e) => set("nome", e.target.value)} required className="input" />
        </Campo>
        <Campo label="Incorporadora">
          <input value={form.incorporadora} onChange={(e) => set("incorporadora", e.target.value)} className="input" />
        </Campo>
        <Campo label="Bairro">
          <select value={form.bairroId} onChange={(e) => set("bairroId", e.target.value)} className="input">
            <option value="">Selecione...</option>
            {bairros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Endereço">
          <input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} className="input" />
        </Campo>
        <Campo label="Tipo" required>
          <select value={form.tipo} onChange={(e) => set("tipo", e.target.value)} className="input">
            <option value="lancamento">Lançamento</option>
            <option value="na_planta">Na planta</option>
            <option value="pronto">Pronto</option>
            <option value="usado">Usado</option>
          </select>
        </Campo>
        <Campo label="Status da obra">
          <select value={form.statusObra} onChange={(e) => set("statusObra", e.target.value)} className="input">
            <option value="nao_iniciada">Não iniciada</option>
            <option value="em_obras">Em obras</option>
            <option value="concluida">Concluída</option>
          </select>
        </Campo>
        <Campo label="Entrega prevista">
          <input
            type="date"
            value={form.dataEntregaPrevista}
            onChange={(e) => set("dataEntregaPrevista", e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Preço (R$)" required>
          <input
            type="number"
            value={form.preco}
            onChange={(e) => set("preco", e.target.value)}
            required
            className="input"
          />
        </Campo>
        <Campo label="Área (m²)">
          <input type="number" value={form.areaM2} onChange={(e) => set("areaM2", e.target.value)} className="input" />
        </Campo>
        <Campo label="Quartos">
          <input type="number" value={form.quartos} onChange={(e) => set("quartos", e.target.value)} className="input" />
        </Campo>
        <Campo label="Vagas">
          <input type="number" value={form.vagas} onChange={(e) => set("vagas", e.target.value)} className="input" />
        </Campo>
        <Campo label="Condomínio (R$/mês)">
          <input
            type="number"
            value={form.valorCondominio}
            onChange={(e) => set("valorCondominio", e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="IPTU anual (R$)">
          <input
            type="number"
            value={form.iptuAnual}
            onChange={(e) => set("iptuAnual", e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Aluguel estimado (R$/mês)">
          <input
            type="number"
            value={form.aluguelEstimado}
            onChange={(e) => set("aluguelEstimado", e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Valor venal (R$)">
          <input
            type="number"
            value={form.valorVenal}
            onChange={(e) => set("valorVenal", e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Due diligence">
          <select
            value={form.dueDiligenceOk ? "1" : "0"}
            onChange={(e) => set("dueDiligenceOk", e.target.value === "1")}
            className="input"
          >
            <option value="0">Pendente</option>
            <option value="1">Concluída / OK</option>
          </select>
        </Campo>
        {editando && (
          <Campo label="Ativo">
            <select
              value={form.ativo ? "1" : "0"}
              onChange={(e) => set("ativo", e.target.value === "1")}
              className="input"
            >
              <option value="1">Sim</option>
              <option value="0">Não (oculto do dashboard)</option>
            </select>
          </Campo>
        )}
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      {label}
      {required && <span className="text-red-500"> *</span>}
      {children}
    </label>
  );
}
