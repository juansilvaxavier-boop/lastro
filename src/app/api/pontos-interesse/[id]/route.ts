import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import { pontoInteresseSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const body = await request.json();
  const parsed = pontoInteresseSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pontos_interesse")
    .update({
      cidade_id: d.cidadeId,
      nome: d.nome,
      tipo: d.tipo,
      descricao: d.descricao,
      previsao_conclusao: d.previsaoConclusao,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pontoInteresse: data });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { error } = await supabase.from("pontos_interesse").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
