import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirSessao, exigirPapel } from "@/lib/auth";
import { construtoraSchema } from "@/lib/validation";
import { calcularEntregasNoPrazo } from "@/lib/engine";

export async function GET() {
  const guard = await exigirSessao();
  if ("resposta" in guard) return guard.resposta;

  const supabase = await createClient();
  const { data: construtoras, error } = await supabase.from("construtoras").select("*").order("nome");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: empreendimentos } = await supabase
    .from("empreendimentos")
    .select("construtora_id, ativo, data_entrega_prevista, data_entrega_real");

  const porConstrutora = new Map<string, typeof empreendimentos>();
  for (const emp of empreendimentos ?? []) {
    if (!emp.construtora_id) continue;
    const lista = porConstrutora.get(emp.construtora_id) ?? [];
    lista.push(emp);
    porConstrutora.set(emp.construtora_id, lista);
  }

  const resultado = construtoras.map((c) => {
    const lista = porConstrutora.get(c.id) ?? [];
    return {
      ...c,
      numeroEmpreendimentosAtivos: lista.filter((e) => e!.ativo).length,
      percentualEntregasNoPrazo: calcularEntregasNoPrazo(
        lista.map((e) => ({ dataEntregaPrevista: e!.data_entrega_prevista, dataEntregaReal: e!.data_entrega_real }))
      ),
    };
  });

  return NextResponse.json({ construtoras: resultado });
}

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const body = await request.json();
  const parsed = construtoraSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("construtoras")
    .insert({
      nome: parsed.data.nome,
      cnpj: parsed.data.cnpj,
      ano_fundacao: parsed.data.anoFundacao,
      reputacao_score: parsed.data.reputacaoScore,
      status_certidoes: parsed.data.statusCertidoes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ construtora: data }, { status: 201 });
}
