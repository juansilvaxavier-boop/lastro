import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao } from "@/lib/auth";
import { clienteSchema } from "@/lib/validation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*, corretor:usuarios(id, nome)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!cliente) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { data: interacoes } = await supabase
    .from("interacoes")
    .select("*, usuario:usuarios(id, nome)")
    .eq("cliente_id", id)
    .order("data", { ascending: false });

  return NextResponse.json({ cliente, interacoes: interacoes ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const body = await request.json();
  const parsed = clienteSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clientes")
    .update({
      nome: d.nome,
      telefone: d.telefone,
      email: d.email,
      perfil: d.perfil,
      origem_lead: d.origemLead,
      corretor_responsavel_id: d.corretorResponsavelId,
      etapa_funil: d.etapaFunil,
      orcamento_min: d.orcamentoMin,
      orcamento_max: d.orcamentoMax,
      forma_pagamento_pretendida: d.formaPagamentoPretendida,
      renda_informada: d.rendaInformada,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (d.empreendimentoInteresseId) {
    await supabase
      .from("cliente_imovel_interesse")
      .upsert(
        { cliente_id: id, empreendimento_id: d.empreendimentoInteresseId },
        { onConflict: "cliente_id,empreendimento_id" }
      );
  }

  return NextResponse.json({ cliente: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { error } = await supabase.from("clientes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
