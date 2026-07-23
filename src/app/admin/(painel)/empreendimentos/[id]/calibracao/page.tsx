import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalibracaoForm } from "@/components/admin/CalibracaoForm";
import { ScoreBadge } from "@/components/ScoreBadge";

export default async function CalibracaoEmpreendimentoPage({ params }: PageProps<"/admin/empreendimentos/[id]/calibracao">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: emp, error }, { data: historico }] = await Promise.all([
    supabase.from("empreendimentos").select("id, nome").eq("id", id).single(),
    supabase.from("calibracao").select("*").eq("empreendimento_id", id).order("created_at", { ascending: false }),
  ]);
  if (error || !emp) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/empreendimentos/${id}`} className="text-sm text-slate-400 hover:text-slate-700">
          ← voltar para o empreendimento
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Calibração — {emp.nome}</h1>
        <p className="text-sm text-slate-500">
          Projeção x realidade 6/12 meses depois. Cada nova medição recalcula o selo de confiança do modelo.
        </p>
      </div>

      <CalibracaoForm empreendimentoId={id} />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-slate-900">Histórico</h2>
        {!historico || historico.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma medição registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Meses</th>
                  <th className="px-4 py-3">Valorização (proj. x real.)</th>
                  <th className="px-4 py-3">Renda (proj. x real.)</th>
                  <th className="px-4 py-3">Selo de confiança</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h) => (
                  <tr key={h.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-600">{new Date(h.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-slate-600">{h.meses_depois}</td>
                    <td className="px-4 py-3 text-slate-900">
                      {h.projecao_valorizacao_pct ?? "—"}% × {h.valorizacao_realizada_pct ?? "—"}%
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {h.projecao_renda ?? "—"} × {h.renda_realizada ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {h.selo_confianca != null ? <ScoreBadge label="Selo" score={Number(h.selo_confianca)} /> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
