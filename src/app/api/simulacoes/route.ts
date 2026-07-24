import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao } from "@/lib/auth";
import { simulacaoSchema } from "@/lib/validation";
import {
  simularAVista,
  simularFinanciamento,
  simularParcelasObra,
  simularFluxoPersonalizado,
  excedeComprometimentoRenda,
  type SistemaAmortizacao,
} from "@/lib/engine";

export async function POST(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = simulacaoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const p = d.parametros as Record<string, number | string | boolean | undefined | Record<string, unknown>>;

  const supabase = await createClient();
  const { data: empreendimento } = await supabase
    .from("empreendimentos")
    .select("preco_total")
    .eq("id", d.empreendimentoId)
    .maybeSingle();
  if (!empreendimento) return NextResponse.json({ error: "Empreendimento não encontrado" }, { status: 404 });

  let resultado: unknown;
  let valorEntrada: number | null = null;
  let numParcelasObra: number | null = null;
  let sistemaAmortizacao: SistemaAmortizacao | null = null;
  let taxaJurosAplicada: number | null = null;
  let prazoFinanciamentoMeses: number | null = null;
  let parcelaRepresentativa: number | null = null;

  switch (d.formaPagamento) {
    case "a_vista": {
      const r = simularAVista(empreendimento.preco_total, Number(p.percentualDesconto ?? 0));
      resultado = r;
      break;
    }
    case "financiamento_bancario": {
      valorEntrada = Number(p.valorEntrada ?? 0);
      numParcelasObra = Number(p.numParcelas ?? 0);
      sistemaAmortizacao = (p.sistema as SistemaAmortizacao) ?? "SAC";
      taxaJurosAplicada = Number(p.taxaJurosAnual ?? 0);
      prazoFinanciamentoMeses = numParcelasObra;
      const r = simularFinanciamento({
        preco: empreendimento.preco_total,
        valorEntrada,
        numParcelas: numParcelasObra,
        taxaJurosAnual: taxaJurosAplicada,
        sistema: sistemaAmortizacao,
      });
      resultado = r;
      parcelaRepresentativa = r.parcelaInicial;
      break;
    }
    case "financiamento_construtora": {
      valorEntrada = Number(p.valorEntrada ?? 0);
      numParcelasObra = Number(p.numParcelasObra ?? 0);
      sistemaAmortizacao = (p.sistemaPosEntrega as SistemaAmortizacao) ?? "SAC";
      taxaJurosAplicada = Number(p.taxaJurosAnualPosEntrega ?? 0);
      prazoFinanciamentoMeses = Number(p.numParcelasPosEntrega ?? 0);
      const r = simularParcelasObra({
        precoTotal: empreendimento.preco_total,
        valorEntrada,
        numParcelasObra,
        taxaIncMensal: Number(p.taxaIncMensal ?? 0),
        percentualFinanciadoNaEntrega: Number(p.percentualFinanciadoNaEntrega ?? 0),
        converterEmFinanciamentoBancario: Boolean(p.converterEmFinanciamentoBancario),
        taxaJurosAnualPosEntrega: taxaJurosAplicada,
        numParcelasPosEntrega: prazoFinanciamentoMeses,
        sistemaPosEntrega: sistemaAmortizacao,
      });
      resultado = r;
      parcelaRepresentativa = r.tabelaObra[0]?.valorCorrigido ?? null;
      break;
    }
    case "fluxo_personalizado": {
      valorEntrada = Number(p.valorEntrada ?? 0);
      const r = simularFluxoPersonalizado({
        valorEntrada,
        parcelasMensais: p.parcelasMensais as never,
        baloes: p.baloes as never,
        valorNaEntrega: p.valorNaEntrega as never,
        saldoFinanciado: p.saldoFinanciado as never,
      });
      resultado = r;
      break;
    }
  }

  let clienteRendaInformada: number | null = null;
  if (d.clienteId) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("renda_informada")
      .eq("id", d.clienteId)
      .maybeSingle();
    clienteRendaInformada = cliente?.renda_informada ?? null;
  }
  const alertaComprometimentoRenda =
    parcelaRepresentativa !== null && excedeComprometimentoRenda(parcelaRepresentativa, clienteRendaInformada);

  const { data: simulacao, error } = await supabase
    .from("simulacoes")
    .insert({
      empreendimento_id: d.empreendimentoId,
      cliente_id: d.clienteId ?? null,
      forma_pagamento: d.formaPagamento,
      valor_entrada: valorEntrada,
      num_parcelas_obra: numParcelasObra,
      sistema_amortizacao: sistemaAmortizacao,
      taxa_juros_aplicada: taxaJurosAplicada,
      prazo_financiamento_meses: prazoFinanciamentoMeses,
      resultado: resultado as never,
      criado_por: guard.usuario.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ simulacao, alertaComprometimentoRenda }, { status: 201 });
}
