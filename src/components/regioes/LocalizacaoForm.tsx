"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { Localizacao } from "@/types/dominio";

const TIPOS = ["estado", "regiao", "cidade", "bairro"] as const;

export function LocalizacaoForm({
  paisagem,
  parentSugerido,
  localizacao,
  onSucesso,
}: {
  paisagem: Localizacao[];
  parentSugerido: Localizacao | null;
  localizacao?: Localizacao;
  onSucesso: () => void;
}) {
  const [nome, setNome] = useState(localizacao?.nome ?? "");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>(
    (localizacao?.tipo as (typeof TIPOS)[number]) ?? (parentSugerido ? proximoTipo(parentSugerido.tipo) : "estado")
  );
  const [parentId, setParentId] = useState(localizacao?.parent_id ?? parentSugerido?.id ?? "");
  const [codigoIbge, setCodigoIbge] = useState(localizacao?.codigo_ibge ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function proximoTipo(tipoPai: string): (typeof TIPOS)[number] {
    const idx = TIPOS.indexOf(tipoPai as (typeof TIPOS)[number]);
    return TIPOS[Math.min(idx + 1, TIPOS.length - 1)];
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const payload = {
      nome,
      tipo,
      parentId: parentId || null,
      codigoIbge: tipo === "cidade" ? codigoIbge || null : undefined,
    };

    const res = await fetch(localizacao ? `/api/localizacoes/${localizacao.id}` : "/api/localizacoes", {
      method: localizacao ? "PATCH" : "POST",
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

  const opcoesPai = paisagem.filter((l) => l.tipo === (tipo === "estado" ? "__none__" : anteriorTipo(tipo)));

  function anteriorTipo(t: (typeof TIPOS)[number]): string {
    const idx = TIPOS.indexOf(t);
    return TIPOS[Math.max(idx - 1, 0)];
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Field label="Tipo">
        <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}>
          <option value="estado">Estado</option>
          <option value="regiao">Região</option>
          <option value="cidade">Cidade</option>
          <option value="bairro">Bairro</option>
        </select>
      </Field>
      {tipo !== "estado" && (
        <Field label="Pertence a">
          <select className="input" value={parentId} onChange={(e) => setParentId(e.target.value)} required>
            <option value="">Selecione...</option>
            {opcoesPai.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Nome">
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </Field>
      {tipo === "cidade" && (
        <Field label="Código IBGE do município (7 dígitos)">
          <input
            className="input"
            value={codigoIbge}
            onChange={(e) => setCodigoIbge(e.target.value)}
            placeholder="ex: 3549904"
            maxLength={7}
          />
        </Field>
      )}
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <Button type="submit" disabled={enviando} className="mt-2">
        {enviando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
