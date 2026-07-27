"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

const FRASE_CONFIRMACAO = "RESETAR";

export function ResetarDadosMercadoModal({ onSucesso }: { onSucesso: () => void }) {
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function resetar() {
    setEnviando(true);
    setErro(null);
    const res = await fetch("/api/dados/resetar", { method: "POST" });
    setEnviando(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErro(data.error?.toString?.() ?? "Não foi possível resetar os dados.");
      return;
    }
    setConfirmacao("");
    onSucesso();
  }

  return (
    <div>
      <div className="mb-4 flex gap-3 rounded-xl bg-red-50 p-4 text-red-800">
        <AlertTriangle size={20} className="mt-0.5 shrink-0" />
        <p className="text-sm">
          Isso apaga <strong>permanentemente</strong> todos os indicadores nacionais (Selic, CDI, IPCA, IGP-M, INCC) e
          todos os preços locais (venda, aluguel e hospedagem) cadastrados no sistema. Não afeta clientes, imóveis,
          construtoras ou regiões. Não é possível desfazer.
        </p>
      </div>

      <Field label={`Digite "${FRASE_CONFIRMACAO}" para confirmar`}>
        <input
          className="input"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          placeholder={FRASE_CONFIRMACAO}
        />
      </Field>

      {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

      <div className="mt-5">
        <Button variant="danger" onClick={resetar} disabled={confirmacao !== FRASE_CONFIRMACAO || enviando}>
          {enviando ? "Resetando..." : "Resetar dados de mercado"}
        </Button>
      </div>
    </div>
  );
}
