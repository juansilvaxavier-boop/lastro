const VERDE: [number, number, number] = [22, 163, 74];
const AMARELO: [number, number, number] = [250, 204, 21];
const VERMELHO: [number, number, number] = [220, 38, 38];

/** Verde (barato) -> amarelo -> vermelho (caro), pela fracao (0 a 1) na faixa observada. */
export function corPorFaixaPreco(fracao: number): string {
  const clamped = Math.min(1, Math.max(0, fracao));
  const [a, b, t]: [[number, number, number], [number, number, number], number] =
    clamped <= 0.5 ? [VERDE, AMARELO, clamped / 0.5] : [AMARELO, VERMELHO, (clamped - 0.5) / 0.5];
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}
