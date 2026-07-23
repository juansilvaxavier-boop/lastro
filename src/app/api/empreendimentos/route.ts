import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { empreendimentoSchema } from "@/lib/validation";
import { recalcularScoresEempreendimento } from "@/lib/pipeline";
import { exigirAdmin } from "@/lib/admin";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("empreendimentos")
    .select("*, bairros(nome, cidade), scores(score_valorizacao, score_renda, calculado_em)")
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ empreendimentos: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const naoAutorizado = await exigirAdmin(supabase);
  if (naoAutorizado) return naoAutorizado;

  const body = await request.json();
  const parsed = empreendimentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const e = parsed.data;

  // Cadastro de empreendimento e uma escrita de sistema (dado de mercado
  // compartilhado, nao pertence a um investidor) - usa o client admin para
  // contornar a RLS de leitura-publica-somente da tabela.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("empreendimentos")
    .insert({
      nome: e.nome,
      incorporadora: e.incorporadora,
      bairro_id: e.bairroId,
      endereco: e.endereco,
      tipo: e.tipo,
      status_obra: e.statusObra,
      data_entrega_prevista: e.dataEntregaPrevista,
      preco: e.preco,
      area_m2: e.areaM2,
      quartos: e.quartos,
      vagas: e.vagas,
      valor_condominio: e.valorCondominio,
      iptu_anual: e.iptuAnual,
      aluguel_estimado: e.aluguelEstimado,
      valor_venal: e.valorVenal,
      due_diligence_ok: e.dueDiligenceOk,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const scores = await recalcularScoresEempreendimento(admin, data.id);

  return NextResponse.json({ empreendimento: data, scores }, { status: 201 });
}
