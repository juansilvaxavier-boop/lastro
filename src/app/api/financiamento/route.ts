import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { financiamentoSchema } from "@/lib/validation";
import { simularFinanciamento } from "@/lib/engine";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = financiamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const f = parsed.data;

  const { data: emp, error: empError } = await supabase
    .from("empreendimentos")
    .select("preco")
    .eq("id", f.empreendimentoId)
    .single();
  if (empError) return NextResponse.json({ error: empError.message }, { status: 404 });

  const resultado = simularFinanciamento({
    preco: Number(emp.preco),
    valorEntrada: f.valorEntrada,
    numParcelas: f.numParcelas,
    taxaJurosAnual: f.taxaJurosAnual,
    sistema: f.sistema,
  });

  if (f.salvar) {
    const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
    await supabase.from("financiamento_simulacoes").insert({
      perfil_id: perfil?.id ?? null,
      empreendimento_id: f.empreendimentoId,
      valor_entrada: f.valorEntrada,
      num_parcelas: f.numParcelas,
      sistema_amortizacao: f.sistema,
      taxa_juros_anual: f.taxaJurosAnual,
      resultado: resultado as never,
    });
  }

  return NextResponse.json({ resultado });
}
