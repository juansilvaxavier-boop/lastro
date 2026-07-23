import type { Empreendimento, MatchResult, Perfil } from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function pesosBase(objetivo: Perfil["objetivo"]): { valorizacao: number; renda: number } {
  switch (objetivo) {
    case "valorizacao":
      return { valorizacao: 0.8, renda: 0.2 };
    case "renda":
      return { valorizacao: 0.2, renda: 0.8 };
    case "misto":
    default:
      return { valorizacao: 0.5, renda: 0.5 };
  }
}

// Prazo curto pede caixa mais imediato (renda); prazo longo tolera esperar a
// valorizacao se realizar.
function ajustarPesosPorPrazo(
  pesos: { valorizacao: number; renda: number },
  prazo: Perfil["prazo"]
): { valorizacao: number; renda: number } {
  const tilt = 0.1;
  if (prazo === "curto") {
    return { valorizacao: pesos.valorizacao - tilt, renda: pesos.renda + tilt };
  }
  if (prazo === "longo") {
    return { valorizacao: pesos.valorizacao + tilt, renda: pesos.renda - tilt };
  }
  return pesos;
}

function normalizarPesos(pesos: { valorizacao: number; renda: number }) {
  const v = clamp(pesos.valorizacao, 0, 1);
  const r = clamp(pesos.renda, 0, 1);
  const soma = v + r || 1;
  return { valorizacao: v / soma, renda: r / soma };
}

// Imoveis na planta/lancamento prendem capital por anos - penaliza perfis que
// declararam precisar de liquidez.
function penalidadeLiquidez(perfil: Perfil, emp: Empreendimento): number {
  const ilíquido = emp.tipo === "na_planta" || emp.tipo === "lancamento";
  if (!ilíquido) return 0;
  if (perfil.liquidez === "alta") return 20;
  if (perfil.liquidez === "media") return 10;
  return 0;
}

// Obra nao iniciada carrega risco de atraso/distrato - penaliza perfis
// avessos a risco.
function penalidadeRisco(perfil: Perfil, emp: Empreendimento): number {
  const arriscado = emp.statusObra === "nao_iniciada";
  if (!arriscado) return 0;
  if (perfil.toleranciaRisco === "baixa") return 20;
  if (perfil.toleranciaRisco === "media") return 10;
  return 0;
}

export function calcularEncaixe(
  perfil: Perfil,
  emp: Empreendimento,
  scoreValorizacao: number,
  scoreRenda: number
): MatchResult {
  const pesos = normalizarPesos(ajustarPesosPorPrazo(pesosBase(perfil.objetivo), perfil.prazo));

  const scoreBase = pesos.valorizacao * scoreValorizacao + pesos.renda * scoreRenda;
  const pLiquidez = penalidadeLiquidez(perfil, emp);
  const pRisco = penalidadeRisco(perfil, emp);

  const scoreEncaixe = clamp(scoreBase - pLiquidez - pRisco);

  return {
    scoreEncaixe: Math.round(scoreEncaixe * 10) / 10,
    pesos,
    detalhes: { penalidadeLiquidez: pLiquidez, penalidadeRisco: pRisco },
  };
}
