import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { cenarioMacroSchema } from "@/lib/validation";

export async function GET() {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cenario_macro")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cenarioMacro: data });
}

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = cenarioMacroSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cenario_macro")
    .insert({ texto: parsed.data.texto, criado_por: guard.usuario.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cenarioMacro: data }, { status: 201 });
}
