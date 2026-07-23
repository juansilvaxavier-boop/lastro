import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
  if (!perfil) return NextResponse.json({ error: "Perfil ainda nao criado" }, { status: 404 });

  const { data, error } = await supabase
    .from("alertas")
    .select("*, empreendimentos(nome)")
    .eq("perfil_id", perfil.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alertas: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id obrigatorio" }, { status: 400 });

  const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
  if (!perfil) return NextResponse.json({ error: "Perfil ainda nao criado" }, { status: 404 });

  const { error } = await supabase
    .from("alertas")
    .update({ lido: true })
    .eq("id", id)
    .eq("perfil_id", perfil.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
