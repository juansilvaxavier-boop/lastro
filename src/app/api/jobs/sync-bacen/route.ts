import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verificarSegredoCron } from "@/lib/jobAuth";
import { coletarIndicadoresBacen } from "@/lib/connectors/bacen";

async function executar() {
  const indicadores = await coletarIndicadoresBacen();
  const admin = createAdminClient();

  const { error } = await admin.from("indicadores_mercado").upsert(
    indicadores.map((i) => ({
      tipo: i.indicador,
      valor: i.valor,
      data_referencia: i.dataReferencia,
      fonte: i.fonte,
      raw: i.raw as never,
    })),
    { onConflict: "tipo,data_referencia" }
  );

  if (error) throw new Error(error.message);
  return indicadores;
}

export async function GET(request: NextRequest) {
  if (!verificarSegredoCron(request)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const indicadores = await executar();
    return NextResponse.json({ sincronizados: indicadores.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha na sincronização" }, { status: 502 });
  }
}

export const POST = GET;
