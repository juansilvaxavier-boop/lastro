import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { construtoraSchema } from "@/lib/validation";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { data: construtora, error } = await supabase.from("construtoras").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!construtora) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });

  const { data: empreendimentos } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("construtora_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ construtora, empreendimentos: empreendimentos ?? [] });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const body = await request.json();
  const parsed = construtoraSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("construtoras")
    .update({
      nome: parsed.data.nome,
      cnpj: parsed.data.cnpj,
      ano_fundacao: parsed.data.anoFundacao,
      reputacao_score: parsed.data.reputacaoScore,
      status_certidoes: parsed.data.statusCertidoes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ construtora: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { error } = await supabase.from("construtoras").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
