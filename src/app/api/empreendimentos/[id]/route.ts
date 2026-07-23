import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { empreendimentoSchema } from "@/lib/validation";
import { exigirAdmin } from "@/lib/admin";
import { recalcularScoresEempreendimento } from "@/lib/pipeline";

export async function GET(_req: Request, ctx: RouteContext<"/api/empreendimentos/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const [{ data: empreendimento, error: empError }, { data: cenarios, error: cenariosError }, { data: calibracao }] =
    await Promise.all([
      supabase
        .from("empreendimentos")
        .select("*, bairros(*)")
        .eq("id", id)
        .single(),
      supabase
        .from("cenarios")
        .select("*")
        .eq("empreendimento_id", id)
        .order("calculado_em", { ascending: false })
        .limit(3),
      supabase
        .from("calibracao")
        .select("*")
        .eq("empreendimento_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (empError) return NextResponse.json({ error: empError.message }, { status: 404 });
  if (cenariosError) return NextResponse.json({ error: cenariosError.message }, { status: 500 });

  const { data: score } = await supabase
    .from("scores")
    .select("*")
    .eq("empreendimento_id", id)
    .order("calculado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ empreendimento, score, cenarios, calibracao });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/empreendimentos/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const naoAutorizado = await exigirAdmin(supabase);
  if (naoAutorizado) return naoAutorizado;

  const body = await request.json();
  const parsed = empreendimentoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const e = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("empreendimentos")
    .update({
      ...(e.nome !== undefined && { nome: e.nome }),
      ...(e.incorporadora !== undefined && { incorporadora: e.incorporadora }),
      ...(e.bairroId !== undefined && { bairro_id: e.bairroId }),
      ...(e.endereco !== undefined && { endereco: e.endereco }),
      ...(e.tipo !== undefined && { tipo: e.tipo }),
      ...(e.statusObra !== undefined && { status_obra: e.statusObra }),
      ...(e.dataEntregaPrevista !== undefined && { data_entrega_prevista: e.dataEntregaPrevista }),
      ...(e.preco !== undefined && { preco: e.preco }),
      ...(e.areaM2 !== undefined && { area_m2: e.areaM2 }),
      ...(e.quartos !== undefined && { quartos: e.quartos }),
      ...(e.vagas !== undefined && { vagas: e.vagas }),
      ...(e.valorCondominio !== undefined && { valor_condominio: e.valorCondominio }),
      ...(e.iptuAnual !== undefined && { iptu_anual: e.iptuAnual }),
      ...(e.aluguelEstimado !== undefined && { aluguel_estimado: e.aluguelEstimado }),
      ...(e.ativo !== undefined && { ativo: e.ativo }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Preco/area/tipo/status podem mudar os scores - recalcula para manter consistente.
  const scores = await recalcularScoresEempreendimento(admin, id);

  return NextResponse.json({ empreendimento: data, scores });
}
