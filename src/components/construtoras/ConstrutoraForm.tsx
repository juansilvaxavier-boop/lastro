"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { paraNumero } from "@/lib/format";
import type { Construtora } from "@/types/dominio";

export function ConstrutoraForm({
  construtora,
  onSucesso,
}: {
  construtora?: Construtora;
  onSucesso: () => void;
}) {
  const [nome, setNome] = useState(construtora?.nome ?? "");
  const [cnpj, setCnpj] = useState(construtora?.cnpj ?? "");
  const [anoFundacao, setAnoFundacao] = useState(String(construtora?.ano_fundacao ?? ""));
  const [statusCertidoes, setStatusCertidoes] = useState(construtora?.status_certidoes ?? "pendente");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const payload = {
      nome,
      cnpj: cnpj || undefined,
      anoFundacao: paraNumero(anoFundacao),
      statusCertidoes,
    };

    const res = await fetch(construtora ? `/api/construtoras/${construtora.id}` : "/api/construtoras", {
      method: construtora ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setEnviando(false);
    if (!res.ok) {
      setErro("Não foi possível salvar. Confira os campos.");
      return;
    }
    onSucesso();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Field label="Nome da construtora">
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="CNPJ">
          <input className="input" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
        </Field>
        <Field label="Ano de fundação">
          <input
            className="input"
            type="number"
            value={anoFundacao}
            onChange={(e) => setAnoFundacao(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Situação de certidões">
        <select
          className="input"
          value={statusCertidoes}
          onChange={(e) => setStatusCertidoes(e.target.value as typeof statusCertidoes)}
        >
          <option value="regular">Regular</option>
          <option value="pendente">Pendente</option>
          <option value="irregular">Irregular</option>
        </select>
      </Field>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <Button type="submit" disabled={enviando} className="mt-2">
        {enviando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
