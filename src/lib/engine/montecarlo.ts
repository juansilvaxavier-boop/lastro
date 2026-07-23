import type { CenarioResultado, Empreendimento, SimulacaoMonteCarloParams, TipoCenario } from "./types";

// PRNG determinístico (mulberry32) para simulações reprodutíveis em testes.
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function amostraNormal(rand: () => number, media: number, desvioPadrao: number): number {
  // Box-Muller
  const u1 = Math.max(rand(), Number.EPSILON);
  const u2 = rand();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return media + desvioPadrao * z0;
}

function percentil(valoresOrdenados: number[], p: number): number {
  const idx = clampIndex((p / 100) * (valoresOrdenados.length - 1), valoresOrdenados.length);
  return valoresOrdenados[idx];
}

function clampIndex(idx: number, length: number): number {
  return Math.max(0, Math.min(length - 1, Math.round(idx)));
}

/**
 * Simula `simulacoes` trajetorias de valorizacao acumulada ao longo de
 * `anos`, com retorno anual ~ Normal(taxaEsperadaAnual, volatilidadeAnual),
 * compondo ano a ano. Retorna os percentis 10/50/90 como faixas
 * pessimista/base/otimista (Processo 7).
 */
export function simularCenarios(params: SimulacaoMonteCarloParams): {
  pessimista: number;
  base: number;
  otimista: number;
} {
  const { taxaEsperadaAnual, volatilidadeAnual, anos, simulacoes = 1000, seed = 42 } = params;
  const rand = mulberry32(seed);
  const resultados: number[] = [];

  for (let i = 0; i < simulacoes; i++) {
    let acumulado = 1;
    for (let ano = 0; ano < anos; ano++) {
      const retornoAno = amostraNormal(rand, taxaEsperadaAnual, volatilidadeAnual);
      acumulado *= 1 + retornoAno;
    }
    resultados.push(acumulado - 1);
  }

  resultados.sort((a, b) => a - b);

  return {
    pessimista: Math.round(percentil(resultados, 10) * 1000) / 1000,
    base: Math.round(percentil(resultados, 50) * 1000) / 1000,
    otimista: Math.round(percentil(resultados, 90) * 1000) / 1000,
  };
}

const VOLATILIDADE_POR_RISCO: Record<Empreendimento["tipo"], number> = {
  lancamento: 0.09,
  na_planta: 0.08,
  pronto: 0.05,
  usado: 0.04,
};

/**
 * Gera os tres cenarios (Processo 7) para um empreendimento a partir do seu
 * score de valorizacao (convertido em taxa esperada de valorizacao ao ano).
 */
export function gerarCenarios(
  emp: Empreendimento,
  scoreValorizacao: number,
  anos = 3,
  seed?: number
): CenarioResultado[] {
  // score 50 -> ~4% a.a. (proximo da inflacao); score 100 -> ~12% a.a.
  const taxaEsperadaAnual = 0.04 + (Math.max(0, scoreValorizacao - 50) / 50) * 0.08;
  const volatilidadeAnual = VOLATILIDADE_POR_RISCO[emp.tipo] ?? 0.06;

  const { pessimista, base, otimista } = simularCenarios({
    taxaEsperadaAnual,
    volatilidadeAnual,
    anos,
    seed,
  });

  const rendaAtual = emp.aluguelEstimado ?? null;
  const cenarios: { tipo: TipoCenario; valorizacao: number }[] = [
    { tipo: "pessimista", valorizacao: pessimista },
    { tipo: "base", valorizacao: base },
    { tipo: "otimista", valorizacao: otimista },
  ];

  return cenarios.map(({ tipo, valorizacao }) => ({
    tipo,
    valorizacaoProjetadaPct: Math.round(valorizacao * 1000) / 10, // em %
    // aluguel cresce mais devagar que o preco do imovel
    rendaProjetadaMensal: rendaAtual != null ? Math.round(rendaAtual * (1 + valorizacao * 0.5)) : null,
  }));
}
