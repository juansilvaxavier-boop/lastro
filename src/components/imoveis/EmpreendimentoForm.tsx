"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { paraNumero } from "@/lib/format";
import type { Construtora, Localizacao, Empreendimento } from "@/types/dominio";

export function EmpreendimentoForm({
  construtoras,
  bairros,
  empreendimento,
  onSucesso,
}: {
  construtoras: Construtora[];
  bairros: Localizacao[];
  empreendimento?: Empreendimento;
  onSucesso: () => void;
}) {
  const [nome, setNome] = useState(empreendimento?.nome ?? "");
  const [construtoraId, setConstrutoraId] = useState(empreendimento?.construtora_id ?? "");
  const [bairroId, setBairroId] = useState(empreendimento?.bairro_id ?? "");
  const [metragemPrivativa, setMetragemPrivativa] = useState(String(empreendimento?.metragem_privativa ?? ""));
  const [metragemTotal, setMetragemTotal] = useState(String(empreendimento?.metragem_total ?? ""));
  const [precoTotal, setPrecoTotal] = useState(String(empreendimento?.preco_total ?? ""));
  const [dataLancamento, setDataLancamento] = useState(empreendimento?.data_lancamento ?? "");
  const [dataEntregaPrevista, setDataEntregaPrevista] = useState(empreendimento?.data_entrega_prevista ?? "");
  const [dataEntregaReal, setDataEntregaReal] = useState(empreendimento?.data_entrega_real ?? "");
  const [indiceCorrecaoObra, setIndiceCorrecaoObra] = useState(empreendimento?.indice_correcao_obra ?? "INCC");
  const [indiceCorrecaoPosEntrega, setIndiceCorrecaoPosEntrega] = useState(
    empreendimento?.indice_correcao_pos_entrega ?? "IPCA"
  );
  const [status, setStatus] = useState(empreendimento?.status ?? "lancamento");
  const [unidadesTotais, setUnidadesTotais] = useState(String(empreendimento?.unidades_totais ?? "0"));
  const [unidadesDisponiveis, setUnidadesDisponiveis] = useState(
    String(empreendimento?.unidades_disponiveis ?? "0")
  );
  const [imagemUrl, setImagemUrl] = useState(empreendimento?.imagem_url ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const payload = {
      nome,
      construtoraId: construtoraId || null,
      bairroId: bairroId || null,
      metragemPrivativa: paraNumero(metragemPrivativa),
      metragemTotal: paraNumero(metragemTotal),
      precoTotal: paraNumero(precoTotal),
      dataLancamento: dataLancamento || undefined,
      dataEntregaPrevista: dataEntregaPrevista || undefined,
      dataEntregaReal: dataEntregaReal || null,
      indiceCorrecaoObra,
      indiceCorrecaoPosEntrega,
      status,
      unidadesTotais: paraNumero(unidadesTotais) ?? 0,
      unidadesDisponiveis: paraNumero(unidadesDisponiveis) ?? 0,
      imagemUrl: imagemUrl || undefined,
    };

    const res = await fetch(empreendimento ? `/api/empreendimentos/${empreendimento.id}` : "/api/empreendimentos", {
      method: empreendimento ? "PATCH" : "POST",
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
      <Field label="Nome do empreendimento">
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Construtora">
          <select className="input" value={construtoraId} onChange={(e) => setConstrutoraId(e.target.value)}>
            <option value="">—</option>
            {construtoras.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bairro">
          <select className="input" value={bairroId} onChange={(e) => setBairroId(e.target.value)}>
            <option value="">—</option>
            {bairros.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Preço total (R$)">
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={precoTotal}
            onChange={(e) => setPrecoTotal(e.target.value)}
            required
          />
        </Field>
        <Field label="Metragem privativa (m²)">
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={metragemPrivativa}
            onChange={(e) => setMetragemPrivativa(e.target.value)}
          />
        </Field>
        <Field label="Metragem total (m²)">
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={metragemTotal}
            onChange={(e) => setMetragemTotal(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Unidades totais">
          <input
            className="input"
            type="number"
            min={0}
            value={unidadesTotais}
            onChange={(e) => setUnidadesTotais(e.target.value)}
          />
        </Field>
        <Field label="Unidades disponíveis">
          <input
            className="input"
            type="number"
            min={0}
            value={unidadesDisponiveis}
            onChange={(e) => setUnidadesDisponiveis(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Status">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="lancamento">Lançamento</option>
          <option value="em_obra">Em obra</option>
          <option value="pronto">Pronto</option>
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Data de lançamento">
          <input
            className="input"
            type="date"
            value={dataLancamento}
            onChange={(e) => setDataLancamento(e.target.value)}
          />
        </Field>
        <Field label="Entrega prevista">
          <input
            className="input"
            type="date"
            value={dataEntregaPrevista}
            onChange={(e) => setDataEntregaPrevista(e.target.value)}
          />
        </Field>
        <Field label="Entrega real">
          <input
            className="input"
            type="date"
            value={dataEntregaReal}
            onChange={(e) => setDataEntregaReal(e.target.value)}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Correção durante a obra">
          <select
            className="input"
            value={indiceCorrecaoObra}
            onChange={(e) => setIndiceCorrecaoObra(e.target.value as typeof indiceCorrecaoObra)}
          >
            <option value="INCC">INCC</option>
            <option value="IPCA">IPCA</option>
            <option value="IGPM">IGP-M</option>
          </select>
        </Field>
        <Field label="Correção pós-entrega">
          <select
            className="input"
            value={indiceCorrecaoPosEntrega}
            onChange={(e) => setIndiceCorrecaoPosEntrega(e.target.value as typeof indiceCorrecaoPosEntrega)}
          >
            <option value="IPCA">IPCA</option>
            <option value="IGPM">IGP-M</option>
          </select>
        </Field>
      </div>

      <Field label="URL da imagem (opcional)">
        <input className="input" value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} />
      </Field>

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <Button type="submit" disabled={enviando} className="mt-2">
        {enviando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
