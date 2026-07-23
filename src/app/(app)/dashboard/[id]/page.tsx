import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Termo } from "@/components/Termo";
import { FinanciamentoSimulador } from "@/components/FinanciamentoSimulador";
import { WatchlistButtons } from "@/components/WatchlistButtons";

const moeda = (v: number | null) =>
  v == null ? "—" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default async function EmpreendimentoPage({ params }: PageProps<"/dashboard/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: emp, error } = await supabase
    .from("empreendimentos")
    .select("*, bairros(*)")
    .eq("id", id)
    .single();
  if (error || !emp) notFound();

  const [{ data: score }, { data: cenarios }, { data: calibracao }] = await Promise.all([
    supabase
      .from("scores")
      .select("*")
      .eq("empreendimento_id", id)
      .order("calculado_em", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("cenarios").select("*").eq("empreendimento_id", id).order("calculado_em", { ascending: false }).limit(3),
    supabase.from("calibracao").select("*").eq("empreendimento_id", id).order("created_at", { ascending: false }),
  ]);

  const cenariosPorTipo = new Map((cenarios ?? []).map((c) => [c.tipo, c]));
  const seloConfianca = calibracao?.[0]?.selo_confianca ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-slate-700">
          ← voltar
        </Link>
        <div className="mt-1 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {emp.bairros?.nome} · {emp.incorporadora ?? "Incorporadora não informada"}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{emp.nome}</h1>
            <p className="text-sm text-slate-500">{moeda(Number(emp.preco))}</p>
          </div>
          <a
            href={`/api/empreendimentos/${id}/pdf`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Exportar PDF
          </a>
        </div>
      </div>

      {score && (
        <div className="flex flex-wrap gap-2">
          <ScoreBadge label="Score valorização" score={Number(score.score_valorizacao)} />
          <ScoreBadge label="Score renda" score={Number(score.score_renda)} />
          {seloConfianca != null && <ScoreBadge label="Selo de confiança" score={Number(seloConfianca)} />}
        </div>
      )}

      <WatchlistButtons empreendimentoId={id} />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          <Termo termo="cenário base">Cenários</Termo> de valorização (3 anos)
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["pessimista", "base", "otimista"] as const).map((tipo) => {
            const c = cenariosPorTipo.get(tipo);
            return (
              <div key={tipo} className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-medium capitalize text-slate-500">
                  <Termo termo={`cenário ${tipo}`}>{tipo}</Termo>
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {c ? `${c.valorizacao_projetada_pct > 0 ? "+" : ""}${c.valorizacao_projetada_pct}%` : "—"}
                </p>
                {c?.renda_projetada_mensal != null && (
                  <p className="text-xs text-slate-500">Aluguel projetado: {moeda(Number(c.renda_projetada_mensal))}/mês</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <FinanciamentoSimulador empreendimentoId={id} preco={Number(emp.preco)} />
      </section>

      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-3">
        <Info label="Tipo" value={emp.tipo} />
        <Info label="Status da obra" value={emp.status_obra ?? "—"} />
        <Info label="Área" value={emp.area_m2 ? `${emp.area_m2} m²` : "—"} />
        <Info label="Condomínio" value={moeda(emp.valor_condominio ? Number(emp.valor_condominio) : null)} />
        <Info label="IPTU anual" value={moeda(emp.iptu_anual ? Number(emp.iptu_anual) : null)} />
        <Info label="Aluguel estimado" value={moeda(emp.aluguel_estimado ? Number(emp.aluguel_estimado) : null)} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-900">{value}</p>
    </div>
  );
}
