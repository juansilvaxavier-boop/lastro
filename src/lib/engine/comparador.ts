// Comparador de estrategias: cruza capacidade financeira do cliente com um
// imovel candidato, projetando ROI sobre capital proprio, comparativo com
// renda fixa e o "custo do atraso" (Parte da apresentacao ao cliente).
import { simularFinanciamento, type SistemaAmortizacao } from "./financiamento";
import { calcularRoiAcumulado, projetarValorRevenda } from "./calculos";

function arred(v: number, casas = 2): number {
  const fator = 10 ** casas;
  return Math.round(v * fator) / fator;
}

/** Aliquota de IR regressivo para renda fixa, pelo prazo total em meses. */
export function aliquotaIrRendaFixa(meses: number): number {
  if (meses <= 6) return 0.225;
  if (meses <= 12) return 0.2;
  if (meses <= 24) return 0.175;
  return 0.15;
}

/**
 * Retorno liquido de uma aplicacao em renda fixa pos-fixada (ex: CDB 100% CDI)
 * pelo periodo informado, ja descontado o IR regressivo sobre o rendimento.
 */
export function calcularRetornoRendaFixaLiquido(params: {
  valorInvestido: number;
  meses: number;
  taxaAnual: number;
}): { valorFinalLiquido: number; rendimentoLiquido: number } {
  const { valorInvestido, meses, taxaAnual } = params;
  const taxaMensal = (1 + taxaAnual) ** (1 / 12) - 1;
  const valorBruto = valorInvestido * (1 + taxaMensal) ** meses;
  const rendimentoBruto = valorBruto - valorInvestido;
  const rendimentoLiquido = rendimentoBruto * (1 - aliquotaIrRendaFixa(meses));
  return {
    valorFinalLiquido: arred(valorInvestido + rendimentoLiquido),
    rendimentoLiquido: arred(rendimentoLiquido),
  };
}

/** Quanto o preco do imovel sobe por mes de espera, dada a variacao anual observada no bairro. */
export function calcularCustoDoAtraso(precoTotal: number, variacaoAnual12m: number): number {
  const taxaMensal = (1 + variacaoAnual12m) ** (1 / 12) - 1;
  return arred(precoTotal * taxaMensal);
}

export interface ParametrosAvaliacao {
  precoTotal: number;
  metragem: number | null;
  valorEntradaDisponivel: number;
  parcelaMaximaMensal: number | null;
  estrategiaSaida: "ganho_capital" | "renda_aluguel" | "patrimonial" | null;
  variacaoAnualVendaBairro: number | null;
  valorM2AluguelBairro: number | null;
  cdiAnual: number;
  anosProjecao?: number;
  taxaJurosFinanciamentoAnual?: number;
  sistemaFinanciamento?: SistemaAmortizacao;
}

export interface ResultadoAvaliacao {
  viavel: boolean;
  motivoInviavel: string | null;
  entradaUtilizada: number;
  parcelaEstimada: number | null;
  mesesProjecao: number;
  ganhoCapitalProjetado: number | null;
  aluguelAcumuladoProjetado: number;
  roiCapitalProprio: number | null;
  rendaFixaComparativo: { valorFinalLiquido: number; rendimentoLiquido: number } | null;
  ganhoImovelLiquido: number | null;
  custoDoAtrasoMensal: number | null;
}

const PRAZOS_TENTATIVA_MESES = [360, 420];

/** Avalia um imovel candidato para um cliente, dada a capacidade financeira dele. */
export function avaliarImovelParaCliente(params: ParametrosAvaliacao): ResultadoAvaliacao {
  const anosProjecao = params.anosProjecao ?? 5;
  const mesesProjecao = anosProjecao * 12;
  const entradaUtilizada = Math.min(params.valorEntradaDisponivel, params.precoTotal);

  let parcelaEstimada: number | null = null;
  let viavel = false;
  let motivoInviavel: string | null = null;

  if (params.parcelaMaximaMensal === null) {
    // Sem informacao de parcela maxima: nao ha como checar viabilidade, assume-se possivel.
    viavel = true;
  } else {
    for (const prazo of PRAZOS_TENTATIVA_MESES) {
      const resultado = simularFinanciamento({
        preco: params.precoTotal,
        valorEntrada: entradaUtilizada,
        numParcelas: prazo,
        taxaJurosAnual: params.taxaJurosFinanciamentoAnual ?? 0.11,
        sistema: params.sistemaFinanciamento ?? "SAC",
      });
      if (resultado.parcelaInicial <= params.parcelaMaximaMensal) {
        parcelaEstimada = resultado.parcelaInicial;
        viavel = true;
        break;
      }
      parcelaEstimada = resultado.parcelaInicial;
    }
    if (!viavel) {
      motivoInviavel = "A parcela estimada ultrapassa o que o cliente informou conseguir pagar, mesmo em prazo longo.";
    }
  }

  let ganhoCapitalProjetado: number | null = null;
  if (params.variacaoAnualVendaBairro !== null) {
    const projecao = projetarValorRevenda({
      precoAtual: params.precoTotal,
      variacaoAnualFracao: params.variacaoAnualVendaBairro,
      meses: mesesProjecao,
    });
    const valorFinal = projecao[projecao.length - 1]?.valorProjetado ?? params.precoTotal;
    ganhoCapitalProjetado = arred(valorFinal - params.precoTotal);
  }

  let aluguelAcumuladoProjetado = 0;
  if (params.estrategiaSaida === "renda_aluguel" && params.valorM2AluguelBairro && params.metragem) {
    aluguelAcumuladoProjetado = arred(params.valorM2AluguelBairro * params.metragem * mesesProjecao);
  }

  const ganhoImovelLiquido =
    ganhoCapitalProjetado !== null ? arred(ganhoCapitalProjetado + aluguelAcumuladoProjetado) : null;

  const roiCapitalProprio =
    ganhoImovelLiquido !== null && entradaUtilizada > 0
      ? calcularRoiAcumulado({
          valorInvestido: entradaUtilizada,
          valorAtual: entradaUtilizada + ganhoImovelLiquido,
          aluguelRecebidoAcumulado: 0,
        })
      : null;

  const rendaFixaComparativo =
    entradaUtilizada > 0
      ? calcularRetornoRendaFixaLiquido({
          valorInvestido: entradaUtilizada,
          meses: mesesProjecao,
          taxaAnual: params.cdiAnual,
        })
      : null;

  const custoDoAtrasoMensal =
    params.variacaoAnualVendaBairro !== null
      ? calcularCustoDoAtraso(params.precoTotal, params.variacaoAnualVendaBairro)
      : null;

  return {
    viavel,
    motivoInviavel,
    entradaUtilizada: arred(entradaUtilizada),
    parcelaEstimada: parcelaEstimada !== null ? arred(parcelaEstimada) : null,
    mesesProjecao,
    ganhoCapitalProjetado,
    aluguelAcumuladoProjetado,
    roiCapitalProprio,
    rendaFixaComparativo,
    ganhoImovelLiquido,
    custoDoAtrasoMensal,
  };
}
