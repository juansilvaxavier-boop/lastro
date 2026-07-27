import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import { buscarCoordenadas } from "@/lib/connectors/geocodificacao";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { data: localizacao } = await supabase
    .from("localizacoes")
    .select("id, nome, tipo, parent_id")
    .eq("id", id)
    .maybeSingle();
  if (!localizacao) return NextResponse.json({ error: "Localização não encontrada" }, { status: 404 });

  const partes = [localizacao.nome];
  let proximoParentId = localizacao.parent_id;
  while (proximoParentId) {
    const { data: pai } = await supabase
      .from("localizacoes")
      .select("nome, tipo, parent_id")
      .eq("id", proximoParentId)
      .maybeSingle();
    if (!pai) break;
    if (pai.tipo !== "regiao") partes.push(pai.nome);
    proximoParentId = pai.parent_id;
  }
  partes.push("Brasil");

  const coordenadas = await buscarCoordenadas(partes.join(", "));
  if (!coordenadas) {
    return NextResponse.json({ error: "Não foi possível localizar essa região no mapa." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("localizacoes")
    .update({ latitude: coordenadas.latitude, longitude: coordenadas.longitude })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ localizacao: data });
}
