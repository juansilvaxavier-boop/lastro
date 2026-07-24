import "server-only";
import { NextRequest } from "next/server";

/** Autoriza chamadas do Vercel Cron via `Authorization: Bearer <CRON_SECRET>`. */
export function verificarSegredoCron(request: NextRequest): boolean {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return false;
  return request.headers.get("authorization") === `Bearer ${segredo}`;
}
