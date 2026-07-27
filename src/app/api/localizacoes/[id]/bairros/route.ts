import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import { buscarNomesBairrosProximos } from "@/lib/connectors/overpass";
import { z } from "zod";

const criarBairrosLoteSchema = z.object({
  nomes: z.array(z.string().min(1)).min(1),
});

async function carregarCidadeEBairros(supabase: Awaited<ReturnType<typeof createClient>>, cidadeId: string) {
  const { data: cidade } = await supabase
    .from("localizacoes")
    .select("id, nome, tipo, latitude, longitude")
    .eq("id", cidadeId)
    .maybeSingle();

  const { data: bairros } = await supabase.from("localizacoes").select("nome").eq("parent_id", cidadeId).eq("tipo", "bairro");

  return { cidade, bairrosExistentes: bairros ?? [] };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const supabase = await createClient();
  const { cidade, bairrosExistentes } = await carregarCidadeEBairros(supabase, id);

  if (!cidade || cidade.tipo !== "cidade") {
    return NextResponse.json({ error: "Cidade não encontrada" }, { status: 404 });
  }
  if (cidade.latitude === null || cidade.longitude === null) {
    return NextResponse.json(
      { error: "Essa cidade ainda não tem coordenadas — busque as coordenadas dela primeiro (aba Mapa da cidade)." },
      { status: 400 }
    );
  }

  let nomesEncontrados: string[];
  try {
    nomesEncontrados = await buscarNomesBairrosProximos(cidade.latitude, cidade.longitude);
  } catch {
    return NextResponse.json({ error: "Não foi possível buscar os bairros no mapa agora. Tente novamente." }, { status: 502 });
  }

  const nomesExistentesNormalizados = new Set(bairrosExistentes.map((b) => b.nome.trim().toLowerCase()));
  const nomesNovos = nomesEncontrados.filter((nome) => !nomesExistentesNormalizados.has(nome.trim().toLowerCase()));

  return NextResponse.json({ nomes: nomesNovos, totalEncontrado: nomesEncontrados.length });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;
  const { id } = await params;

  const body = await request.json();
  const parsed = criarBairrosLoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { cidade } = await carregarCidadeEBairros(supabase, id);
  if (!cidade || cidade.tipo !== "cidade") {
    return NextResponse.json({ error: "Cidade não encontrada" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("localizacoes")
    .insert(parsed.data.nomes.map((nome) => ({ nome, tipo: "bairro", parent_id: id })))
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ localizacoes: data }, { status: 201 });
}
