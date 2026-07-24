import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  titulo,
  descricao,
  acao,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
      <Icon size={32} className="text-slate-300" />
      <p className="mt-4 text-base font-semibold text-slate-900">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-slate-500">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}
