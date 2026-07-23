"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BairroInicial {
  id?: string;
  nome: string;
  cidade: string;
  estado: string;
  populacao: string;
  densidadeDemografica: string;
  rendaMedia: string;
  zoneamento: string;
  planoDiretorUrl: string;
  ultimaRevisaoManual: string;
}

const VAZIO: BairroInicial = {
  nome: "",
  cidade: "São José do Rio Preto",
  estado: "SP",
  populacao: "",
  densidadeDemografica: "",
  rendaMedia: "",
  zoneamento: "",
  planoDiretorUrl: "",
  ultimaRevisaoManual: "",
};

function paraNumero(v: string): number | undefined {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function BairroForm({ inicial }: { inicial?: BairroInicial }) {
  const router = useRouter();
  const [form, setForm] = useState<BairroInicial>(inicial ?? VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const editando = !!inicial?.id;

  function set<K extends keyof BairroInicial>(campo: K, valor: BairroInicial[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);

    const payload = {
      nome: form.nome,
      cidade: form.cidade || undefined,
      estado: form.estado || undefined,
      populacao: paraNumero(form.populacao),
      densidadeDemografica: paraNumero(form.densidadeDemografica),
      rendaMedia: paraNumero(form.rendaMedia),
      zoneamento: form.zoneamento || undefined,
      planoDiretorUrl: form.planoDiretorUrl || undefined,
      ultimaRevisaoManual: form.ultimaRevisaoManual || undefined,
    };

    const res = await fetch(editando ? `/api/admin/bairros/${inicial!.id}` : "/api/admin/bairros", {
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

    router.push("/admin/bairros");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nome" required>
          <input value={form.nome} onChange={(e) => set("nome", e.target.value)} required className="input" />
        </Campo>
        <Campo label="Cidade">
          <input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} className="input" />
        </Campo>
        <Campo label="Estado (UF)">
          <input value={form.estado} onChange={(e) => set("estado", e.target.value.toUpperCase())} maxLength={2} className="input" />
        </Campo>
        <Campo label="População">
          <input type="number" value={form.populacao} onChange={(e) => set("populacao", e.target.value)} className="input" />
        </Campo>
        <Campo label="Densidade demográfica (hab/km²)">
          <input
            type="number"
            value={form.densidadeDemografica}
            onChange={(e) => set("densidadeDemografica", e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Renda média (R$)">
          <input type="number" value={form.rendaMedia} onChange={(e) => set("rendaMedia", e.target.value)} className="input" />
        </Campo>
        <Campo label="Zoneamento">
          <input value={form.zoneamento} onChange={(e) => set("zoneamento", e.target.value)} className="input" />
        </Campo>
        <Campo label="URL do plano diretor">
          <input
            type="url"
            value={form.planoDiretorUrl}
            onChange={(e) => set("planoDiretorUrl", e.target.value)}
            className="input"
          />
        </Campo>
        <Campo label="Última revisão manual">
          <input
            type="date"
            value={form.ultimaRevisaoManual}
            onChange={(e) => set("ultimaRevisaoManual", e.target.value)}
            className="input"
          />
        </Campo>
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
