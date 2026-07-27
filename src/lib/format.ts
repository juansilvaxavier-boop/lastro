export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function formatarPercentual(valor: number | null | undefined, casas = 1): string {
  if (valor === null || valor === undefined) return "—";
  return `${(valor * 100).toFixed(casas)}%`;
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function paraNumero(valor: string): number | undefined {
  if (valor.trim() === "") return undefined;
  const n = Number(valor);
  return Number.isNaN(n) ? undefined : n;
}
