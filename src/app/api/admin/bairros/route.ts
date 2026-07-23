import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bairroSchema } from "@/lib/validation";
import { exigirAdmin } from "@/lib/admin";

export async function GET() {
  const supabase = await createClient();
  const naoAutorizado = await exigirAdmin(supabase);
  if (naoAutorizado) return naoAutorizado;

  const { data, error } = await supabase.from("bairros").select("*").order("nome");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bairros: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const naoAutorizado = await exigirAdmin(supabase);
  if (naoAutorizado) return naoAutorizado;

  const body = await request.json();
  const parsed = bairroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const b = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bairros")
    .insert({
      nome: b.nome,
      cidade: b.cidade,
      estado: b.estado,
      populacao: b.populacao,
      densidade_demografica: b.densidadeDemografica,
      renda_media: b.rendaMedia,
      zoneamento: b.zoneamento,
      plano_diretor_url: b.planoDiretorUrl,
      ultima_revisao_manual: b.ultimaRevisaoManual,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bairro: data }, { status: 201 });
}
