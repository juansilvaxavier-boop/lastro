import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao } from "@/lib/auth";
import { clienteSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const params = request.nextUrl.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clientes")
    .select("*, corretor:usuarios(id, nome)")
    .order("created_at", { ascending: false });

  const etapa = params.get("etapa");
  if (etapa) query = query.eq("etapa_funil", etapa);
  const corretorId = params.get("corretorId");
  if (corretorId) query = query.eq("corretor_responsavel_id", corretorId);

  const { data: clientes, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const clienteIds = clientes.map((c) => c.id);

  const { data: interacoes } = await supabase
    .from("interacoes")
    .select("cliente_id, data")
    .in("cliente_id", clienteIds.length ? clienteIds : ["00000000-0000-0000-0000-000000000000"])
    .order("data", { ascending: false });

  const ultimaInteracaoPorCliente = new Map<string, string>();
  for (const i of interacoes ?? []) {
    if (!ultimaInteracaoPorCliente.has(i.cliente_id)) ultimaInteracaoPorCliente.set(i.cliente_id, i.data);
  }

  const { data: interesses } = await supabase
    .from("cliente_imovel_interesse")
    .select("cliente_id, empreendimento_id, data_interesse")
    .in("cliente_id", clienteIds.length ? clienteIds : ["00000000-0000-0000-0000-000000000000"])
    .order("data_interesse", { ascending: false });

  const empreendimentoIdsInteresse = [...new Set((interesses ?? []).map((i) => i.empreendimento_id))];
  const { data: empreendimentosInteresse } = empreendimentoIdsInteresse.length
    ? await supabase.from("empreendimentos").select("id, nome").in("id", empreendimentoIdsInteresse)
    : { data: [] as { id: string; nome: string }[] };
  const nomePorEmpreendimento = new Map((empreendimentosInteresse ?? []).map((e) => [e.id, e.nome]));

  const interesseFilter = params.get("empreendimentoId");
  const interessePorCliente = new Map<string, { id: string; nome: string } | null>();
  for (const i of interesses ?? []) {
    if (!interessePorCliente.has(i.cliente_id)) {
      interessePorCliente.set(i.cliente_id, {
        id: i.empreendimento_id,
        nome: nomePorEmpreendimento.get(i.empreendimento_id) ?? "",
      });
    }
  }

  let resultado = clientes.map((c) => ({
    ...c,
    ultimaInteracaoEm: ultimaInteracaoPorCliente.get(c.id) ?? null,
    imovelInteresse: interessePorCliente.get(c.id) ?? null,
  }));

  if (interesseFilter) {
    const clienteIdsComInteresse = new Set(
      (interesses ?? []).filter((i) => i.empreendimento_id === interesseFilter).map((i) => i.cliente_id)
    );
    resultado = resultado.filter((c) => clienteIdsComInteresse.has(c.id));
  }

  return NextResponse.json({ clientes: resultado });
}

export async function POST(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = clienteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const supabase = await createClient();
  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      nome: d.nome,
      telefone: d.telefone,
      email: d.email,
      perfil: d.perfil,
      origem_lead: d.origemLead,
      corretor_responsavel_id: d.corretorResponsavelId ?? guard.usuario.id,
      etapa_funil: d.etapaFunil ?? "lead",
      orcamento_min: d.orcamentoMin,
      orcamento_max: d.orcamentoMax,
      forma_pagamento_pretendida: d.formaPagamentoPretendida,
      renda_informada: d.rendaInformada,
      valor_entrada_disponivel: d.valorEntradaDisponivel,
      parcela_maxima_mensal: d.parcelaMaximaMensal,
      estrategia_saida: d.estrategiaSaida,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (d.empreendimentoInteresseId) {
    await supabase
      .from("cliente_imovel_interesse")
      .insert({ cliente_id: cliente.id, empreendimento_id: d.empreendimentoInteresseId });
  }

  return NextResponse.json({ cliente }, { status: 201 });
}
