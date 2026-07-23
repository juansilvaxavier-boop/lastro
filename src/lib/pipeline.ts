import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  calcularEncaixe,
  calcularScoreRenda,
  calcularScoreValorizacao,
  gerarCenarios,
  type Bairro,
  type Empreendimento,
  type MacroIndicadores,
  type Perfil,
} from "@/lib/engine";

type TypedClient = SupabaseClient<Database>;

function toEngineEmpreendimento(row: Database["public"]["Tables"]["empreendimentos"]["Row"]): Empreendimento {
  return {
    id: row.id,
    tipo: row.tipo as Empreendimento["tipo"],
    statusObra: row.status_obra as Empreendimento["statusObra"],
    preco: Number(row.preco),
    areaM2: row.area_m2 != null ? Number(row.area_m2) : null,
    valorCondominio: row.valor_condominio != null ? Number(row.valor_condominio) : null,
    iptuAnual: row.iptu_anual != null ? Number(row.iptu_anual) : null,
    aluguelEstimado: row.aluguel_estimado != null ? Number(row.aluguel_estimado) : null,
  };
}

function toEngineBairro(row: Database["public"]["Tables"]["bairros"]["Row"] | null): Bairro | null {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    populacao: row.populacao,
    densidadeDemografica: row.densidade_demografica != null ? Number(row.densidade_demografica) : null,
    rendaMedia: row.renda_media != null ? Number(row.renda_media) : null,
  };
}

function toEnginePerfil(row: Database["public"]["Tables"]["perfis"]["Row"]): Perfil {
  return {
    id: row.id,
    objetivo: row.objetivo as Perfil["objetivo"],
    prazo: row.prazo as Perfil["prazo"],
    liquidez: row.liquidez as Perfil["liquidez"],
    toleranciaRisco: row.tolerancia_risco as Perfil["toleranciaRisco"],
  };
}

/** Busca o valor mais recente de cada indicador macro (Processo 2-4). */
export async function buscarMacroAtual(supabase: TypedClient): Promise<MacroIndicadores> {
  const { data, error } = await supabase
    .from("macro_dados")
    .select("indicador, valor, data_referencia")
    .order("data_referencia", { ascending: false });

  if (error) throw error;

  const maisRecentePorIndicador = new Map<string, number>();
  for (const row of data ?? []) {
    if (!maisRecentePorIndicador.has(row.indicador)) {
      maisRecentePorIndicador.set(row.indicador, Number(row.valor));
    }
  }

  return {
    selicAnual: maisRecentePorIndicador.get("selic") ?? null,
    cdiAnual: maisRecentePorIndicador.get("cdi") ?? null,
    igpmAnual: maisRecentePorIndicador.get("igpm") ?? null,
    ipcaAnual: maisRecentePorIndicador.get("ipca") ?? null,
  };
}

async function precoMedioM2Bairro(supabase: TypedClient, bairroId: string | null): Promise<number | null> {
  if (!bairroId) return null;
  const { data, error } = await supabase
    .from("empreendimentos")
    .select("preco, area_m2")
    .eq("bairro_id", bairroId)
    .eq("ativo", true)
    .not("area_m2", "is", null);

  if (error) throw error;
  const validos = (data ?? []).filter((r) => r.area_m2 && r.area_m2 > 0);
  if (validos.length === 0) return null;

  const media =
    validos.reduce((soma, r) => soma + Number(r.preco) / Number(r.area_m2), 0) / validos.length;
  return media;
}

/**
 * Processo 5+7: recalcula score de valorizacao/renda e os cenarios
 * (Monte Carlo) de um empreendimento, persistindo o resultado.
 */
