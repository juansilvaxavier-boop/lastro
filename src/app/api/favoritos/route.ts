import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao } from "@/lib/auth";
import { favoritoSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = favoritoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("favoritos")
    .select("usuario_id")
    .eq("usuario_id", guard.usuario.id)
    .eq("empreendimento_id", parsed.data.empreendimentoId)
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from("favoritos")
      .delete()
      .eq("usuario_id", guard.usuario.id)
      .eq("empreendimento_id", parsed.data.empreendimentoId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ favoritado: false });
  }

  const { error } = await supabase
    .from("favoritos")
    .insert({ usuario_id: guard.usuario.id, empreendimento_id: parsed.data.empreendimentoId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favoritado: true });
}
