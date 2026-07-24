import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import { buscarDadosSocioeconomicosMunicipio } from "@/lib/connectors/ibge";

/** Busca população, área e PIB per capita no IBGE e atualiza a localização (cidade). */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { data: localizacao, error: erroBusca } = await supabase
    .from("localizacoes")
    .select("id, tipo, codigo_ibge")
    .eq("id", id)
    .maybeSingle();

  if (erroBusca) return NextResponse.json({ error: erroBusca.message }, { status: 500 });
  if (!localizacao) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  if (localizacao.tipo !== "cidade") {
    return NextResponse.json({ error: "Só é possível buscar dados do IBGE para uma cidade" }, { status: 400 });
  }
  if (!localizacao.codigo_ibge) {
    return NextResponse.json({ error: "Cadastre o código IBGE do município antes de sincronizar" }, { status: 400 });
  }

  try {
    const dados = await buscarDadosSocioeconomicosMunicipio(localizacao.codigo_ibge);
    const { data, error } = await supabase
      .from("localizacoes")
      .update({
        populacao: dados.populacao,
        populacao_ano: dados.populacaoAno,
        area_km2: dados.areaKm2,
        pib_per_capita: dados.pibPerCapita,
        pib_per_capita_ano: dados.pibPerCapitaAno,
        dados_ibge_atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ localizacao: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Falha ao buscar dados no IBGE" },
      { status: 502 }
    );
  }
}
