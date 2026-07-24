import { TrendingUp, TrendingDown } from "lucide-react";
import { formatarPercentual } from "@/lib/format";

export interface ItemRankingBairro {
  id: string;
  nome: string;
  precoM2: number;
  variacao12m: number | null;
}

export function RankingBairros({ itens }: { itens: ItemRankingBairro[] }) {
  if (itens.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Nenhum bairro com preço de venda cadastrado ainda (cadastre em Dados → + Novo dado).
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Bairro</th>
            <th className="px-4 py-3 font-medium">Preço médio/m²</th>
            <th className="px-4 py-3 font-medium">Variação em 12 meses</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id} className="border-b border-gray-50 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-900">{item.nome}</td>
              <td className="px-4 py-3">
                {item.precoM2.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </td>
              <td className="px-4 py-3">
                {item.variacao12m === null ? (
                  "—"
                ) : (
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      item.variacao12m >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {item.variacao12m >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {formatarPercentual(item.variacao12m, 1)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
