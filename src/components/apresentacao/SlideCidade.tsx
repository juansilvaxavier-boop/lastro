"use client";

import { InfoSocioeconomica } from "@/components/regioes/InfoSocioeconomica";
import type { Localizacao } from "@/types/dominio";

export function SlideCidade({ cidade }: { cidade: Localizacao }) {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-slate-900">{cidade.nome}</h1>
      <InfoSocioeconomica localizacao={cidade} editavel={false} onAtualizado={() => {}} />
    </div>
  );
}
