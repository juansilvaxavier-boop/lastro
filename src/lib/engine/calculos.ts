// Regras de calculo centrais (Parte B.3 da especificacao). Funcoes puras, sem I/O.

const DIAS_TOLERANCIA_ENTREGA = 180;

function arred(v: number, casas = 4): number {
  const fator = 10 ** casas;
  return Math.round(v * fator) / fator;
}

/** preco_m2 = preco_total / metragem_privativa (espelha a coluna gerada no banco). */
export function calcularPrecoM2(precoTotal: number, metragemPrivativa: number | null): number | null {
  if (!metragemPrivativa) return null;
  return arred(precoTotal / metragemPrivativa, 2);
}

/** percentual_vendido = (unidades_totais - unidades_disponiveis) / unidades_totais */
export function calcularPercentualVendido(unidadesTotais: number, unidadesDisponiveis: number): number | null {
  if (!unidadesTotais) return null;
  return arred((unidadesTotais - unidadesDisponiveis) / unidadesTotais);
}

/**
 * % de entregas no prazo de uma construtora: empreendimentos com
 * data_entrega_real <= data_entrega_prevista + 180 dias, sobre o total ja entregue.
 */
export function calcularEntregasNoPrazo(
  empreendimentos: { dataEntregaPrevista: string | null; dataEntregaReal: string | null }[]
): number | null {
  const entregues = empreendimentos.filter((e) => e.dataEntregaReal && e.dataEntregaPrevista);
  if (entregues.length === 0) return null;

  const noPrazo = entregues.filter((e) => {
    const prevista = new Date(e.dataEntregaPrevista!);
    const real = new Date(e.dataEntregaReal!);
    const limite = new Date(prevista);
    limite.setDate(limite.getDate() + DIAS_TOLERANCIA_ENTREGA);
    return real <= limite;
  });

  return arred(noPrazo.length / entregues.length);
}

/** cap rate = (aluguel_mensal_estimado * 12) / preco_total */
export function calcularCapRate(aluguelMensalEstimado: number, precoTotal: number): number | null {
  if (!precoTotal) return null;
  return arred((aluguelMensalEstimado * 12) / precoTotal);
}

/**
 * Velocidade de vendas: percentual vendido por mes a partir de um historico
 * de snapshots (data, unidades_disponiveis) de um mesmo empreendimento.
 */
export function calcularVelocidadeVendas(
  unidadesTotais: number,
  historico: { data: string; unidadesDisponiveis: number }[]
): { data: string; percentualVendido: number }[] {
  if (!unidadesTotais) return [];
  return [...historico]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((ponto) => ({
      data: ponto.data,
      percentualVendido: arred((unidadesTotais - ponto.unidadesDisponiveis) / unidadesTotais),
    }));
}

/** ROI acumulado = (valorizacao + aluguel recebido) / capital investido */
export function calcularRoiAcumulado(params: {
  valorInvestido: number;
  valorAtual: number;
  aluguelRecebidoAcumulado: number;
}): number | null {
  const { valorInvestido, valorAtual, aluguelRecebidoAcumulado } = params;
  if (!valorInvestido) return null;
  return arred((valorAtual - valorInvestido + aluguelRecebidoAcumulado) / valorInvestido);
}

/**
 * Projecao deterministica de valor de revenda: aplica a variacao anual
 * media observada em precos_mercado_local (regiao do imovel) sobre o preco
 * atual, mes a mes, ate a data-alvo. Sem Monte Carlo (produto anterior).
 */
export function projetarValorRevenda(params: {
  precoAtual: number;
  variacaoAnualFracao: number;
  meses: number;
}): { mes: number; valorProjetado: number }[] {
  const { precoAtual, variacaoAnualFracao, meses } = params;
  const taxaMensal = (1 + variacaoAnualFracao) ** (1 / 12) - 1;
  const pontos: { mes: number; valorProjetado: number }[] = [];
  let valor = precoAtual;
  for (let mes = 1; mes <= meses; mes++) {
    valor = valor * (1 + taxaMensal);
    pontos.push({ mes, valorProjetado: Math.round(valor * 100) / 100 });
  }
  return pontos;
}

/**
 * Valorizacao do bairro desde uma data de referencia (ex: lancamento de um
 * empreendimento), usando o historico de preco/m2 de venda daquele bairro.
 * Representa "se voce tivesse comprado nesse bairro naquela epoca, o m2 local
 * valorizou X% ate hoje" — nao e o preco de revenda do imovel especifico.
 */
export function calcularValorizacaoDesdeData(
  historicoVenda: { dataReferencia: string; valorM2: number }[],
  dataReferenciaInicial: string
): number | null {
  const ordenado = [...historicoVenda].sort((a, b) => a.dataReferencia.localeCompare(b.dataReferencia));
  const primeiro = ordenado.find((p) => p.dataReferencia >= dataReferenciaInicial) ?? ordenado[0];
  const ultimo = ordenado[ordenado.length - 1];
  if (!primeiro || !ultimo || primeiro === ultimo || !primeiro.valorM2) return null;
  return arred((ultimo.valorM2 - primeiro.valorM2) / primeiro.valorM2);
}

/** Indicador "lead esfriando": sem interacao ha mais de N dias (padrao 14). */
export function estaEsfriando(ultimaInteracaoEm: string | null, limiteDias = 14): boolean {
  if (!ultimaInteracaoEm) return true;
  const diffMs = Date.now() - new Date(ultimaInteracaoEm).getTime();
  return diffMs / (1000 * 60 * 60 * 24) > limiteDias;
}
