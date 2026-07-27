"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { formatarData } from "@/lib/format";

interface LinhaPreco {
  segmento: "residencial" | "comercial";
  tipo: "venda" | "aluguel";
  valorM2: number;
  variacaoMensal: number | null;
  variacaoAnual12m: number | null;
  dataReferencia: string;
}

interface CidadeParseada {
  nomeCidade: string;
  localizacaoIdSugerido: string | null;
  linhas: LinhaPreco[];
  resumo: {
    totalLinhas: number;
    dataInicial: string | null;
    dataFinal: string | null;
    porSegmentoTipo: Record<string, number>;
  };
}

const LABEL_SEGMENTO_TIPO: Record<string, string> = {
  residencial_venda: "Residencial · Venda",
  residencial_aluguel: "Residencial · Aluguel",
  comercial_venda: "Comercial · Venda",
  comercial_aluguel: "Comercial · Aluguel",
};

export function ImportarPlanilhaModal({ onSucesso }: { onSucesso: () => void }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [cidades, setCidades] = useState<CidadeParseada[] | null>(null);
  const [cidadesCadastradas, setCidadesCadastradas] = useState<{ id: string; nome: string }[]>([]);
  const [localizacaoPorCidade, setLocalizacaoPorCidade] = useState<Record<number, string>>({});

  async function analisar() {
    if (!arquivo) return;
    setAnalisando(true);
    setErro(null);
    setResultado(null);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const res = await fetch("/api/precos-mercado/importar/preview", { method: "POST", body: formData });
    const data = await res.json();
    setAnalisando(false);
    if (!res.ok) {
      setErro(data.error?.toString?.() ?? "Não foi possível analisar a planilha.");
      return;
    }
    setCidades(data.cidades);
    setCidadesCadastradas(data.cidadesCadastradas ?? []);
    const iniciais: Record<number, string> = {};
    (data.cidades as CidadeParseada[]).forEach((c, i) => {
      if (c.localizacaoIdSugerido) iniciais[i] = c.localizacaoIdSugerido;
    });
    setLocalizacaoPorCidade(iniciais);
  }

  async function importar() {
    if (!cidades) return;
    const semLocalizacao = cidades.some((_, i) => !localizacaoPorCidade[i]);
    if (semLocalizacao) {
      setErro("Selecione a cidade cadastrada correspondente para cada aba antes de importar.");
      return;
    }

    setImportando(true);
    setErro(null);
    let totalImportado = 0;

    try {
      for (let i = 0; i < cidades.length; i++) {
        const res = await fetch("/api/precos-mercado/importar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ localizacaoId: localizacaoPorCidade[i], linhas: cidades[i].linhas }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.toString?.() ?? "Falha ao importar.");
        totalImportado += data.importados ?? 0;
      }
      setResultado(`${totalImportado} ponto(s) importado(s) com sucesso.`);
      setCidades(null);
      setArquivo(null);
      onSucesso();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível importar.");
    } finally {
      setImportando(false);
    }
  }

  if (cidades === null) {
    return (
      <>
        <p className="mb-4 text-sm text-slate-500">
          Envie uma planilha (.xlsx) no formato do índice de preços por m² (venda e aluguel, residencial e
          comercial) — uma aba por cidade. Os dados serão analisados antes de gravar no sistema.
        </p>
        <Field label="Arquivo">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </Field>
        {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
        {resultado && <p className="mt-4 text-sm text-emerald-600">{resultado}</p>}
        <div className="mt-5">
          <Button onClick={analisar} disabled={!arquivo || analisando}>
            <Upload size={16} /> {analisando ? "Analisando..." : "Analisar planilha"}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-slate-500">
        {cidades.length} aba(s) reconhecida(s). Confira a cidade correspondente de cada uma antes de importar.
      </p>
      <div className="flex max-h-96 flex-col gap-4 overflow-y-auto">
        {cidades.map((c, i) => (
          <div key={c.nomeCidade} className="rounded-xl border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-slate-900">{c.nomeCidade}</p>
              <p className="text-xs text-slate-400">
                {c.resumo.totalLinhas} ponto(s) · {formatarData(c.resumo.dataInicial)} — {formatarData(c.resumo.dataFinal)}
              </p>
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {Object.entries(c.resumo.porSegmentoTipo).map(([chave, qtd]) => (
                <span key={chave} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_SEGMENTO_TIPO[chave] ?? chave}: {qtd}
                </span>
              ))}
            </div>
            <Field label="Cidade cadastrada no Lastro">
              <select
                className="input"
                value={localizacaoPorCidade[i] ?? ""}
                onChange={(e) => setLocalizacaoPorCidade((prev) => ({ ...prev, [i]: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {cidadesCadastradas.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.nome}
                  </option>
                ))}
              </select>
            </Field>
            {!c.localizacaoIdSugerido && (
              <p className="mt-2 text-xs text-amber-600">
                Não encontrei uma cidade cadastrada com esse nome — selecione manualmente ou cadastre em Regiões.
              </p>
            )}
          </div>
        ))}
      </div>
      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={importar} disabled={importando}>
          {importando ? "Importando..." : "Importar"}
        </Button>
        <Button variant="outline" onClick={() => setCidades(null)} disabled={importando}>
          Voltar
        </Button>
      </div>
    </>
  );
}
