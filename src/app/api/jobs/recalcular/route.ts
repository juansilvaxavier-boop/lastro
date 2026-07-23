import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verificarSegredoCron } from "@/lib/jobAuth";
import { recalcularMatchesPerfil, recalcularScoresEempreendimento } from "@/lib/pipeline";

/**
 * Processo 8 (Camada de Alertas/Agendamento): roda o motor sobre todos os
 * empreendimentos ativos e todos os perfis, gerando alertas de novo encaixe.
 * Chamado periodicamente pelo Vercel Cron (ver vercel.json).
 */
// Vercel Cron chama via GET; POST fica disponivel para disparo manual/CI.
export async function GET(request: Request) {
  const naoAutorizado = verificarSegredoCron(request);
  if (naoAutorizado) return naoAutorizado;

  const admin = createAdminClient();

  const { data: empreendimentos, error: empError } = await admin
    .from("empreendimentos")
    .select("id")
    .eq("ativo", true);
  if (empError) return NextResponse.json({ error: empError.message }, { status: 500 });

  const errosScores: string[] = [];
  for (const emp of empreendimentos ?? []) {
    try {
      await recalcularScoresEempreendimento(admin, emp.id);
    } catch (e) {
      errosScores.push(`${emp.id}: ${(e as Error).message}`);
    }
  }

  const { data: perfis, error: perfisError } = await admin.from("perfis").select("id");
  if (perfisError) return NextResponse.json({ error: perfisError.message }, { status: 500 });

  let totalAlertas = 0;
  const errosMatches: string[] = [];
  for (const perfil of perfis ?? []) {
    try {
      const { alertasGerados } = await recalcularMatchesPerfil(admin, perfil.id);
      totalAlertas += alertasGerados;
    } catch (e) {
      errosMatches.push(`${perfil.id}: ${(e as Error).message}`);
    }
  }

  return NextResponse.json({
    empreendimentosProcessados: (empreendimentos ?? []).length,
    perfisProcessados: (perfis ?? []).length,
    alertasGerados: totalAlertas,
    erros: [...errosScores, ...errosMatches],
  });
}

export const POST = GET;
