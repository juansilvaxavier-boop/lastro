import type { Bairro, Empreendimento, MacroIndicadores, ScoreValorizacao } from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

// Pontua o estagio do ciclo de obra: quanto mais cedo, maior o potencial de
// valorizacao (compra-se por um preco que ainda nao reflete o produto pronto).
function scoreEstagioObra(emp: Empreendimento): number {
  if (emp.tipo === "usado") return 35;
  if (emp.tipo === "pronto") return 50;
  if (emp.statusObra === "nao_iniciada") return 90;
  if (emp.statusObra === "em_obras") return 75;
  return 65; // na_planta/lancamento sem status definido
}

// Compara o preco/m2 do produto com a media do bairro. Abaixo da media = bom.
function scorePrecoRelativo(emp: Empreendimento, precoMedioM2Bairro: number | null): {
  precoPorM2: number | null;
  relativo: number | null;
  score: number;
} {
  if (!emp.areaM2 || emp.areaM2 <= 0) {
    return { precoPorM2: null, relativo: null, score: 50 };
  }
  const precoPorM2 = emp.preco / emp.areaM2;
  if (!precoMedioM2Bairro || precoMedioM2Bairro <= 0) {
    return { precoPorM2, relativo: null, score: 50 };
  }
  const relativo = precoPorM2 / precoMedioM2Bairro;
  // 20% abaixo da media (0.8) => ~100; na media (1.0) => 60; 20% acima (1.2) => ~20
  const score = clamp(60 - (relativo - 1) * 200);
  return { precoPorM2, relativo, score };
}

// Normaliza renda media e densidade do bairro contra faixas de referencia de
// cidades medias brasileiras para estimar pressao de demanda.
function scorePressaoDemanda(bairro: Bairro | null): number {
  if (!bairro) return 50;
  const rendaScore = bairro.rendaMedia != null
    ? clamp(((bairro.rendaMedia - 1500) / (12000 - 1500)) * 100)
    : 50;
  const densidadeScore = bairro.densidadeDemografica != null
    ? clamp((bairro.densidadeDemografica / 12000) * 100)
    : 50;
  return rendaScore * 0.6 + densidadeScore * 0.4;
}

// IGP-M acima do IPCA sugere pressao de custo de construcao maior que a
// inflacao ao consumidor - historicamente correlacionado com valorizacao de
// imoveis novos.
function scoreMomentumMacro(macro: MacroIndicadores | null): number {
  if (!macro || macro.igpmAnual == null || macro.ipcaAnual == null) return 50;
  const spread = macro.igpmAnual - macro.ipcaAnual;
  return clamp(50 + spread * 400);
}

export function calcularScoreValorizacao(
  emp: Empreendimento,
  bairro: Bairro | null,
  macro: MacroIndicadores | null,
  precoMedioM2Bairro: number | null = null
): ScoreValorizacao {
  const preco = scorePrecoRelativo(emp, precoMedioM2Bairro);
  const pressaoDemandaBairro = scorePressaoDemanda(bairro);
  const momentumMacro = scoreMomentumMacro(macro);
  const estagioObra = scoreEstagioObra(emp);

  const score = clamp(
    preco.score * 0.35 +
      pressaoDemandaBairro * 0.25 +
      momentumMacro * 0.2 +
      estagioObra * 0.2
  );

  return {
    score: Math.round(score * 10) / 10,
    detalhes: {
      precoPorM2: preco.precoPorM2,
      precoPorM2RelativoAoBairro: preco.relativo,
      pressaoDemandaBairro: Math.round(pressaoDemandaBairro * 10) / 10,
      momentumMacro: Math.round(momentumMacro * 10) / 10,
      estagioObra,
    },
  };
}
