import "server-only";
import { NextResponse } from "next/server";

/**
 * Protege os endpoints de job (scheduler de alertas, conectores de dados)
 * contra chamadas externas. O Vercel Cron envia o header Authorization com o
 * valor configurado em CRON_SECRET.
 */
export function verificarSegredoCron(request: Request): NextResponse | null {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return NextResponse.json({ error: "CRON_SECRET nao configurado" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }
  return null;
}
