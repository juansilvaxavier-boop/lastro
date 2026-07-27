import { formatarPercentual } from "@/lib/format";

export function RankedList({ titulo, itens }: { titulo: string; itens: { rotulo: string; valor: number }[] }) {
  const max = Math.max(...itens.map((i) => i.valor), 0.0001);

  return (
    <div>
      <h3 className="mb-3 text-xl font-bold text-slate-900">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="text-sm text-slate-400">Sem dados suficientes (cadastre preço de aluguel local para os bairros dos imóveis selecionados).</p>
      ) : (
        <div className="flex flex-col gap-2">
          {itens.map((item) => (
            <div key={item.rotulo} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-sm text-slate-600">{item.rotulo}</span>
              <div className="h-3 flex-1 rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-blue-700"
                  style={{ width: `${Math.max(4, (item.valor / max) * 100)}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-sm font-medium text-slate-700">
                {formatarPercentual(item.valor, 1)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
