import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, ctx: RouteContext<"/api/empreendimentos/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const [{ data: empreendimento, error: empError }, { data: cenarios, error: cenariosError }, { data: calibracao }] =
    await Promise.all([
      supabase
        .from("empreendimentos")
        .select("*, bairros(*)")
        .eq("id", id)
        .single(),
      supabase
        .from("cenarios")
        .select("*")
        .eq("empreendimento_id", id)
        .order("calculado_em", { ascending: false })
        .limit(3),
      supabase
        .from("calibracao")
        .select("*")
        .eq("empreendimento_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (empError) return NextResponse.json({ error: empError.message }, { status: 404 });
  if (cenariosError) return NextResponse.json({ error: cenariosError.message }, { status: 500 });

  const { data: score } = await supabase
    .from("scores")
    .select("*")
    .eq("empreendimento_id", id)
    .order("calculado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ empreendimento, score, cenarios, calibracao });
}
