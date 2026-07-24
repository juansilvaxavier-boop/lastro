import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { empreendimentoSchema } from "@/lib/validation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empreendimentos")
    .select("*, construtora:construtoras(id, nome), bairro:localizacoes(id, nome, parent_id)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({ empreendimento: data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const body = await request.json();
  const parsed = empreendimentoSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empreendimentos")
    .update({
      nome: d.nome,
      construtora_id: d.construtoraId,
      bairro_id: d.bairroId,
      metragem_privativa: d.metragemPrivativa,
      metragem_total: d.metragemTotal,
      preco_total: d.precoTotal,
      data_lancamento: d.dataLancamento,
      data_entrega_prevista: d.dataEntregaPrevista,
      data_entrega_real: d.dataEntregaReal,
      indice_correcao_obra: d.indiceCorrecaoObra,
      indice_correcao_pos_entrega: d.indiceCorrecaoPosEntrega,
      status: d.status,
      unidades_totais: d.unidadesTotais,
      unidades_disponiveis: d.unidadesDisponiveis,
      imagem_url: d.imagemUrl,
      ativo: d.ativo,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ empreendimento: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { error } = await supabase.from("empreendimentos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
