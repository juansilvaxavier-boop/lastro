import { calcularCapRate, calcularRoiAcumulado, projetarValorRevenda } from "@/lib/engine";
import type { Empreendimento, PrecoMercadoLocal, IndicadorMercado } from "@/types/dominio";

export interface PontoData {
  data: string;
  [chave: string]: number | string;
}

/** Evolucao de valor: valor_m2 historico do bairro x metragem do imovel. */
export function serieEvolucaoValor(
  empreendimento: Empreendimento,
  precosVenda: PrecoMercadoLocal[]
): { data: string; valor: number }[] {
  const metragem = empreendimento.metragem_privativa ?? empreendimento.metragem_total;
  if (!metragem) return [];
  return precosVenda
    .filter((p) => p.tipo === "venda")
    .map((p) => ({ data: p.data_referencia, valor: Math.round(p.valor_m2 * metragem) }));
}

/** Indice acumulado (base 100) a partir de uma serie de valores absolutos. */
export function indexarBase100(serie: { data: string; valor: number }[]): { data: string; valor: number }[] {
  if (serie.length === 0) return [];
  const base = serie[0].valor || 1;
  return serie.map((p) => ({ data: p.data, valor: Math.round((p.valor / base) * 1000) / 10 }));
}

/** Indice acumulado (base 100) a partir da serie mensal do CDI (fracao a.a.). */
export function indexarIndicador(historico: IndicadorMercado[]): { data: string; valor: number }[] {
  let acumulado = 100;
  return historico.map((h) => {
    acumulado *= 1 + h.valor / 12;
    return { data: h.data_referencia, valor: Math.round(acumulado * 10) / 10 };
  });
}

export function serieMomentoVenda(
  empreendimento: Empreendimento,
  variacaoAnualFracao: number,
  meses = 24
): { data: string; valor: number }[] {
  const pontos = projetarValorRevenda({ precoAtual: empreendimento.preco_total, variacaoAnualFracao, meses });
  const hoje = new Date();
  return pontos
    .filter((_, i) => i % 3 === 0)
    .map((p) => {
      const data = new Date(hoje);
      data.setMonth(data.getMonth() + p.mes);
      return { data: data.toISOString().slice(0, 10), valor: p.valorProjetado };
    });
}

export function serieParcelaAluguel(
  parcelaMensal: number,
  precosAluguel: PrecoMercadoLocal[],
  metragem: number | null
): PontoData[] {
  return precosAluguel
    .filter((p) => p.tipo === "aluguel")
    .map((p) => ({
      data: p.data_referencia,
      parcela: Math.round(parcelaMensal),
      aluguel: metragem ? Math.round(p.valor_m2 * metragem) : 0,
    }));
}

export function serieRoiAcumulado(
  valorInvestido: number,
  serieValor: { data: string; valor: number }[],
  aluguelMensalEstimado: number,
  dataLancamento: string | null
): PontoData[] {
  if (!valorInvestido) return [];
  const inicio = dataLancamento ? new Date(dataLancamento) : null;
  return serieValor.map((p) => {
    const meses = inicio ? Math.max(0, mesesEntre(inicio, new Date(p.data))) : 0;
    const roi = calcularRoiAcumulado({
      valorInvestido,
      valorAtual: p.valor,
      aluguelRecebidoAcumulado: aluguelMensalEstimado * meses,
    });
    return { data: p.data, valor: roi !== null ? Math.round(roi * 1000) / 10 : 0 };
  });
}

function mesesEntre(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

/** Mescla varias series (chave -> pontos {data,valor}) num unico array por data, para o recharts. */
export function mesclarSeries(seriesPorChave: Record<string, { data: string; valor: number }[]>): PontoData[] {
  const porData = new Map<string, PontoData>();
  for (const [chave, pontos] of Object.entries(seriesPorChave)) {
    for (const p of pontos) {
      const linha = porData.get(p.data) ?? { data: p.data };
      linha[chave] = p.valor;
      porData.set(p.data, linha);
    }
  }
  return [...porData.values()].sort((a, b) => a.data.localeCompare(b.data));
}

export interface CapRateBairro {
  bairro: string;
  capRate: number;
}

export function capRatePorBairro(
  empreendimentos: Empreendimento[],
  aluguelPorBairro: Map<string, number>
): CapRateBairro[] {
  const resultado: CapRateBairro[] = [];
  for (const emp of empreendimentos) {
    if (!emp.bairro_id || !emp.bairro?.nome) continue;
    const valorM2Aluguel = aluguelPorBairro.get(emp.bairro_id);
    const metragem = emp.metragem_privativa ?? emp.metragem_total;
    if (!valorM2Aluguel || !metragem) continue;
    const aluguelMensal = valorM2Aluguel * metragem;
    const cap = calcularCapRate(aluguelMensal, emp.preco_total);
    if (cap !== null) resultado.push({ bairro: emp.bairro.nome, capRate: cap });
  }
  return resultado.sort((a, b) => b.capRate - a.capRate);
}
