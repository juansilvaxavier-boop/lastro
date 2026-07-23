import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil) return NextResponse.json({ error: "Perfil ainda nao criado" }, { status: 404 });

  const { data, error } = await supabase
    .from("matches")
    .select("*, empreendimentos(*, bairros(nome))")
    .eq("perfil_id", perfil.id)
    .order("score_encaixe", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data });
}
