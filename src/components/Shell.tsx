"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatAssistente } from "./assistente/ChatAssistente";
import { useUsuario, podeEditar } from "./UsuarioContext";

export function Shell({
  nome,
  email,
  children,
}: {
  nome: string | null;
  email: string | null;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const usuario = useUsuario();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <Topbar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} nome={nome} email={email} />
      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} />
        <main className="min-w-0 flex-1 px-6 py-8">{children}</main>
      </div>
      {podeEditar(usuario.papel) && <ChatAssistente />}
    </div>
  );
}
