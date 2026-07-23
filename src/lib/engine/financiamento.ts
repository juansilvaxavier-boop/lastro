export type SistemaAmortizacao = "PRICE" | "SAC";

export interface ParcelaFinanciamento {
  mes: number;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldoDevedor: number;
}

export interface ResultadoFinanciamento {
  sistema: SistemaAmortizacao;
  valorFinanciado: number;
  taxaJurosMensal: number;
  parcelaInicial: number;
  parcelaFinal: number;
  totalPago: number;
  totalJuros: number;
  tabela: ParcelaFinanciamento[];
}

function taxaMensalEquivalente(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1;
}

function simularPrice(
  valorFinanciado: number,
  numParcelas: number,
  taxaMensal: number
): ParcelaFinanciamento[] {
  const parcela =
    taxaMensal === 0
      ? valorFinanciado / numParcelas
      : (valorFinanciado * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -numParcelas));

  const tabela: ParcelaFinanciamento[] = [];
  let saldoDevedor = valorFinanciado;
  for (let mes = 1; mes <= numParcelas; mes++) {
    const juros = saldoDevedor * taxaMensal;
    const amortizacao = parcela - juros;
    saldoDevedor = Math.max(0, saldoDevedor - amortizacao);
    tabela.push({
      mes,
      parcela: arred(parcela),
      juros: arred(juros),
      amortizacao: arred(amortizacao),
      saldoDevedor: arred(saldoDevedor),
    });
  }
  return tabela;
}

function simularSac(
  valorFinanciado: number,
  numParcelas: number,
  taxaMensal: number
): ParcelaFinanciamento[] {
  const amortizacao = valorFinanciado / numParcelas;
  const tabela: ParcelaFinanciamento[] = [];
  let saldoDevedor = valorFinanciado;
  for (let mes = 1; mes <= numParcelas; mes++) {
    const juros = saldoDevedor * taxaMensal;
    const parcela = amortizacao + juros;
    saldoDevedor = Math.max(0, saldoDevedor - amortizacao);
    tabela.push({
      mes,
      parcela: arred(parcela),
      juros: arred(juros),
      amortizacao: arred(amortizacao),
      saldoDevedor: arred(saldoDevedor),
    });
  }
  return tabela;
}

function arred(v: number): number {
  return Math.round(v * 100) / 100;
}

export function simularFinanciamento(params: {
  preco: number;
  valorEntrada: number;
  numParcelas: number;
  taxaJurosAnual: number;
  sistema: SistemaAmortizacao;
}): ResultadoFinanciamento {
  const { preco, valorEntrada, numParcelas, taxaJurosAnual, sistema } = params;
  const valorFinanciado = Math.max(0, preco - valorEntrada);
  const taxaMensal = taxaMensalEquivalente(taxaJurosAnual);

  const tabela =
    sistema === "PRICE"
      ? simularPrice(valorFinanciado, numParcelas, taxaMensal)
      : simularSac(valorFinanciado, numParcelas, taxaMensal);

  const totalPago = arred(tabela.reduce((soma, p) => soma + p.parcela, 0));
  const totalJuros = arred(tabela.reduce((soma, p) => soma + p.juros, 0));

  return {
    sistema,
    valorFinanciado: arred(valorFinanciado),
    taxaJurosMensal: taxaMensal,
    parcelaInicial: tabela[0]?.parcela ?? 0,
    parcelaFinal: tabela[tabela.length - 1]?.parcela ?? 0,
    totalPago,
    totalJuros,
    tabela,
  };
}
