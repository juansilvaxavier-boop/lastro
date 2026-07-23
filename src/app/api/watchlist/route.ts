import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { watchlistSchema } from "@/lib/validation";

async function perfilDoUsuario(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("perfis").select("id").eq("user_id", userId).maybeSingle();
  return data;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const perfil = await perfilDoUsuario(supabase, user.id);
  if (!perfil) return NextResponse.json({ error: "Perfil ainda nao criado" }, { status: 404 });

  const { data, error } = await supabase
    .from("watchlist")
    .select("*, empreendimentos(*, bairros(nome))")
    .eq("perfil_id", perfil.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ watchlist: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const perfil = await perfilDoUsuario(supabase, user.id);
  if (!perfil) return NextResponse.json({ error: "Perfil ainda nao criado" }, { status: 404 });

  const body = await request.json();
  const parsed = watchlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const w = parsed.data;

  const { data, error } = await supabase
    .from("watchlist")
    .upsert(
      {
        perfil_id: perfil.id,
        empreendimento_id: w.empreendimentoId,
        status: w.status,
        motivo_descarte: w.motivoDescarte,
      },
      { onConflict: "perfil_id,empreendimento_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
