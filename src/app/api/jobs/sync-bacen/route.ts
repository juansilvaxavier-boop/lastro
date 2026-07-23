import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarSegredoCron } from "@/lib/jobAuth";
import { coletarIndicadoresBacen } from "@/lib/connectors/bacen";

/** Camada de Integracao: sincroniza Selic/CDI/IGP-M/IPCA (Bacen SGS). */
// Vercel Cron chama via GET; POST fica disponivel para disparo manual/CI.
export async function GET(request: Request) {
  const naoAutorizado = verificarSegredoCron(request);
  if (naoAutorizado) return naoAutorizado;

  try {
    const indicadores = await coletarIndicadoresBacen();
    const admin = createAdminClient();

    const { error } = await admin.from("macro_dados").upsert(
      indicadores.map((i) => ({
        indicador: i.indicador,
        data_referencia: i.dataReferencia,
        valor: i.valor,
        fonte: i.fonte,
        raw: i.raw as never,
      })),
      { onConflict: "indicador,data_referencia" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ sincronizados: indicadores.map((i) => i.indicador) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export const POST = GET;
