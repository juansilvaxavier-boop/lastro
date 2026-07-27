import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verificarSegredoCron } from "@/lib/jobAuth";
import { coletarIndicadoresBacen, type IndicadorMacroColetado } from "@/lib/connectors/bacen";
import { lancarIndicadoresSchema } from "@/lib/validation";

async function lancar(indicadores: IndicadorMacroColetado[]) {
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
}

function lerIntervalo(request: NextRequest): { dataInicial: Date; dataFinal: Date } | undefined | NextResponse {
  const dataInicialParam = request.nextUrl.searchParams.get("dataInicial");
  const dataFinalParam = request.nextUrl.searchParams.get("dataFinal");
  if (!dataInicialParam) return undefined;

  const dataInicial = new Date(`${dataInicialParam}T00:00:00`);
  const dataFinal = dataFinalParam ? new Date(`${dataFinalParam}T00:00:00`) : new Date();
  if (Number.isNaN(dataInicial.getTime()) || Number.isNaN(dataFinal.getTime())) {
    return NextResponse.json({ error: "Datas inválidas" }, { status: 400 });
  }
  if (dataInicial > dataFinal) {
    return NextResponse.json({ error: "Data inicial deve ser anterior à data final" }, { status: 400 });
  }
  return { dataInicial, dataFinal };
}

/**
 * GET — cron (`CRON_SECRET`) ou botão "só o dado mais recente": busca e já
 * grava direto. Com `dataInicial` e `preview=1` (uso da tela Dados): só
 * busca no Bacen e devolve a lista para o usuário revisar antes de lançar
 * (ver POST).
 */
export async function GET(request: NextRequest) {
  const ehCron = verificarSegredoCron(request);
  if (!ehCron) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const intervalo = lerIntervalo(request);
  if (intervalo instanceof NextResponse) return intervalo;

  const preview = !ehCron && request.nextUrl.searchParams.get("preview") === "1";

  try {
    const indicadores = await coletarIndicadoresBacen(intervalo);
    if (preview) {
      return NextResponse.json({ preview: true, indicadores });
    }
    await lancar(indicadores);
    return NextResponse.json({ sincronizados: indicadores.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha na sincronização" }, { status: 502 });
  }
}

/** POST — lança (grava) uma lista de indicadores já revisada pelo usuário (vinda do preview do GET). */
export async function POST(request: NextRequest) {
  if (!verificarSegredoCron(request)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = lancarIndicadoresSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    await lancar(parsed.data.indicadores);
    return NextResponse.json({ sincronizados: parsed.data.indicadores.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha ao lançar os dados" }, { status: 502 });
  }
}
