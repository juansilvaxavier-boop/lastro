"use client";

import { useState } from "react";
import { GLOSSARIO } from "@/lib/glossario";

/** Envolve um termo tecnico com um tooltip explicativo (glossario embutido no dashboard). */
export function Termo({ termo, children }: { termo: keyof typeof GLOSSARIO | string; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const definicao = GLOSSARIO[termo];

  if (!definicao) return <>{children}</>;

  return (
    <span
      className="relative inline-flex cursor-help items-center gap-1 border-b border-dotted border-slate-400"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
      onFocus={() => setAberto(true)}
      onBlur={() => setAberto(false)}
      tabIndex={0}
    >
      {children}
      {aberto && (
        <span className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-snug text-white shadow-lg">
          {definicao}
        </span>
      )}
    </span>
  );
}
