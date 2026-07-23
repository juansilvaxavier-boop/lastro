import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarSegredoCron } from "@/lib/jobAuth";
import { buscarPopulacaoMunicipio } from "@/lib/connectors/ibge";

/**
 * Camada de Integracao: sincroniza a estimativa de populacao do municipio
 * (IBGE SIDRA). Renda media e densidade por BAIRRO continuam manuais (ver
 * nota em lib/connectors/ibge.ts).
 */
// Vercel Cron chama via GET; POST fica disponivel para disparo manual/CI.
export async function GET(request: Request) {
  const naoAutorizado = verificarSegredoCron(request);
  if (naoAutorizado) return naoAutorizado;

  try {
    const resultado = await buscarPopulacaoMunicipio();
    if (!resultado) return NextResponse.json({ error: "IBGE nao retornou dados" }, { status: 502 });

    const admin = createAdminClient();
    const { error } = await admin.from("macro_dados").upsert(
      {
        indicador: "populacao_municipio",
        data_referencia: `${resultado.ano}-01-01`,
        valor: resultado.populacao,
        fonte: "ibge_sidra_6579",
      },
      { onConflict: "indicador,data_referencia" }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ sincronizado: resultado });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export const POST = GET;
