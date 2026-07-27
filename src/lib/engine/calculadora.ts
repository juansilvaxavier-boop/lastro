// Calculadora financeira (A.1.1): os 4 modos de forma de pagamento.
import { simularFinanciamento, type ResultadoFinanciamento, type SistemaAmortizacao } from "./financiamento";

function arred(v: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round(v * fator) / fator;
}

// ---------- Modo: a vista ----------

export interface ResultadoAVista {
  precoTotal: number;
  percentualDesconto: number;
  valorFinal: number;
  desconto: number;
}

export function simularAVista(precoTotal: number, percentualDesconto: number): ResultadoAVista {
  const desconto = arred(precoTotal * percentualDesconto);
  return {
    precoTotal,
    percentualDesconto,
    valorFinal: arred(precoTotal - desconto),
    desconto,
  };
}

// ---------- Modo: financiamento direto com a construtora ----------

export interface ParcelaObra {
  mes: number;
  valorNominal: number;
  valorCorrigido: number;
}

export interface ResultadoParcelasObra {
  tabelaObra: ParcelaObra[];
  totalPagoObra: number;
  saldoResidualNaEntrega: number;
  financiamentoPosEntrega: ResultadoFinanciamento | null;
}

/**
 * Parcelas corrigidas por INCC mes a mes ate a entrega. O saldo residual
 * (percentualFinanciadoNaEntrega do saldo apos a entrada) e convertido em
 * financiamento bancario (SAC/PRICE) ou fica como parcelamento direto sem
 * juros com a construtora, conforme `converterEmFinanciamentoBancario`.
 */
export function simularParcelasObra(params: {
  precoTotal: number;
  valorEntrada: number;
  numParcelasObra: number;
  taxaIncMensal: number;
  percentualFinanciadoNaEntrega: number; // 0 a 1
  converterEmFinanciamentoBancario: boolean;
  taxaJurosAnualPosEntrega?: number;
  numParcelasPosEntrega?: number;
  sistemaPosEntrega?: SistemaAmortizacao;
}): ResultadoParcelasObra {
  const saldoAposEntrada = Math.max(0, params.precoTotal - params.valorEntrada);
  const saldoResidualNaEntrega = arred(saldoAposEntrada * params.percentualFinanciadoNaEntrega);
  const saldoParcelado = saldoAposEntrada - saldoResidualNaEntrega;
  const valorNominal = params.numParcelasObra > 0 ? saldoParcelado / params.numParcelasObra : 0;

  const tabelaObra: ParcelaObra[] = [];
  let fatorAcumulado = 1;
  for (let mes = 1; mes <= params.numParcelasObra; mes++) {
    fatorAcumulado *= 1 + params.taxaIncMensal;
    tabelaObra.push({
      mes,
      valorNominal: arred(valorNominal),
      valorCorrigido: arred(valorNominal * fatorAcumulado),
    });
  }

  const totalPagoObra = arred(tabelaObra.reduce((soma, p) => soma + p.valorCorrigido, 0));

  let financiamentoPosEntrega: ResultadoFinanciamento | null = null;
  if (saldoResidualNaEntrega > 0 && params.converterEmFinanciamentoBancario) {
    financiamentoPosEntrega = simularFinanciamento({
      preco: saldoResidualNaEntrega,
      valorEntrada: 0,
      numParcelas: params.numParcelasPosEntrega ?? 120,
      taxaJurosAnual: params.taxaJurosAnualPosEntrega ?? 0,
      sistema: params.sistemaPosEntrega ?? "SAC",
    });
  }

  return { tabelaObra, totalPagoObra, saldoResidualNaEntrega, financiamentoPosEntrega };
}

// ---------- Modo: fluxo de pagamento personalizado ----------

export interface ItemFluxoPersonalizado {
  mes: number;
  tipo: "entrada" | "mensal" | "balao" | "chaves" | "financiamento";
  valor: number;
}

export function simularFluxoPersonalizado(params: {
  valorEntrada: number;
  parcelasMensais?: { valor: number; quantidade: number; mesInicial?: number };
  baloes?: { valor: number; periodicidadeMeses: number; quantidade: number; mesInicial?: number }[];
  valorNaEntrega?: { valor: number; mes: number };
  saldoFinanciado?: {
    valor: number;
    numParcelas: number;
    taxaJurosAnual: number;
    sistema: SistemaAmortizacao;
  };
}): { itens: ItemFluxoPersonalizado[]; totalPago: number; financiamento: ResultadoFinanciamento | null } {
  const itens: ItemFluxoPersonalizado[] = [{ mes: 0, tipo: "entrada", valor: params.valorEntrada }];

  if (params.parcelasMensais) {
    const inicio = params.parcelasMensais.mesInicial ?? 1;
    for (let i = 0; i < params.parcelasMensais.quantidade; i++) {
      itens.push({ mes: inicio + i, tipo: "mensal", valor: params.parcelasMensais.valor });
    }
  }

  for (const balao of params.baloes ?? []) {
    const inicio = balao.mesInicial ?? balao.periodicidadeMeses;
    for (let i = 0; i < balao.quantidade; i++) {
      itens.push({ mes: inicio + i * balao.periodicidadeMeses, tipo: "balao", valor: balao.valor });
    }
  }

  if (params.valorNaEntrega) {
    itens.push({ mes: params.valorNaEntrega.mes, tipo: "chaves", valor: params.valorNaEntrega.valor });
  }

  let financiamento: ResultadoFinanciamento | null = null;
  if (params.saldoFinanciado) {
    financiamento = simularFinanciamento({
      preco: params.saldoFinanciado.valor,
      valorEntrada: 0,
      numParcelas: params.saldoFinanciado.numParcelas,
      taxaJurosAnual: params.saldoFinanciado.taxaJurosAnual,
      sistema: params.saldoFinanciado.sistema,
    });
  }

  itens.sort((a, b) => a.mes - b.mes);
  const totalPago = arred(
    itens.reduce((soma, i) => soma + i.valor, 0) + (financiamento?.totalPago ?? 0)
  );

  return { itens, totalPago, financiamento };
}

// ---------- Alerta de comprometimento de renda ----------

export function excedeComprometimentoRenda(
  parcelaMensal: number,
  rendaInformada: number | null,
  limitePercentual = 0.3
): boolean {
  if (!rendaInformada) return false;
  return parcelaMensal / rendaInformada > limitePercentual;
}
