import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/ScoreBadge";

export default async function AdminEmpreendimentosPage() {
  const supabase = await createClient();

  const { data: empreendimentos } = await supabase
    .from("empreendimentos")
    .select("*, bairros(nome), scores(score_valorizacao, score_renda, calculado_em)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empreendimentos</h1>
          <p className="text-sm text-slate-500">Cadastro e gestão dos imóveis do sistema.</p>
        </div>
        <Link
          href="/admin/empreendimentos/novo"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Novo empreendimento
        </Link>
      </div>

      {!empreendimentos || empreendimentos.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum empreendimento cadastrado ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Bairro</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scores</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {empreendimentos.map((emp) => {
                const scoresOrdenados = [...(emp.scores ?? [])].sort(
                  (a, b) => new Date(b.calculado_em).getTime() - new Date(a.calculado_em).getTime()
                );
                const ultimoScore = scoresOrdenados[0];
                return (
                  <tr key={emp.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-900">{emp.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{emp.bairros?.nome ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {Number(emp.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          emp.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {emp.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ultimoScore ? (
                        <div className="flex gap-1">
                          <ScoreBadge label="Val" score={Number(ultimoScore.score_valorizacao)} />
                          <ScoreBadge label="Renda" score={Number(ultimoScore.score_renda)} />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">sem score</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/empreendimentos/${emp.id}`} className="text-sm font-medium text-slate-700 hover:text-slate-900">
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
