"use client";

import { createContext, useContext } from "react";
import type { Papel } from "@/lib/auth";

export interface UsuarioSessao {
  id: string;
  nome: string | null;
  email: string | null;
  papel: Papel;
}

const UsuarioContext = createContext<UsuarioSessao | null>(null);

export function UsuarioProvider({ usuario, children }: { usuario: UsuarioSessao; children: React.ReactNode }) {
  return <UsuarioContext.Provider value={usuario}>{children}</UsuarioContext.Provider>;
}

export function useUsuario(): UsuarioSessao {
  const ctx = useContext(UsuarioContext);
  if (!ctx) throw new Error("useUsuario deve ser usado dentro de UsuarioProvider");
  return ctx;
}

export function podeEditar(papel: Papel): boolean {
  return papel === "admin" || papel === "gestor";
}
