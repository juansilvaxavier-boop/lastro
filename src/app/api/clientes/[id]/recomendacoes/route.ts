import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao } from "@/lib/auth";
import { avaliarImovelParaCliente } from "@/lib/engine";
import type { PrecoMercadoLocal } from "@/types/dominio";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();

  const { data: cliente } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (!cliente) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const { data: empreendimentos } = await supabase
    .from("empreendimentos")
    .select("*, construtora:construtoras(id, nome), bairro:localizacoes(id, nome)")
    .eq("ativo", true);

  const { data: cdiHistorico } = await supabase
    .from("indicadores_mercado")
    .select("valor")
    .eq("tipo", "cdi")
    .order("data_referencia", { ascending: false })
    .limit(1);
  const cdiAnual = cdiHistorico?.[0]?.valor ?? 0.11;

  const bairroIds = [...new Set((empreendimentos ?? []).map((e) => e.bairro_id).filter((x): x is string => !!x))];
  const { data: precos } = bairroIds.length
    ? await supabase
        .from("precos_mercado_local")
        .select("*")
        .in("localizacao_id", bairroIds)
        .order("data_referencia", { ascending: true })
    : { data: [] as PrecoMercadoLocal[] };

  const porBairro = new Map<string, { venda: PrecoMercadoLocal[]; aluguel: PrecoMercadoLocal[] }>();
  for (const p of precos ?? []) {
    if (!p.localizacao_id) continue;
    const entrada = porBairro.get(p.localizacao_id) ?? { venda: [], aluguel: [] };
    if (p.tipo === "venda") entrada.venda.push(p);
    else if (p.tipo === "aluguel") entrada.aluguel.push(p);
    porBairro.set(p.localizacao_id, entrada);
  }

  const avaliacoes = (empreendimentos ?? []).map((emp) => {
    const bairroPrecos = emp.bairro_id ? porBairro.get(emp.bairro_id) : undefined;
    const ultimaVenda = bairroPrecos?.venda.at(-1);
    const ultimoAluguel = bairroPrecos?.aluguel.at(-1);

    const avaliacao = avaliarImovelParaCliente({
      precoTotal: emp.preco_total,
      metragem: emp.metragem_privativa ?? emp.metragem_total,
      valorEntradaDisponivel: cliente.valor_entrada_disponivel ?? 0,
      parcelaMaximaMensal: cliente.parcela_maxima_mensal,
      estrategiaSaida: cliente.estrategia_saida as "ganho_capital" | "renda_aluguel" | "patrimonial" | null,
      variacaoAnualVendaBairro: ultimaVenda?.variacao_anual_12m ?? null,
      valorM2AluguelBairro: ultimoAluguel?.valor_m2 ?? null,
      cdiAnual,
    });

    return { empreendimento: emp, avaliacao };
  });

  avaliacoes.sort((a, b) => {
    if (a.avaliacao.viavel !== b.avaliacao.viavel) return a.avaliacao.viavel ? -1 : 1;
    return (b.avaliacao.roiCapitalProprio ?? -Infinity) - (a.avaliacao.roiCapitalProprio ?? -Infinity);
  });

  return NextResponse.json({ cliente, avaliacoes });
}
