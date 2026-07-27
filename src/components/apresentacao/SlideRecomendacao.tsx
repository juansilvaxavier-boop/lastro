"use client";

import { RecomendacoesPainel } from "@/components/clientes/RecomendacoesPainel";

export function SlideRecomendacao({ clienteId }: { clienteId: string }) {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Recomendação personalizada</h1>
      <RecomendacoesPainel clienteId={clienteId} />
    </div>
  );
}
