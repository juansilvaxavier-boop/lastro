import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import { buscarCoordenadas } from "@/lib/connectors/geocodificacao";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { data: ponto } = await supabase
    .from("pontos_interesse")
    .select("id, nome, cidade_id")
    .eq("id", id)
    .maybeSingle();
  if (!ponto) return NextResponse.json({ error: "Ponto de interesse não encontrado" }, { status: 404 });

  const { data: cidade } = await supabase.from("localizacoes").select("nome").eq("id", ponto.cidade_id).maybeSingle();

  const consulta = [ponto.nome, cidade?.nome, "Brasil"].filter(Boolean).join(", ");
  const coordenadas = await buscarCoordenadas(consulta);
  if (!coordenadas) {
    return NextResponse.json({ error: "Não foi possível localizar esse ponto no mapa." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("pontos_interesse")
    .update({ latitude: coordenadas.latitude, longitude: coordenadas.longitude })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pontoInteresse: data });
}
