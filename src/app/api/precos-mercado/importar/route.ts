import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import { importarPrecosSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = importarPrecosSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { localizacaoId, linhas } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("precos_mercado_local")
    .upsert(
      linhas.map((l) => ({
        localizacao_id: localizacaoId,
        tipo: l.tipo,
        segmento: l.segmento,
        valor_m2: l.valorM2,
        variacao_mensal: l.variacaoMensal,
        variacao_anual_12m: l.variacaoAnual12m,
        data_referencia: l.dataReferencia,
      })),
      { onConflict: "localizacao_id,tipo,segmento,data_referencia" }
    )
    .select("id");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ importados: data.length });
}
