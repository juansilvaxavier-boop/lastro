import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarSegredoCron } from "@/lib/jobAuth";
import { coletarIndicadoresCvm } from "@/lib/connectors/cvm";

/** Camada de Integracao: sincroniza rendimento/P-VP medio de FIIs (CVM, CSV mensal). */
// Vercel Cron chama via GET; POST fica disponivel para disparo manual/CI.
export async function GET(request: Request) {
  const naoAutorizado = verificarSegredoCron(request);
  if (naoAutorizado) return naoAutorizado;

  try {
    const indicadores = await coletarIndicadoresCvm();
    if (indicadores.length === 0) {
      return NextResponse.json({ sincronizados: [], aviso: "Nenhum indicador extraido do CSV" });
    }

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
