"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PanelLeft, Search, ChevronDown } from "lucide-react";
import { PlaceholderIllustration } from "./PlaceholderIllustration";
import { createClient } from "@/lib/supabase/client";

export function Topbar({
  collapsed,
  onToggleCollapsed,
  nome,
  email,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  nome: string | null;
  email: string | null;
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const alvo = e.target as HTMLElement | null;
      if (alvo && ["INPUT", "TEXTAREA"].includes(alvo.tagName)) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function sair() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-gray-100"
      >
        <PanelLeft size={20} />
      </button>

      <Link href="/tendencias" className="shrink-0 text-2xl font-bold tracking-tight text-slate-900">
        Lastro
      </Link>

      <div className="relative w-full max-w-xl flex-1">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="search"
          placeholder="Pesquise no lastro..."
          className="w-full rounded-full bg-gray-100 py-2.5 pl-10 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-300">
          /
        </span>
      </div>

      <div className="relative ml-auto shrink-0">
        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          className="flex items-center gap-1.5"
          aria-label="Menu do usuário"
        >
          <span className="h-9 w-9 overflow-hidden rounded-full border border-gray-200">
            <PlaceholderIllustration className="h-full w-full" />
          </span>
          <ChevronDown size={16} className="text-slate-500" />
        </button>

        {menuAberto && (
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
            <p className="truncate text-sm font-semibold text-slate-900">{nome ?? "Usuário"}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
            <button
              type="button"
              onClick={sair}
              className="mt-3 w-full rounded-full border border-gray-200 py-1.5 text-sm font-medium text-slate-700 hover:bg-gray-50"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
