import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { data: original, error: erroBusca } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (erroBusca) return NextResponse.json({ error: erroBusca.message }, { status: 500 });
  if (!original) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { data: copia, error } = await supabase
    .from("empreendimentos")
    .insert({
      nome: `${original.nome} (cópia)`,
      construtora_id: original.construtora_id,
      bairro_id: original.bairro_id,
      metragem_privativa: original.metragem_privativa,
      metragem_total: original.metragem_total,
      preco_total: original.preco_total,
      data_lancamento: original.data_lancamento,
      data_entrega_prevista: original.data_entrega_prevista,
      indice_correcao_obra: original.indice_correcao_obra,
      indice_correcao_pos_entrega: original.indice_correcao_pos_entrega,
      status: original.status,
      unidades_totais: original.unidades_totais,
      unidades_disponiveis: original.unidades_totais,
      imagem_url: original.imagem_url,
      ativo: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ empreendimento: copia }, { status: 201 });
}
