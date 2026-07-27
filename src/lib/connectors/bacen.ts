import "server-only";

// Series do SGS (Sistema Gerenciador de Series Temporais) do Bacen.
// https://api.bcb.gov.br/dados/serie/bcdata.sgs.<codigo>/dados
const SGS = {
  SELIC_META_ANUAL: 432, // Meta Selic definida pelo Copom, % a.a.
  CDI_ANUALIZADO: 4391, // CDI acumulado no mes, anualizado (base 252), % a.a.
  IGPM_MENSAL: 189, // IGP-M, % a.m.
  IPCA_MENSAL: 433, // IPCA, % a.m.
} as const;

const MESES_JANELA_ANUALIZACAO = 12;

interface PontoSgs {
  data: string; // dd/MM/yyyy
  valor: string;
}

type ParametrosBusca = { ultimosN: number } | { dataInicial: Date; dataFinal: Date };

function formatarDataBr(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/** Busca uma serie do SGS — pelos ultimos N pontos ou por um intervalo de datas. */
async function buscarSerieSgs(codigo: number, params: ParametrosBusca): Promise<PontoSgs[]> {
  const url =
    "ultimosN" in params
      ? `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${params.ultimosN}?formato=json`
      : `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados?formato=json&dataInicial=${formatarDataBr(
          params.dataInicial
        )}&dataFinal=${formatarDataBr(params.dataFinal)}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Bacen SGS ${codigo}: HTTP ${res.status}`);
  return res.json();
}

function dataBrParaIso(dataBr: string): string {
  const [dia, mes, ano] = dataBr.split("/");
  return `${ano}-${mes}-${dia}`;
}

/** Anualiza uma janela de ate 12 pontos percentuais mensais compondo-os. */
function anualizarJanela(pontos: PontoSgs[]): number {
  const acumulado = pontos.reduce((acc, p) => acc * (1 + Number(p.valor) / 100), 1);
  return (acumulado - 1) * 100;
}

/**
 * Converte uma serie mensal (% a.m.) em uma serie de indicador anualizado
 * (trailing 12 meses) por ponto — precisa de `MESES_JANELA_ANUALIZACAO - 1`
 * pontos extra antes do primeiro mes desejado para fechar a primeira janela.
 */
function anualizarSerieMensal(pontos: PontoSgs[]): PontoSgs[] {
  const resultado: PontoSgs[] = [];
  for (let i = MESES_JANELA_ANUALIZACAO - 1; i < pontos.length; i++) {
    const janela = pontos.slice(i - (MESES_JANELA_ANUALIZACAO - 1), i + 1);
    resultado.push({ data: pontos[i].data, valor: String(anualizarJanela(janela)) });
  }
  return resultado;
}

function subtrairMeses(data: Date, meses: number): Date {
  const copia = new Date(data);
  copia.setMonth(copia.getMonth() - meses);
  return copia;
}

export interface IndicadorMacroColetado {
  indicador: "selic" | "cdi" | "igpm" | "ipca";
  valor: number; // fracao (ex: 0.105 para 10.5% a.a.)
  dataReferencia: string; // ISO yyyy-mm-dd
  fonte: string;
  raw: unknown;
}

/**
 * Busca Selic, CDI, IGP-M e IPCA no Bacen SGS (sem necessidade de chave) e
 * retorna os indicadores anualizados prontos para gravar em
 * `indicadores_mercado`. Sem `intervalo`, traz só o ponto mais recente de
 * cada série (uso do cron diário). Com `intervalo`, traz o histórico inteiro
 * do período — um ponto por mês/evento disponível na janela.
 */
export async function coletarIndicadoresBacen(intervalo?: {
  dataInicial: Date;
  dataFinal: Date;
}): Promise<IndicadorMacroColetado[]> {
  const paramsPontual: ParametrosBusca = intervalo ?? { ultimosN: 1 };
  // IGP-M/IPCA precisam de 11 meses extra antes do inicio pedido para poder
  // anualizar (janela movel de 12 meses) o primeiro ponto do intervalo.
  const paramsMensal: ParametrosBusca = intervalo
    ? { dataInicial: subtrairMeses(intervalo.dataInicial, MESES_JANELA_ANUALIZACAO - 1), dataFinal: intervalo.dataFinal }
    : { ultimosN: MESES_JANELA_ANUALIZACAO };

  const [selic, cdi, igpm, ipca] = await Promise.all([
    buscarSerieSgs(SGS.SELIC_META_ANUAL, paramsPontual),
    buscarSerieSgs(SGS.CDI_ANUALIZADO, paramsPontual),
    buscarSerieSgs(SGS.IGPM_MENSAL, paramsMensal),
    buscarSerieSgs(SGS.IPCA_MENSAL, paramsMensal),
  ]);

  const igpmAnualizado = intervalo
    ? anualizarSerieMensal(igpm)
    : [{ data: igpm[igpm.length - 1].data, valor: String(anualizarJanela(igpm)) }];
  const ipcaAnualizado = intervalo
    ? anualizarSerieMensal(ipca)
    : [{ data: ipca[ipca.length - 1].data, valor: String(anualizarJanela(ipca)) }];

  const paraColetado = (
    pontos: PontoSgs[],
    indicador: IndicadorMacroColetado["indicador"],
    fonte: string
  ): IndicadorMacroColetado[] =>
    pontos.map((p) => ({
      indicador,
      valor: Number(p.valor) / 100,
      dataReferencia: dataBrParaIso(p.data),
      fonte,
      raw: p,
    }));

  return [
    ...paraColetado(selic, "selic", "bacen_sgs_432"),
    ...paraColetado(cdi, "cdi", "bacen_sgs_4391"),
    ...paraColetado(igpmAnualizado, "igpm", "bacen_sgs_189_anualizado"),
    ...paraColetado(ipcaAnualizado, "ipca", "bacen_sgs_433_anualizado"),
  ];
}
