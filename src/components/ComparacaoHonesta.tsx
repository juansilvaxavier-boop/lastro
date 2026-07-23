const VOLATILIDADE_POR_TIPO: Record<string, string> = {
  lancamento: "Alta (~9% a.a.)",
  na_planta: "Média-alta (~8% a.a.)",
  pronto: "Média (~5% a.a.)",
  usado: "Baixa-média (~4% a.a.)",
};

interface Props {
  tipoEmpreendimento: string;
  yieldLiquidoAnual: number | null;
  valorizacaoBaseAnualPct: number | null;
  cdiAnual: number | null;
  fiiRendimentoAnual: number | null;
}

const pct = (v: number | null) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);

export function ComparacaoHonesta({
  tipoEmpreendimento,
  yieldLiquidoAnual,
  valorizacaoBaseAnualPct,
  cdiAnual,
  fiiRendimentoAnual,
}: Props) {
  const retornoImovel =
    (yieldLiquidoAnual ?? 0) + (valorizacaoBaseAnualPct ?? 0);

  const linhas = [
    {
      dimensao: "Retorno esperado (a.a.)",
      imovel: `${pct(retornoImovel)} (${pct(yieldLiquidoAnual)} renda + ${pct(valorizacaoBaseAnualPct)} valorização)`,
      cdi: pct(cdiAnual),
      fiis: fiiRendimentoAnual != null ? pct(fiiRendimentoAnual) : "sem dado sincronizado",
    },
    {
      dimensao: "Liquidez",
      imovel: "Baixa — venda pode levar meses",
      cdi: "Alta — resgate em D+0/D+1",
      fiis: "Alta — venda em bolsa, D+2",
    },
    {
      dimensao: "Volatilidade",
      imovel: VOLATILIDADE_POR_TIPO[tipoEmpreendimento] ?? "Média",
      cdi: "Muito baixa — renda fixa pós-fixada",
      fiis: "Média — cotação oscila com bolsa e juros",
    },
    {
      dimensao: "Alavancagem",
      imovel: "Sim — financiamento imobiliário (SAC/PRICE)",
      cdi: "Incomum para pessoa física",
      fiis: "Possível em produtos específicos, incomum",
    },
    {
      dimensao: "Concentração",
      imovel: "100% em um único ativo",
      cdi: "Baixa — título pulverizado/garantido",
      fiis: "Diversificada — múltiplos imóveis por cota",
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Comparação honesta</h2>
      <p className="mb-4 text-xs text-slate-500">Este imóvel × CDI × FIIs — sem esconder os pontos fracos de cada um.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2 pr-4">Dimensão</th>
              <th className="py-2 pr-4">Este imóvel</th>
              <th className="py-2 pr-4">CDI</th>
              <th className="py-2">FIIs (média mercado)</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.dimensao} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4 font-medium text-slate-700">{l.dimensao}</td>
                <td className="py-2 pr-4 text-slate-900">{l.imovel}</td>
                <td className="py-2 pr-4 text-slate-600">{l.cdi}</td>
                <td className="py-2 text-slate-600">{l.fiis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
