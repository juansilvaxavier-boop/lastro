"use client";

import { Button } from "./Button";

export function ConfirmDialog({
  aberto,
  titulo,
  descricao,
  confirmando,
  onConfirmar,
  onCancelar,
}: {
  aberto: boolean;
  titulo: string;
  descricao: string;
  confirmando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
        <p className="mt-2 text-sm text-slate-600">{descricao}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirmar} disabled={confirmando}>
            {confirmando ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}
