"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { TIPOS_PONTO_INTERESSE, LABEL_TIPO_PONTO_INTERESSE } from "@/types/dominio";
import type { PontoInteresse } from "@/types/dominio";

export function PontoInteresseForm({
  cidadeId,
  pontoInteresse,
  onSucesso,
}: {
  cidadeId: string;
  pontoInteresse?: PontoInteresse;
  onSucesso: () => void;
}) {
  const [nome, setNome] = useState(pontoInteresse?.nome ?? "");
  const [tipo, setTipo] = useState<(typeof TIPOS_PONTO_INTERESSE)[number]>(
    (pontoInteresse?.tipo as (typeof TIPOS_PONTO_INTERESSE)[number]) ?? "shopping"
  );
  const [descricao, setDescricao] = useState(pontoInteresse?.descricao ?? "");
  const [previsaoConclusao, setPrevisaoConclusao] = useState(pontoInteresse?.previsao_conclusao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const payload = {
      cidadeId,
      nome,
      tipo,
      descricao: descricao || undefined,
      previsaoConclusao: previsaoConclusao || null,
    };

    const res = await fetch(
      pontoInteresse ? `/api/pontos-interesse/${pontoInteresse.id}` : "/api/pontos-interesse",
      {
        method: pontoInteresse ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setEnviando(false);
    if (!res.ok) {
      setErro("Não foi possível salvar. Confira os campos.");
      return;
    }
    onSucesso();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Field label="Nome">
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </Field>
      <Field label="Tipo">
        <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
          {TIPOS_PONTO_INTERESSE.map((t) => (
            <option key={t} value={t}>
              {LABEL_TIPO_PONTO_INTERESSE[t]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Previsão de conclusão (opcional)">
        <input
          className="input"
          type="date"
          value={previsaoConclusao ?? ""}
          onChange={(e) => setPrevisaoConclusao(e.target.value)}
        />
      </Field>
      <Field label="Descrição (opcional)">
        <input className="input" value={descricao ?? ""} onChange={(e) => setDescricao(e.target.value)} />
      </Field>

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <Button type="submit" disabled={enviando} className="mt-2">
        {enviando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
