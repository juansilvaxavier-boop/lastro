import "server-only";

// Portal de Dados Abertos da CVM - informes mensais de Fundos de
// Investimento Imobiliario (FII). Padrao de URL documentado em
// https://dados.cvm.gov.br/dataset/fii-doc-inf_mensal
// IMPORTANTE: este endpoint nao pode ser testado a partir deste ambiente de
// desenvolvimento (proxy de rede bloqueia dados.cvm.gov.br). O parser abaixo
// e defensivo (le o cabecalho do CSV em vez de indices fixos de coluna) para
// tolerar pequenas mudancas de schema, mas confirme contra o portal apos o
// primeiro deploy.
function urlInformeMensal(ano: number, mes: number): string {
  const mm = String(mes).padStart(2, "0");
  return `http://dados.cvm.gov.br/dados/FII/DOC/INF_MENSAL/DADOS/inf_mensal_fii_${ano}${mm}.csv`;
}

function parseCsv(texto: string): { header: string[]; linhas: string[][] } {
  const linhasBrutas = texto.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = linhasBrutas[0].split(";").map((h) => h.trim());
  const linhas = linhasBrutas.slice(1).map((l) => l.split(";"));
  return { header, linhas };
}

function encontrarColuna(header: string[], ...termos: string[]): number {
  const idx = header.findIndex((h) =>
    termos.every((t) => h.toLowerCase().includes(t.toLowerCase()))
  );
  return idx;
}

function paraNumero(valorBr: string): number | null {
  if (!valorBr) return null;
  const n = Number(valorBr.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export interface IndicadorFiiColetado {
  indicador: "fii_rendimento" | "fii_pvp";
  valor: number;
  dataReferencia: string;
  fonte: string;
  raw: unknown;
}

/**
 * Processo 2-4 / Camada de Integracao: baixa o informe mensal de FIIs da CVM
 * mais recente e calcula a media de rendimento distribuido por cota e a
 * relacao preco/valor-patrimonial (P/VP) do mercado, para uso como
 * referencia macro do segmento imobiliario.
 */
export async function coletarIndicadoresCvm(
  referencia: Date = new Date()
): Promise<IndicadorFiiColetado[]> {
  // Informe do mes corrente costuma nao estar disponivel ainda - usa o mes anterior.
  const dataReferencia = new Date(referencia.getFullYear(), referencia.getMonth() - 1, 1);
  const ano = dataReferencia.getFullYear();
  const mes = dataReferencia.getMonth() + 1;

  const res = await fetch(urlInformeMensal(ano, mes));
  if (!res.ok) throw new Error(`CVM informe mensal FII ${ano}-${mes}: HTTP ${res.status}`);
  const texto = await res.text();

  const { header, linhas } = parseCsv(texto);
  const colPatrimonioLiquido = encontrarColuna(header, "patrimonio", "liquido");
  const colValorPatrimonialCota = encontrarColuna(header, "valor", "patrimonial", "cota");
  const colRendimento = encontrarColuna(header, "rendimento");

  const dataIso = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const resultados: IndicadorFiiColetado[] = [];

  if (colRendimento >= 0) {
    const valores = linhas.map((l) => paraNumero(l[colRendimento])).filter((v): v is number => v != null && v > 0);
    if (valores.length > 0) {
      resultados.push({
        indicador: "fii_rendimento",
        valor: valores.reduce((a, b) => a + b, 0) / valores.length,
        dataReferencia: dataIso,
        fonte: "cvm_inf_mensal_fii",
        raw: { amostras: valores.length },
      });
    }
  }

  if (colPatrimonioLiquido >= 0 && colValorPatrimonialCota >= 0) {
    // P/VP medio simplificado: assume-se preco de mercado ~ valor patrimonial
    // quando nao ha cotacao de bolsa no proprio arquivo - serve apenas como
    // baseline ate a integracao com uma fonte de cotacao de mercado (B3).
    resultados.push({
      indicador: "fii_pvp",
      valor: 1,
      dataReferencia: dataIso,
      fonte: "cvm_inf_mensal_fii_baseline",
      raw: { nota: "baseline 1.0 - requer cotacao de mercado para P/VP real" },
    });
  }

  return resultados;
}
