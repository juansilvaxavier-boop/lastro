import type { Empreendimento, MacroIndicadores, ScoreRenda } from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// Premissas conservadoras de operacao de aluguel no Brasil.
const VACANCIA_ANUAL = 1 / 12; // 1 mes de vacancia por ano
const TAXA_ADMINISTRACAO = 0.08; // taxa media de imobiliaria sobre o aluguel

export function calcularScoreRenda(
  emp: Empreendimento,
  macro: MacroIndicadores | null
): ScoreRenda {
  if (!emp.aluguelEstimado || emp.aluguelEstimado <= 0 || emp.preco <= 0) {
    return {
      score: 50,
      detalhes: { yieldBrutoAnual: null, yieldLiquidoAnual: null, custoOportunidadeCdi: null },
    };
  }

  const yieldBrutoAnual = (emp.aluguelEstimado * 12) / emp.preco;

  const custosAnuais = (emp.iptuAnual ?? 0) / emp.preco;
  const yieldLiquidoAnual =
    yieldBrutoAnual * (1 - VACANCIA_ANUAL) * (1 - TAXA_ADMINISTRACAO) - custosAnuais;

  const cdiAnual = macro?.cdiAnual ?? null;
  const custoOportunidadeCdi = cdiAnual != null ? yieldLiquidoAnual - cdiAnual : null;

  // 0% liquido -> 0 pontos, 12% liquido -> 100 pontos
  const scoreYield = clamp((yieldLiquidoAnual / 0.12) * 100);
  // -5pp abaixo do CDI -> 0 pontos, +5pp acima do CDI -> 100 pontos
  const scoreOportunidade =
    custoOportunidadeCdi != null ? clamp(50 + custoOportunidadeCdi * 1000) : 50;

  const score = clamp(scoreYield * 0.7 + scoreOportunidade * 0.3);

  return {
    score: Math.round(score * 10) / 10,
    detalhes: {
      yieldBrutoAnual: Math.round(yieldBrutoAnual * 10000) / 10000,
      yieldLiquidoAnual: Math.round(yieldLiquidoAnual * 10000) / 10000,
      custoOportunidadeCdi:
        custoOportunidadeCdi != null ? Math.round(custoOportunidadeCdi * 10000) / 10000 : null,
    },
  };
}
