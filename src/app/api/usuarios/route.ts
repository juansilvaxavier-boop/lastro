import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao } from "@/lib/auth";

export async function GET() {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, papel")
    .eq("ativo", true)
    .order("nome");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ usuarios: data });
}
