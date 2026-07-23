export interface AmostraCalibracao {
  projecao: number;
  realizado: number;
}

/**
 * Processo 9: compara projecao x realidade (6/12 meses depois) e gera o
 * "selo de confianca" (0-100) do modelo para um empreendimento, a partir do
 * erro percentual medio absoluto (MAPE) entre projetado e realizado.
 */
export function calcularSeloConfianca(amostras: AmostraCalibracao[]): number | null {
  const validas = amostras.filter((a) => a.projecao !== 0);
  if (validas.length === 0) return null;

  const mape =
    validas.reduce((soma, a) => soma + Math.abs((a.realizado - a.projecao) / a.projecao), 0) /
    validas.length;

  return Math.round(Math.max(0, Math.min(100, 100 - mape * 100)) * 10) / 10;
}