export async function recalcularScoresEempreendimento(supabase: TypedClient, empreendimentoId: string) {
  const [{ data: empRow, error: empError }, macro] = await Promise.all([
    supabase.from("empreendimentos").select("*").eq("id", empreendimentoId).single(),
    buscarMacroAtual(supabase),
  ]);
  if (empError) throw empError;
  if (!empRow) throw new Error("Empreendimento nao encontrado");

  const bairroPromise = empRow.bairro_id
    ? supabase.from("bairros").select("*").eq("id", empRow.bairro_id).single()
    : Promise.resolve({ data: null });
  const [{ data: bairroRow }, precoMedioM2] = await Promise.all([
    bairroPromise,
    precoMedioM2Bairro(supabase, empRow.bairro_id),
  ]);

  const emp = toEngineEmpreendimento(empRow);
  const bairro = toEngineBairro(bairroRow ?? null);

  const scoreValorizacao = calcularScoreValorizacao(emp, bairro, macro, precoMedioM2);
  const scoreRenda = calcularScoreRenda(emp, macro);

  const { data: scoreInserido, error: scoreError } = await supabase
    .from("scores")
    .insert({
      empreendimento_id: empreendimentoId,
      score_valorizacao: scoreValorizacao.score,
      score_renda: scoreRenda.score,
      detalhes: { valorizacao: scoreValorizacao.detalhes, renda: scoreRenda.detalhes } as never,
    })
    .select()
    .single();
  if (scoreError) throw scoreError;

  const cenarios = gerarCenarios(emp, scoreValorizacao.score, 3);
  const { error: cenariosError } = await supabase.from("cenarios").insert(
    cenarios.map((c) => ({
      empreendimento_id: empreendimentoId,
      tipo: c.tipo,
      valorizacao_projetada_pct: c.valorizacaoProjetadaPct,
      renda_projetada_mensal: c.rendaProjetadaMensal,
    }))
  );
  if (cenariosError) throw cenariosError;

  return { scoreValorizacao, scoreRenda, cenarios, scoreId: scoreInserido.id };
}

/**
 * Processo 6+8: recalcula o encaixe (matching) de um perfil contra todos os
 * empreendimentos ativos, usando o score mais recente de cada um. Gera um
 * alerta (Processo 8) quando um encaixe novo ultrapassa o limiar de
 * oportunidade e ainda nao havia sido notificado.
 */
export async function recalcularMatchesPerfil(supabase: TypedClient, perfilId: string) {
  const LIMIAR_ALERTA = 75;

  const { data: perfilRow, error: perfilError } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", perfilId)
    .single();
  if (perfilError) throw perfilError;
  if (!perfilRow) throw new Error("Perfil nao encontrado");
  const perfil = toEnginePerfil(perfilRow);

  const { data: empreendimentos, error: empError } = await supabase
    .from("empreendimentos")
    .select("*")
    .eq("ativo", true);
  if (empError) throw empError;

  const { data: matchesAnteriores } = await supabase
    .from("matches")
    .select("empreendimento_id, score_encaixe")
    .eq("perfil_id", perfilId);
  const anteriorPorEmpreendimento = new Map(
    (matchesAnteriores ?? []).map((m) => [m.empreendimento_id, Number(m.score_encaixe)])
  );

  const resultados: { empreendimentoId: string; scoreEncaixe: number }[] = [];
  const novosAlertas: Database["public"]["Tables"]["alertas"]["Insert"][] = [];

  for (const empRow of empreendimentos ?? []) {
    const { data: ultimoScore } = await supabase
      .from("scores")
      .select("score_valorizacao, score_renda")
      .eq("empreendimento_id", empRow.id)
      .order("calculado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!ultimoScore) continue;

    const emp = toEngineEmpreendimento(empRow);
    const match = calcularEncaixe(
      perfil,
      emp,
      Number(ultimoScore.score_valorizacao),
      Number(ultimoScore.score_renda)
    );

    resultados.push({ empreendimentoId: empRow.id, scoreEncaixe: match.scoreEncaixe });

    const scoreAnterior = anteriorPorEmpreendimento.get(empRow.id);
    const eraNovoOuMelhorou = scoreAnterior === undefined || scoreAnterior < LIMIAR_ALERTA;
    if (match.scoreEncaixe >= LIMIAR_ALERTA && eraNovoOuMelhorou) {
      novosAlertas.push({
        perfil_id: perfilId,
        empreendimento_id: empRow.id,
        tipo: "novo_encaixe",
        titulo: "Novo encaixe encontrado",
        mensagem: `${empRow.nome} combina com o seu perfil (encaixe ${match.scoreEncaixe}/100).`,
      });
    }

    await supabase.from("matches").upsert(
      {
        perfil_id: perfilId,
        empreendimento_id: empRow.id,
        score_encaixe: match.scoreEncaixe,
        detalhes: match as never,
      },
      { onConflict: "perfil_id,empreendimento_id" }
    );
  }

  if (novosAlertas.length > 0) {
    await supabase.from("alertas").insert(novosAlertas);
  }

  return { resultados, alertasGerados: novosAlertas.length };
}
