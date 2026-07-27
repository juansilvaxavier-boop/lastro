import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { indicadorSchema } from "@/lib/validation";

const TIPOS = ["selic", "cdi", "ipca", "igpm", "incc"] as const;

export async function GET(request: NextRequest) {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const supabase = await createClient();
  const tipo = request.nextUrl.searchParams.get("tipo");

  if (tipo) {
    const { data, error } = await supabase
      .from("indicadores_mercado")
      .select("*")
      .eq("tipo", tipo)
      .order("data_referencia", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ historico: data });
  }

  const resultados = await Promise.all(
    TIPOS.map(async (t) => {
      const { data } = await supabase
        .from("indicadores_mercado")
        .select("*")
        .eq("tipo", t)
        .order("data_referencia", { ascending: false })
        .limit(2);
      const [atual, anterior] = data ?? [];
      return {
        tipo: t,
        atual: atual ?? null,
        tendencia: atual && anterior ? (atual.valor >= anterior.valor ? "alta" : "queda") : null,
      };
    })
  );

  return NextResponse.json({ indicadores: resultados });
}

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = indicadorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("indicadores_mercado")
    .upsert(
      { tipo: d.tipo, valor: d.valor, data_referencia: d.dataReferencia, fonte: d.fonte },
      { onConflict: "tipo,data_referencia" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ indicador: data }, { status: 201 });
}
