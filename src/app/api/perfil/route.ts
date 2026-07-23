import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { perfilSchema } from "@/lib/validation";
import { recalcularMatchesPerfil } from "@/lib/pipeline";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ perfil: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = perfilSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const p = parsed.data;

  const { data, error } = await supabase
    .from("perfis")
    .upsert(
      {
        user_id: user.id,
        nome: p.nome,
        objetivo: p.objetivo,
        prazo: p.prazo,
        liquidez: p.liquidez,
        tolerancia_risco: p.toleranciaRisco,
        capital_disponivel: p.capitalDisponivel,
        refinamento: (p.refinamento ?? {}) as never,
        onboarding_completo: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  try {
    await recalcularMatchesPerfil(supabase, data.id);
  } catch {
    // recalculo de matches nao deve bloquear o salvamento do perfil
  }

  return NextResponse.json({ perfil: data });
}
