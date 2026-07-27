import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { empreendimentoSchema } from "@/lib/validation";
import { calcularValorizacaoDesdeData } from "@/lib/engine";

export async function GET(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const params = request.nextUrl.searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("empreendimentos")
    .select("*, construtora:construtoras(id, nome), bairro:localizacoes(id, nome)")
    .eq("ativo", true)
    .order("created_at", { ascending: false });

  const status = params.get("status");
  if (status) query = query.eq("status", status);

  const construtoraId = params.get("construtoraId");
  if (construtoraId) query = query.eq("construtora_id", construtoraId);

  const bairroId = params.get("bairroId");
  if (bairroId) query = query.eq("bairro_id", bairroId);

  const precoMin = params.get("precoMin");
  if (precoMin) query = query.gte("preco_total", Number(precoMin));

  const precoMax = params.get("precoMax");
  if (precoMax) query = query.lte("preco_total", Number(precoMax));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: favoritos } = await supabase
    .from("favoritos")
    .select("empreendimento_id")
    .eq("usuario_id", guard.usuario.id);
  const idsFavoritos = new Set((favoritos ?? []).map((f) => f.empreendimento_id));

  const bairroIds = [...new Set(data.map((e) => e.bairro_id).filter((x): x is string => !!x))];
  const { data: precosVenda } = bairroIds.length
    ? await supabase
        .from("precos_mercado_local")
        .select("localizacao_id, data_referencia, valor_m2")
        .in("localizacao_id", bairroIds)
        .eq("tipo", "venda")
        .eq("segmento", "residencial")
    : { data: [] as { localizacao_id: string | null; data_referencia: string; valor_m2: number }[] };

  const historicoPorBairro = new Map<string, { dataReferencia: string; valorM2: number }[]>();
  for (const p of precosVenda ?? []) {
    if (!p.localizacao_id) continue;
    const lista = historicoPorBairro.get(p.localizacao_id) ?? [];
    lista.push({ dataReferencia: p.data_referencia, valorM2: p.valor_m2 });
    historicoPorBairro.set(p.localizacao_id, lista);
  }

  return NextResponse.json({
    empreendimentos: data.map((e) => ({
      ...e,
      favoritado: idsFavoritos.has(e.id),
      valorizacaoBairroDesdeLancamento:
        e.bairro_id && e.data_lancamento
          ? calcularValorizacaoDesdeData(historicoPorBairro.get(e.bairro_id) ?? [], e.data_lancamento)
          : null,
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = empreendimentoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("empreendimentos")
    .insert({
      nome: d.nome,
      construtora_id: d.construtoraId,
      bairro_id: d.bairroId,
      metragem_privativa: d.metragemPrivativa,
      metragem_total: d.metragemTotal,
      preco_total: d.precoTotal,
      data_lancamento: d.dataLancamento,
      data_entrega_prevista: d.dataEntregaPrevista,
      data_entrega_real: d.dataEntregaReal,
      indice_correcao_obra: d.indiceCorrecaoObra,
      indice_correcao_pos_entrega: d.indiceCorrecaoPosEntrega,
      status: d.status,
      unidades_totais: d.unidadesTotais,
      unidades_disponiveis: d.unidadesDisponiveis,
      imagem_url: d.imagemUrl,
      ativo: d.ativo ?? true,
      observacao_valorizacao: d.observacaoValorizacao,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ empreendimento: data }, { status: 201 });
}
