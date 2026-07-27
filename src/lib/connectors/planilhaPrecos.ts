import "server-only";
import * as XLSX from "xlsx";

/**
 * Le planilhas no formato do indice FipeZAP+ (uma aba por cidade, linhas 1-4
 * sao cabecalhos mesclados: segmento / transacao / metrica / quartos; dados
 * a partir da linha 5, coluna A = AAAAMM, coluna B = data). So agrupa as
 * colunas "Total" de Preco medio / Var. mensal / Var. em 12 meses — as
 * colunas de Numero-Indice e Rentabilidade do aluguel sao ignoradas (o
 * indice e recalculado no cliente a partir do preco/m2, e o yield a partir
 * de venda x aluguel).
 */

export interface LinhaPrecoImportada {
  segmento: "residencial" | "comercial";
  tipo: "venda" | "aluguel";
  valorM2: number;
  variacaoMensal: number | null;
  variacaoAnual12m: number | null;
  dataReferencia: string;
}

export interface PlanilhaImportadaCidade {
  nomeCidade: string;
  linhas: LinhaPrecoImportada[];
}

const LINHA_SEGMENTO = 0;
const LINHA_TRANSACAO = 1;
const LINHA_METRICA = 2;
const LINHA_QUARTOS = 3;
const PRIMEIRA_LINHA_DADOS = 4;

type Metrica = "preco" | "varMensal" | "var12m";

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function celula(ws: XLSX.WorkSheet, r: number, c: number): unknown {
  const ref = ws[XLSX.utils.encode_cell({ r, c })];
  return ref ? ref.v : undefined;
}

function preencherLinha(ws: XLSX.WorkSheet, linha: number, ultimaColuna: number): (string | undefined)[] {
  const valores: (string | undefined)[] = [];
  let ultimo: string | undefined;
  for (let c = 0; c <= ultimaColuna; c++) {
    const v = celula(ws, linha, c);
    if (typeof v === "string" && v.trim()) ultimo = v;
    valores.push(ultimo);
  }
  return valores;
}

function normalizarSegmento(valor: string | undefined): "residencial" | "comercial" | null {
  if (!valor) return null;
  const s = normalizar(valor);
  // "residencial"/"comercial" pluralizam para "residenciais"/"comerciais" (-al -> -ais),
  // por isso o match usa o radical sem o sufixo "-al"/"-ais".
  if (s.includes("residencia")) return "residencial";
  if (s.includes("comercia")) return "comercial";
  return null;
}

function normalizarTipo(valor: string | undefined): "venda" | "aluguel" | null {
  if (!valor) return null;
  const s = normalizar(valor);
  if (s.includes("venda")) return "venda";
  if (s.includes("locacao")) return "aluguel";
  return null;
}

function normalizarMetrica(valor: string | undefined): Metrica | null {
  if (!valor) return null;
  const s = normalizar(valor);
  if (s.includes("preco medio")) return "preco";
  if (s.includes("var. mensal") || s.includes("var mensal")) return "varMensal";
  if (s.includes("12 meses")) return "var12m";
  return null;
}

export function parsePlanilhaPrecos(buffer: Buffer): PlanilhaImportadaCidade[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const resultado: PlanilhaImportadaCidade[] = [];

  for (const nomeAba of workbook.SheetNames) {
    const ws = workbook.Sheets[nomeAba];
    const ref = ws["!ref"];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);

    const segmentos = preencherLinha(ws, LINHA_SEGMENTO, range.e.c);
    const transacoes = preencherLinha(ws, LINHA_TRANSACAO, range.e.c);
    const metricas = preencherLinha(ws, LINHA_METRICA, range.e.c);

    interface ColunaInfo {
      segmento: "residencial" | "comercial";
      tipo: "venda" | "aluguel";
      metrica: Metrica;
    }
    const colunas = new Map<number, ColunaInfo>();

    for (let c = 2; c <= range.e.c; c++) {
      const quartos = celula(ws, LINHA_QUARTOS, c);
      if (typeof quartos !== "string" || normalizar(quartos) !== "total") continue;

      const segmento = normalizarSegmento(segmentos[c]);
      const tipo = normalizarTipo(transacoes[c]);
      const metrica = normalizarMetrica(metricas[c]);
      if (!segmento || !tipo || !metrica) continue;

      colunas.set(c, { segmento, tipo, metrica });
    }

    if (colunas.size === 0) continue;

    const linhas: LinhaPrecoImportada[] = [];

    for (let r = PRIMEIRA_LINHA_DADOS; r <= range.e.r; r++) {
      const codigoData = celula(ws, r, 0);
      if (typeof codigoData !== "number") continue;
      const ano = Math.floor(codigoData / 100);
      const mes = codigoData % 100;
      if (ano < 1990 || ano > 2100 || mes < 1 || mes > 12) continue;
      const dataReferencia = `${ano}-${String(mes).padStart(2, "0")}-01`;

      const porGrupo = new Map<
        string,
        { segmento: "residencial" | "comercial"; tipo: "venda" | "aluguel"; preco?: number; varMensal?: number; var12m?: number }
      >();

      for (const [c, info] of colunas) {
        const valor = celula(ws, r, c);
        if (typeof valor !== "number") continue;
        const chave = `${info.segmento}:${info.tipo}`;
        const grupo = porGrupo.get(chave) ?? { segmento: info.segmento, tipo: info.tipo };
        if (info.metrica === "preco") grupo.preco = valor;
        else if (info.metrica === "varMensal") grupo.varMensal = valor;
        else grupo.var12m = valor;
        porGrupo.set(chave, grupo);
      }

      for (const grupo of porGrupo.values()) {
        if (grupo.preco === undefined) continue;
        linhas.push({
          segmento: grupo.segmento,
          tipo: grupo.tipo,
          valorM2: grupo.preco,
          variacaoMensal: grupo.varMensal ?? null,
          variacaoAnual12m: grupo.var12m ?? null,
          dataReferencia,
        });
      }
    }

    if (linhas.length > 0) {
      resultado.push({ nomeCidade: nomeAba.trim(), linhas });
    }
  }

  return resultado;
}
