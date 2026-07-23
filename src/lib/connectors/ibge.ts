import "server-only";

// Codigo IBGE do municipio de Sao Jose do Rio Preto/SP.
export const CODIGO_MUNICIPIO_RIO_PRETO = 3549904;

interface EstimativaPopulacaoSidra {
  D1C: string; // codigo do municipio
  D1N: string; // nome do municipio
  V: string; // valor
  D3C: string; // codigo do ano
}

/**
 * Processo 2-4 / Camada de Integracao: busca a estimativa de populacao mais
 * recente do municipio via API SIDRA (tabela 6579 - Estimativas de
 * Populacao Residente). Dado automatizavel e anual, conforme mapeado no
 * slide 9 do documento de arquitetura.
 */
export async function buscarPopulacaoMunicipio(
  codigoMunicipio = CODIGO_MUNICIPIO_RIO_PRETO
): Promise<{ populacao: number; ano: string } | null> {
  const url = `https://apisidra.ibge.gov.br/values/t/6579/n6/${codigoMunicipio}/v/9324/p/last`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`IBGE SIDRA populacao: HTTP ${res.status}`);

  const dados = (await res.json()) as EstimativaPopulacaoSidra[];
  // A primeira linha do SIDRA e sempre o cabecalho com os nomes das colunas.
  const linha = dados.find((d) => d.D1C === String(codigoMunicipio));
  if (!linha) return null;

  return { populacao: Number(linha.V), ano: linha.D3C };
}

interface MunicipioIbge {
  id: number;
  nome: string;
  microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } };
}

/** Confirma metadados basicos do municipio via API de Localidades do IBGE. */
export async function buscarMetadadosMunicipio(
  codigoMunicipio = CODIGO_MUNICIPIO_RIO_PRETO
): Promise<MunicipioIbge> {
  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${codigoMunicipio}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`IBGE localidades: HTTP ${res.status}`);
  return res.json();
}

// Nota: renda media e densidade demografica por BAIRRO (nao municipio) nao
// tem endpoint SIDRA direto e agregado por setor censitario exige
// cruzamento manual do Censo - por isso o schema trata `bairros.renda_media`
// e `bairros.densidade_demografica` como cadastro manual (ver slide 9),
// revisado a cada 6-12 meses, enquanto a populacao do municipio acima e
// mantida automatica.
