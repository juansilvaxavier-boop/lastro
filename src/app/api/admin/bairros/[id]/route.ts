import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bairroSchema } from "@/lib/validation";
import { exigirAdmin } from "@/lib/admin";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/bairros/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const naoAutorizado = await exigirAdmin(supabase);
  if (naoAutorizado) return naoAutorizado;

  const { data, error } = await supabase.from("bairros").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ bairro: data });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/bairros/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const naoAutorizado = await exigirAdmin(supabase);
  if (naoAutorizado) return naoAutorizado;

  const body = await request.json();
  const parsed = bairroSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bairros")
    .update({
      ...(b.nome !== undefined && { nome: b.nome }),
      ...(b.cidade !== undefined && { cidade: b.cidade }),
      ...(b.estado !== undefined && { estado: b.estado }),
      ...(b.populacao !== undefined && { populacao: b.populacao }),
      ...(b.densidadeDemografica !== undefined && { densidade_demografica: b.densidadeDemografica }),
      ...(b.rendaMedia !== undefined && { renda_media: b.rendaMedia }),
      ...(b.zoneamento !== undefined && { zoneamento: b.zoneamento }),
      ...(b.planoDiretorUrl !== undefined && { plano_diretor_url: b.planoDiretorUrl }),
      ...(b.ultimaRevisaoManual !== undefined && { ultima_revisao_manual: b.ultimaRevisaoManual }),
      ...(b.empregabilidadeRegional !== undefined && { empregabilidade_regional: b.empregabilidadeRegional }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bairro: data });
}
