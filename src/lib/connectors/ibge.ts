import "server-only";

// API de agregados (SIDRA) do IBGE — sem chave.
// https://servicodados.ibge.gov.br/api/docs/agregados
const AGREGADOS = {
  POPULACAO_ESTIMADA: { agregado: 6579, variavel: 9324 }, // Estimativas de população residente
  AREA_TERRITORIAL: { agregado: 1301, variavel: 615 }, // Área da unidade territorial (km²)
  PIB_PER_CAPITA: { agregado: 5938, variavel: 37 }, // PIB per capita a preços correntes
} as const;

interface ResultadoAgregado {
  id: string;
  variavel: string;
  unidade: string;
  resultados: {
    series: {
      localidade: { id: string; nome: string };
      serie: Record<string, string>; // { "2022": "11452" }
    }[];
  }[];
}

async function buscarAgregado(agregado: number, variavel: number, codigoIbge: string): Promise<{ ano: number; valor: number } | null> {
  const url = `https://servicodados.ibge.gov.br/api/v3/agregados/${agregado}/periodos/-1/variaveis/${variavel}?localidades=N6[${codigoIbge}]`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`IBGE agregado ${agregado}: HTTP ${res.status}`);

  const dados: ResultadoAgregado[] = await res.json();
  const serie = dados[0]?.resultados[0]?.series[0]?.serie;
  if (!serie) return null;

  const [ano, valor] = Object.entries(serie)[0] ?? [];
  if (!ano || valor === undefined || valor === "..." || valor === "-") return null;

  return { ano: Number(ano), valor: Number(valor) };
}

export interface DadosSocioeconomicosIbge {
  populacao: number | null;
  populacaoAno: number | null;
  areaKm2: number | null;
  pibPerCapita: number | null;
  pibPerCapitaAno: number | null;
}

/**
 * Busca população estimada, área territorial e PIB per capita de um
 * município no IBGE (SIDRA), pelo código de 7 dígitos do município.
 */
export async function buscarDadosSocioeconomicosMunicipio(codigoIbge: string): Promise<DadosSocioeconomicosIbge> {
  const [populacao, area, pib] = await Promise.all([
    buscarAgregado(AGREGADOS.POPULACAO_ESTIMADA.agregado, AGREGADOS.POPULACAO_ESTIMADA.variavel, codigoIbge),
    buscarAgregado(AGREGADOS.AREA_TERRITORIAL.agregado, AGREGADOS.AREA_TERRITORIAL.variavel, codigoIbge),
    buscarAgregado(AGREGADOS.PIB_PER_CAPITA.agregado, AGREGADOS.PIB_PER_CAPITA.variavel, codigoIbge),
  ]);

  return {
    populacao: populacao ? Math.round(populacao.valor) : null,
    populacaoAno: populacao?.ano ?? null,
    areaKm2: area?.valor ?? null,
    pibPerCapita: pib?.valor ?? null,
    pibPerCapitaAno: pib?.ano ?? null,
  };
}
