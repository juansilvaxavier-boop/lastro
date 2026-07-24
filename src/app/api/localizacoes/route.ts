import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { localizacaoSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const tipo = request.nextUrl.searchParams.get("tipo");
  const supabase = await createClient();
  let query = supabase.from("localizacoes").select("*").order("nome");
  if (tipo) query = query.eq("tipo", tipo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ localizacoes: data });
}

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = localizacaoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("localizacoes")
    .insert({ nome: parsed.data.nome, tipo: parsed.data.tipo, parent_id: parsed.data.parentId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ localizacao: data }, { status: 201 });
}
