import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verificarSegredoCron } from "@/lib/jobAuth";
import { coletarIndicadoresBacen } from "@/lib/connectors/bacen";

async function executar(intervalo?: { dataInicial: Date; dataFinal: Date }) {
  const indicadores = await coletarIndicadoresBacen(intervalo);
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

  const dataInicialParam = request.nextUrl.searchParams.get("dataInicial");
  const dataFinalParam = request.nextUrl.searchParams.get("dataFinal");

  let intervalo: { dataInicial: Date; dataFinal: Date } | undefined;
  if (dataInicialParam) {
    const dataInicial = new Date(`${dataInicialParam}T00:00:00`);
    const dataFinal = dataFinalParam ? new Date(`${dataFinalParam}T00:00:00`) : new Date();
    if (Number.isNaN(dataInicial.getTime()) || Number.isNaN(dataFinal.getTime())) {
      return NextResponse.json({ error: "Datas inválidas" }, { status: 400 });
    }
    if (dataInicial > dataFinal) {
      return NextResponse.json({ error: "Data inicial deve ser anterior à data final" }, { status: 400 });
    }
    intervalo = { dataInicial, dataFinal };
  }

  try {
    const indicadores = await executar(intervalo);
    return NextResponse.json({ sincronizados: indicadores.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha na sincronização" }, { status: 502 });
  }
}

export const POST = GET;
