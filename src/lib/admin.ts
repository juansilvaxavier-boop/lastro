import { NextResponse } from "next/server";
import type { createClient } from "@/lib/supabase/server";

/** Verifica se o usuario autenticado tem uma linha na tabela admins. */
export async function ehAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.from("admins").select("id").eq("id", userId).maybeSingle();
  return !!data;
}

/**
 * Garante que a rota so prossiga para um admin autenticado. Retorna a
 * NextResponse de erro para devolver imediatamente, ou null se autorizado.
 */
export async function exigirAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<NextResponse | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const admin = await ehAdmin(supabase, user.id);
  if (!admin) return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });

  return null;
}
