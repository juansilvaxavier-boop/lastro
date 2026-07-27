import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type Papel = "admin" | "corretor" | "gestor";
export type Usuario = Tables<"usuarios">;

/** Usuario logado (sessao + linha em `usuarios`), ou null se nao autenticado/sem cadastro. */
export async function obterUsuarioAtual(): Promise<Usuario | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase.from("usuarios").select("*").eq("id", user.id).maybeSingle();
  return usuario;
}

/** Guarda para Route Handlers: exige sessao + usuario ativo. */
export async function exigirSessao(): Promise<{ usuario: Usuario } | { resposta: NextResponse }> {
  const usuario = await obterUsuarioAtual();
  if (!usuario) {
    return { resposta: NextResponse.json({ error: "Nao autenticado" }, { status: 401 }) };
  }
  if (!usuario.ativo) {
    return { resposta: NextResponse.json({ error: "Usuario inativo" }, { status: 403 }) };
  }
  return { usuario };
}

/** Guarda para Route Handlers: exige sessao + papel dentre os permitidos. */
export async function exigirPapel(papeis: Papel[]): Promise<{ usuario: Usuario } | { resposta: NextResponse }> {
  const resultado = await exigirSessao();
  if ("resposta" in resultado) return resultado;
  if (!papeis.includes(resultado.usuario.papel as Papel)) {
    return { resposta: NextResponse.json({ error: "Sem permissao para esta acao" }, { status: 403 }) };
  }
  return resultado;
}

export function podeEditar(usuario: Pick<Usuario, "papel">): boolean {
  return usuario.papel === "admin" || usuario.papel === "gestor";
}
