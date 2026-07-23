import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ComparadorClient, type ItemComparavel } from "@/components/ComparadorClient";

export default async function CompararPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perfil } = await supabase.from("perfis").select("id").eq("user_id", user.id).maybeSingle();
  if (!perfil) redirect("/onboarding");

  const { data: matches } = await supabase
    .from("matches")
    .select("score_encaixe, empreendimentos(id, nome, preco, bairros(nome), scores(score_valorizacao, score_renda, detalhes, calculado_em))")
    .eq("perfil_id", perfil.id)
    .order("score_encaixe", { ascending: false });

  const itens = (matches ?? [])
    .map((m): ItemComparavel | null => {
      const emp = m.empreendimentos;
      if (!emp) return null;
      const scoresOrdenados = [...(emp.scores ?? [])].sort(
        (a, b) => new Date(b.calculado_em).getTime() - new Date(a.calculado_em).getTime()
      );
      const ultimo = scoresOrdenados[0];
      const detalhes = ultimo?.detalhes as { renda?: { yieldLiquidoAnual?: number | null } } | null | undefined;

      return {
        id: emp.id,
        nome: emp.nome,
        bairro: emp.bairros?.nome ?? "—",
        preco: Number(emp.preco),
        scoreValorizacao: ultimo ? Number(ultimo.score_valorizacao) : null,
        scoreRenda: ultimo ? Number(ultimo.score_renda) : null,
        scoreEncaixe: Number(m.score_encaixe),
        yieldLiquidoAnual: detalhes?.renda?.yieldLiquidoAnual ?? null,
      };
    })
    .filter((i): i is ItemComparavel => i != null);

  return <ComparadorClient itens={itens} />;
}
