import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { pontoInteresseSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const cidadeId = request.nextUrl.searchParams.get("cidadeId");
  const supabase = await createClient();
  let query = supabase.from("pontos_interesse").select("*").order("nome");
  if (cidadeId) query = query.eq("cidade_id", cidadeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pontosInteresse: data });
}

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = pontoInteresseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pontos_interesse")
    .insert({
      cidade_id: d.cidadeId,
      nome: d.nome,
      tipo: d.tipo,
      descricao: d.descricao,
      previsao_conclusao: d.previsaoConclusao,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pontoInteresse: data }, { status: 201 });
}
