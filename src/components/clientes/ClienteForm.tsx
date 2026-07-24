"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { paraNumero } from "@/lib/format";
import { ETAPAS_FUNIL, LABEL_ETAPA_FUNIL } from "@/types/dominio";
import type { Cliente, Usuario, Empreendimento } from "@/types/dominio";

export function ClienteForm({
  cliente,
  usuarios,
  empreendimentos,
  onSucesso,
}: {
  cliente?: Cliente;
  usuarios: Usuario[];
  empreendimentos: Empreendimento[];
  onSucesso: () => void;
}) {
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [perfil, setPerfil] = useState(cliente?.perfil ?? "primeira_moradia");
  const [origemLead, setOrigemLead] = useState(cliente?.origem_lead ?? "site");
  const [corretorResponsavelId, setCorretorResponsavelId] = useState(cliente?.corretor_responsavel_id ?? "");
  const [etapaFunil, setEtapaFunil] = useState(cliente?.etapa_funil ?? "lead");
  const [orcamentoMin, setOrcamentoMin] = useState(String(cliente?.orcamento_min ?? ""));
  const [orcamentoMax, setOrcamentoMax] = useState(String(cliente?.orcamento_max ?? ""));
  const [formaPagamentoPretendida, setFormaPagamentoPretendida] = useState(
    cliente?.forma_pagamento_pretendida ?? "financiado"
  );
  const [rendaInformada, setRendaInformada] = useState(String(cliente?.renda_informada ?? ""));
  const [empreendimentoInteresseId, setEmpreendimentoInteresseId] = useState(
    cliente?.imovelInteresse?.id ?? ""
  );
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const payload = {
      nome,
      telefone: telefone || undefined,
      email: email || undefined,
      perfil,
      origemLead,
      corretorResponsavelId: corretorResponsavelId || undefined,
      etapaFunil,
      orcamentoMin: paraNumero(orcamentoMin),
      orcamentoMax: paraNumero(orcamentoMax),
      formaPagamentoPretendida,
      rendaInformada: paraNumero(rendaInformada),
      empreendimentoInteresseId: empreendimentoInteresseId || undefined,
    };

    const res = await fetch(cliente ? `/api/clientes/${cliente.id}` : "/api/clientes", {
      method: cliente ? "PATCH" : "POST",
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
      <Field label="Nome">
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Telefone">
          <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Perfil">
          <select className="input" value={perfil} onChange={(e) => setPerfil(e.target.value as typeof perfil)}>
            <option value="primeira_moradia">Primeira moradia</option>
            <option value="investidor">Investidor</option>
            <option value="troca_imovel">Troca de imóvel</option>
          </select>
        </Field>
        <Field label="Origem do lead">
          <select className="input" value={origemLead} onChange={(e) => setOrigemLead(e.target.value as typeof origemLead)}>
            <option value="indicacao">Indicação</option>
            <option value="site">Site</option>
            <option value="redes_sociais">Redes sociais</option>
            <option value="plantao">Plantão</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Corretor responsável">
          <select
            className="input"
            value={corretorResponsavelId}
            onChange={(e) => setCorretorResponsavelId(e.target.value)}
          >
            <option value="">—</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome ?? u.email}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Etapa do funil">
          <select className="input" value={etapaFunil} onChange={(e) => setEtapaFunil(e.target.value as typeof etapaFunil)}>
            {ETAPAS_FUNIL.map((etapa) => (
              <option key={etapa} value={etapa}>
                {LABEL_ETAPA_FUNIL[etapa]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Imóvel de interesse">
        <select
          className="input"
          value={empreendimentoInteresseId}
          onChange={(e) => setEmpreendimentoInteresseId(e.target.value)}
        >
          <option value="">—</option>
          {empreendimentos.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.nome}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Orçamento mínimo (R$)">
          <input className="input" type="number" value={orcamentoMin} onChange={(e) => setOrcamentoMin(e.target.value)} />
        </Field>
        <Field label="Orçamento máximo (R$)">
          <input className="input" type="number" value={orcamentoMax} onChange={(e) => setOrcamentoMax(e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Forma de pagamento pretendida">
          <select
            className="input"
            value={formaPagamentoPretendida}
            onChange={(e) => setFormaPagamentoPretendida(e.target.value as typeof formaPagamentoPretendida)}
          >
            <option value="a_vista">À vista</option>
            <option value="financiado">Financiado</option>
            <option value="misto">Misto</option>
          </select>
        </Field>
        <Field label="Renda informada (R$, opcional)">
          <input className="input" type="number" value={rendaInformada} onChange={(e) => setRendaInformada(e.target.value)} />
        </Field>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <Button type="submit" disabled={enviando} className="mt-2">
        {enviando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
