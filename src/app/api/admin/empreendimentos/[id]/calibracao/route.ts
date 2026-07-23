import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calibracaoSchema } from "@/lib/validation";
import { exigirAdmin } from "@/lib/admin";
import { calcularSeloConfianca } from "@/lib/engine";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/empreendimentos/[id]/calibracao">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const naoAutorizado = await exigirAdmin(supabase);
  if (naoAutorizado) return naoAutorizado;

  const { data, error } = await supabase
    .from("calibracao")
    .select("*")
    .eq("empreendimento_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ calibracao: data });
}

/**
 * Processo 9: registra uma medicao de projecao x realidade (6/12 meses
 * depois) e recalcula o selo de confianca do empreendimento a partir de
 * todo o historico registrado ate aqui.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/empreendimentos/[id]/calibracao">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const naoAutorizado = await exigirAdmin(supabase);
  if (naoAutorizado) return naoAutorizado;

  const body = await request.json();
  const parsed = calibracaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const c = parsed.data;

  const admin = createAdminClient();

  const { data: historico, error: historicoError } = await admin
    .from("calibracao")
    .select("projecao_valorizacao_pct, valorizacao_realizada_pct")
    .eq("empreendimento_id", id);
  if (historicoError) return NextResponse.json({ error: historicoError.message }, { status: 500 });

  const amostras = [
    ...(historico ?? [])
      .filter((h) => h.projecao_valorizacao_pct != null && h.valorizacao_realizada_pct != null)
      .map((h) => ({ projecao: Number(h.projecao_valorizacao_pct), realizado: Number(h.valorizacao_realizada_pct) })),
    ...(c.projecaoValorizacaoPct != null && c.valorizacaoRealizadaPct != null
      ? [{ projecao: c.projecaoValorizacaoPct, realizado: c.valorizacaoRealizadaPct }]
      : []),
  ];
  const seloConfianca = calcularSeloConfianca(amostras);

  const { data, error } = await admin
    .from("calibracao")
    .insert({
      empreendimento_id: id,
      meses_depois: c.mesesDepois,
      projecao_valorizacao_pct: c.projecaoValorizacaoPct,
      valorizacao_realizada_pct: c.valorizacaoRealizadaPct,
      projecao_renda: c.projecaoRenda,
      renda_realizada: c.rendaRealizada,
      observacoes: c.observacoes,
      selo_confianca: seloConfianca,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ calibracao: data }, { status: 201 });
}
