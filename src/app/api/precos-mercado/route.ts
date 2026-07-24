import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { precoMercadoSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const params = request.nextUrl.searchParams;
  const supabase = await createClient();
  let query = supabase.from("precos_mercado_local").select("*, localizacao:localizacoes(id, nome, tipo)");

  const localizacaoId = params.get("localizacaoId");
  if (localizacaoId) query = query.eq("localizacao_id", localizacaoId);
  const tipo = params.get("tipo");
  if (tipo) query = query.eq("tipo", tipo);

  query = query.order("data_referencia", { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ precos: data });
}

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = precoMercadoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("precos_mercado_local")
    .insert({
      localizacao_id: d.localizacaoId,
      tipo: d.tipo,
      valor_m2: d.valorM2,
      variacao_mensal: d.variacaoMensal,
      variacao_anual_12m: d.variacaoAnual12m,
      data_referencia: d.dataReferencia,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ preco: data }, { status: 201 });
}
