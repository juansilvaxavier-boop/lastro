import "server-only";

// Series do SGS (Sistema Gerenciador de Series Temporais) do Bacen.
// https://api.bcb.gov.br/dados/serie/bcdata.sgs.<codigo>/dados
const SGS = {
  SELIC_META_ANUAL: 432, // Meta Selic definida pelo Copom, % a.a.
  CDI_ANUALIZADO: 4391, // CDI acumulado no mes, anualizado (base 252), % a.a.
  IGPM_MENSAL: 189, // IGP-M, % a.m.
  IPCA_MENSAL: 433, // IPCA, % a.m.
} as const;

interface PontoSgs {
  data: string; // dd/MM/yyyy
  valor: string;
}

async function buscarSerieSgs(codigo: number, ultimosN: number): Promise<PontoSgs[]> {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/${ultimosN}?formato=json`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Bacen SGS ${codigo}: HTTP ${res.status}`);
  return res.json();
}

function dataBrParaIso(dataBr: string): string {
  const [dia, mes, ano] = dataBr.split("/");
  return `${ano}-${mes}-${dia}`;
}

/** Anualiza uma serie de valores percentuais mensais compondo os ultimos 12 meses. */
function anualizarMensal(pontos: PontoSgs[]): number {
  const ultimos12 = pontos.slice(-12);
  const acumulado = ultimos12.reduce((acc, p) => acc * (1 + Number(p.valor) / 100), 1);
  return (acumulado - 1) * 100;
}

export interface IndicadorMacroColetado {
  indicador: "selic" | "cdi" | "igpm" | "ipca";
  valor: number; // fracao (ex: 0.105 para 10.5% a.a.)
  dataReferencia: string; // ISO yyyy-mm-dd
  fonte: string;
  raw: unknown;
}

/**
 * Processo 2-4 / Camada de Integracao: busca Selic, CDI, IGP-M e IPCA no
 * Bacen SGS (sem necessidade de chave) e retorna os indicadores anualizados
 * prontos para gravar em macro_dados.
 */
export async function coletarIndicadoresBacen(): Promise<IndicadorMacroColetado[]> {
  const [selic, cdi, igpm, ipca] = await Promise.all([
    buscarSerieSgs(SGS.SELIC_META_ANUAL, 1),
    buscarSerieSgs(SGS.CDI_ANUALIZADO, 1),
    buscarSerieSgs(SGS.IGPM_MENSAL, 12),
    buscarSerieSgs(SGS.IPCA_MENSAL, 12),
  ]);

  const ultimoSelic = selic[selic.length - 1];
  const ultimoCdi = cdi[cdi.length - 1];
  const ultimoIgpm = igpm[igpm.length - 1];
  const ultimoIpca = ipca[ipca.length - 1];

  return [
    {
      indicador: "selic",
      valor: Number(ultimoSelic.valor) / 100,
      dataReferencia: dataBrParaIso(ultimoSelic.data),
      fonte: "bacen_sgs_432",
      raw: ultimoSelic,
    },
    {
      indicador: "cdi",
      valor: Number(ultimoCdi.valor) / 100,
      dataReferencia: dataBrParaIso(ultimoCdi.data),
      fonte: "bacen_sgs_4391",
      raw: ultimoCdi,
    },
    {
      indicador: "igpm",
      valor: anualizarMensal(igpm) / 100,
      dataReferencia: dataBrParaIso(ultimoIgpm.data),
      fonte: "bacen_sgs_189_anualizado",
      raw: igpm,
    },
    {
      indicador: "ipca",
      valor: anualizarMensal(ipca) / 100,
      dataReferencia: dataBrParaIso(ultimoIpca.data),
      fonte: "bacen_sgs_433_anualizado",
      raw: ipca,
    },
  ];
}
