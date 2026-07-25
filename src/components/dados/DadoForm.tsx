"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { paraNumero } from "@/lib/format";
import type { Localizacao } from "@/types/dominio";

export function DadoForm({ localizacoes, onSucesso }: { localizacoes: Localizacao[]; onSucesso: () => void }) {
  const [categoria, setCategoria] = useState<"nacional" | "local">("nacional");
  const [tipoIndicador, setTipoIndicador] = useState("selic");
  const [tipoPreco, setTipoPreco] = useState<"venda" | "aluguel">("venda");
  const [segmentoPreco, setSegmentoPreco] = useState<"residencial" | "comercial">("residencial");
  const [localizacaoId, setLocalizacaoId] = useState("");
  const [valor, setValor] = useState("");
  const [dataReferencia, setDataReferencia] = useState("");
  const [fonte, setFonte] = useState("manual");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);

    const valorNumero = paraNumero(valor) ?? 0;
    const res =
      categoria === "nacional"
        ? await fetch("/api/indicadores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tipo: tipoIndicador,
              valor: valorNumero / 100,
              dataReferencia,
              fonte,
            }),
          })
        : await fetch("/api/precos-mercado", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              localizacaoId,
              tipo: tipoPreco,
              segmento: segmentoPreco,
              valorM2: valorNumero,
              dataReferencia,
            }),
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
      <Field label="Categoria">
        <select className="input" value={categoria} onChange={(e) => setCategoria(e.target.value as typeof categoria)}>
          <option value="nacional">Indicador nacional (Selic, CDI, IPCA, IGP-M, INCC)</option>
          <option value="local">Preço local (venda/aluguel por região)</option>
        </select>
      </Field>

      {categoria === "nacional" ? (
        <Field label="Indicador">
          <select className="input" value={tipoIndicador} onChange={(e) => setTipoIndicador(e.target.value)}>
            <option value="selic">Selic</option>
            <option value="cdi">CDI</option>
            <option value="ipca">IPCA</option>
            <option value="igpm">IGP-M</option>
            <option value="incc">INCC</option>
          </select>
        </Field>
      ) : (
        <>
          <Field label="Localização">
            <select className="input" value={localizacaoId} onChange={(e) => setLocalizacaoId(e.target.value)} required>
              <option value="">Selecione...</option>
              {localizacoes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tipo">
            <select className="input" value={tipoPreco} onChange={(e) => setTipoPreco(e.target.value as typeof tipoPreco)}>
              <option value="venda">Venda</option>
              <option value="aluguel">Aluguel</option>
            </select>
          </Field>
          <Field label="Segmento">
            <select
              className="input"
              value={segmentoPreco}
              onChange={(e) => setSegmentoPreco(e.target.value as typeof segmentoPreco)}
            >
              <option value="residencial">Residencial</option>
              <option value="comercial">Comercial</option>
            </select>
          </Field>
        </>
      )}

      <Field label={categoria === "nacional" ? "Valor (% a.a.)" : "Valor por m² (R$)"}>
        <input className="input" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} required />
      </Field>
      <Field label="Data de referência">
        <input className="input" type="date" value={dataReferencia} onChange={(e) => setDataReferencia(e.target.value)} required />
      </Field>
      {categoria === "nacional" && (
        <Field label="Fonte">
          <input className="input" value={fonte} onChange={(e) => setFonte(e.target.value)} />
        </Field>
      )}

      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <Button type="submit" disabled={enviando} className="mt-2">
        {enviando ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
