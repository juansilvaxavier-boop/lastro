"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, CircleCheck, CircleAlert } from "lucide-react";
import { formatarMoeda, formatarPercentual } from "@/lib/format";

interface AvaliacaoResumo {
  viavel: boolean;
  motivoInviavel: string | null;
  entradaUtilizada: number;
  parcelaEstimada: number | null;
  ganhoCapitalProjetado: number | null;
  roiCapitalProprio: number | null;
  rendaFixaComparativo: { valorFinalLiquido: number; rendimentoLiquido: number } | null;
  ganhoImovelLiquido: number | null;
  custoDoAtrasoMensal: number | null;
}

interface RecomendacaoItem {
  empreendimento: {
    id: string;
    nome: string;
    preco_total: number;
    construtora: { id: string; nome: string } | null;
    bairro: { id: string; nome: string } | null;
  };
  avaliacao: AvaliacaoResumo;
}

interface ClienteResumo {
  valor_entrada_disponivel: number | null;
  parcela_maxima_mensal: number | null;
}

export function RecomendacoesPainel({ clienteId }: { clienteId: string }) {
  const [cliente, setCliente] = useState<ClienteResumo | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<RecomendacaoItem[] | null>(null);

  useEffect(() => {
    fetch(`/api/clientes/${clienteId}/recomendacoes`)
      .then((r) => r.json())
      .then((d) => {
        setCliente(d.cliente ?? null);
        setAvaliacoes(d.avaliacoes ?? []);
      });
  }, [clienteId]);

  const semDadosFinanceiros = cliente && !cliente.valor_entrada_disponivel && !cliente.parcela_maxima_mensal;

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Recomendação de imóveis</h3>

      {semDadosFinanceiros && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Informe a entrada disponível e a parcela máxima do cliente (acima) para uma recomendação mais precisa.
        </p>
      )}

      {avaliacoes === null && <p className="text-sm text-slate-400">Calculando...</p>}
      {avaliacoes?.length === 0 && <p className="text-sm text-slate-400">Nenhum imóvel ativo cadastrado ainda.</p>}

      <div className="flex flex-col gap-3">
        {avaliacoes?.slice(0, 5).map(({ empreendimento: emp, avaliacao: av }) => {
          const rendaFixaGanho = av.rendaFixaComparativo?.rendimentoLiquido ?? null;
          const imovelGanhaDeRendaFixa =
            av.ganhoImovelLiquido !== null && rendaFixaGanho !== null ? av.ganhoImovelLiquido > rendaFixaGanho : null;

          return (
            <div key={emp.id} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{emp.nome}</p>
                  <p className="text-xs text-slate-500">
                    {emp.bairro?.nome ?? "—"} · {emp.construtora?.nome ?? "—"} ·{" "}
                    {formatarMoeda(emp.preco_total)}
                  </p>
                </div>
                {av.viavel ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <CircleCheck size={13} /> Viável
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    <CircleAlert size={13} /> Inviável
                  </span>
                )}
              </div>

              {!av.viavel && av.motivoInviavel && <p className="mb-2 text-xs text-red-600">{av.motivoInviavel}</p>}

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-slate-500">Entrada considerada</dt>
                  <dd className="font-medium text-slate-900">{formatarMoeda(av.entradaUtilizada)}</dd>
                </div>
                {av.parcelaEstimada !== null && (
                  <div>
                    <dt className="text-xs text-slate-500">Parcela estimada</dt>
                    <dd className="font-medium text-slate-900">{formatarMoeda(av.parcelaEstimada)}</dd>
                  </div>
                )}
                {av.roiCapitalProprio !== null && (
                  <div>
                    <dt className="text-xs text-slate-500">ROI sobre capital próprio</dt>
                    <dd
                      className={`flex items-center gap-1 font-medium ${av.roiCapitalProprio >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      {av.roiCapitalProprio >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {formatarPercentual(av.roiCapitalProprio, 0)}
                    </dd>
                  </div>
                )}
                {av.custoDoAtrasoMensal !== null && (
                  <div>
                    <dt className="text-xs text-slate-500">Custo de esperar 1 mês</dt>
                    <dd className="font-medium text-slate-900">{formatarMoeda(av.custoDoAtrasoMensal)}</dd>
                  </div>
                )}
              </dl>

              {av.ganhoImovelLiquido !== null && rendaFixaGanho !== null && (
                <p className="mt-2 text-xs text-slate-500">
                  Nesse prazo, o imóvel rende {formatarMoeda(av.ganhoImovelLiquido)} contra{" "}
                  {formatarMoeda(rendaFixaGanho)} numa renda fixa líquida equivalente —{" "}
                  <span className={`font-medium ${imovelGanhaDeRendaFixa ? "text-emerald-600" : "text-red-600"}`}>
                    {imovelGanhaDeRendaFixa ? "o imóvel leva vantagem." : "a renda fixa leva vantagem."}
                  </span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
