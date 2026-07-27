import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";

export async function POST() {
  const guard = await exigirPapel(["admin"]);
  if ("resposta" in guard) return guard.resposta;

  const supabase = await createClient();
  const { error } = await supabase.rpc("resetar_dados_mercado");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
