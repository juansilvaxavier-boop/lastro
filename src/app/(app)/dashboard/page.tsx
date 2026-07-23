import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Termo } from "@/components/Termo";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/onboarding");

  const { data: matches } = await supabase
    .from("matches")
    .select("*, empreendimentos(*, bairros(nome))")
    .eq("perfil_id", perfil.id)
    .order("score_encaixe", { ascending: false });

  const { data: scoresPorEmpreendimento } = await supabase
    .from("scores")
    .select("empreendimento_id, score_valorizacao, score_renda")
    .order("calculado_em", { ascending: false });

  const ultimoScore = new Map<string, { valorizacao: number; renda: number }>();
  for (const s of scoresPorEmpreendimento ?? []) {
    if (!ultimoScore.has(s.empreendimento_id)) {
      ultimoScore.set(s.empreendimento_id, { valorizacao: Number(s.score_valorizacao), renda: Number(s.score_renda) });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Seu encaixe</h1>
        <p className="text-sm text-slate-500">
          Imóveis ordenados pelo <Termo termo="encaixe">encaixe</Termo> com o seu perfil de investidor.
        </p>
      </div>

      {!matches || matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Ainda não há empreendimentos cadastrados com score calculado. Cadastre o primeiro pela API
          (<code className="rounded bg-slate-100 px-1">POST /api/empreendimentos</code>) para ver seu encaixe aqui.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => {
            const emp = m.empreendimentos;
            if (!emp) return null;
            const scores = ultimoScore.get(emp.id);
            return (
              <Link
                key={m.id}
                href={`/dashboard/${emp.id}`}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-sm"
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {emp.bairros?.nome ?? "Bairro não informado"}
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900">{emp.nome}</h2>
                  <p className="text-sm text-slate-500">
                    {Number(emp.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ScoreBadge label="Encaixe" score={Number(m.score_encaixe)} />
                  {scores && (
                    <>
                      <ScoreBadge label="Valorização" score={scores.valorizacao} />
                      <ScoreBadge label="Renda" score={scores.renda} />
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
