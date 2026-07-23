import { NextResponse } from "next/server";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  titulo: { fontSize: 20, fontWeight: 700, marginBottom: 2 },
  subtitulo: { fontSize: 11, color: "#64748b", marginBottom: 16 },
  secao: { marginBottom: 16 },
  secaoTitulo: { fontSize: 13, fontWeight: 700, marginBottom: 8 },
  linha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#64748b" },
  valor: { fontWeight: 700 },
  cenarioRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  cenarioBox: { width: "31%", padding: 8, backgroundColor: "#f1f5f9", borderRadius: 4 },
  rodape: { marginTop: 24, fontSize: 9, color: "#94a3b8" },
});

const moeda = (v: number | null | undefined) =>
  v == null ? "-" : `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export async function GET(_req: Request, ctx: RouteContext<"/api/empreendimentos/[id]/pdf">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });

  const { data: emp, error } = await supabase.from("empreendimentos").select("*, bairros(nome)").eq("id", id).single();
  if (error || !emp) return NextResponse.json({ error: "Empreendimento nao encontrado" }, { status: 404 });

  const { data: score } = await supabase
    .from("scores")
    .select("*")
    .eq("empreendimento_id", id)
    .order("calculado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: cenarios } = await supabase
    .from("cenarios")
    .select("*")
    .eq("empreendimento_id", id)
    .order("calculado_em", { ascending: false })
    .limit(3);

  const cenariosPorTipo = new Map((cenarios ?? []).map((c) => [c.tipo, c]));

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.titulo}>{emp.nome}</Text>
        <Text style={styles.subtitulo}>
          {emp.bairros?.nome ?? "Bairro nao informado"} · {emp.incorporadora ?? "Incorporadora nao informada"} · {moeda(Number(emp.preco))}
        </Text>

        {score && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Scores</Text>
            <View style={styles.linha}>
              <Text style={styles.label}>Score de valorizacao</Text>
              <Text style={styles.valor}>{Number(score.score_valorizacao).toFixed(0)}/100</Text>
            </View>
            <View style={styles.linha}>
              <Text style={styles.label}>Score de renda</Text>
              <Text style={styles.valor}>{Number(score.score_renda).toFixed(0)}/100</Text>
            </View>
          </View>
        )}

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Cenarios de valorizacao (3 anos)</Text>
          <View style={styles.cenarioRow}>
            {(["pessimista", "base", "otimista"] as const).map((tipo) => {
              const c = cenariosPorTipo.get(tipo);
              return (
                <View key={tipo} style={styles.cenarioBox}>
                  <Text style={{ color: "#64748b", textTransform: "capitalize" }}>{tipo}</Text>
                  <Text style={{ fontWeight: 700, fontSize: 14 }}>
                    {c ? `${c.valorizacao_projetada_pct > 0 ? "+" : ""}${c.valorizacao_projetada_pct}%` : "-"}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Ficha do imovel</Text>
          <View style={styles.linha}>
            <Text style={styles.label}>Tipo</Text>
            <Text style={styles.valor}>{emp.tipo}</Text>
          </View>
          <View style={styles.linha}>
            <Text style={styles.label}>Status da obra</Text>
            <Text style={styles.valor}>{emp.status_obra ?? "-"}</Text>
          </View>
          <View style={styles.linha}>
            <Text style={styles.label}>Area</Text>
            <Text style={styles.valor}>{emp.area_m2 ? `${emp.area_m2} m2` : "-"}</Text>
          </View>
          <View style={styles.linha}>
            <Text style={styles.label}>Condominio</Text>
            <Text style={styles.valor}>{moeda(emp.valor_condominio ? Number(emp.valor_condominio) : null)}</Text>
          </View>
          <View style={styles.linha}>
            <Text style={styles.label}>IPTU anual</Text>
            <Text style={styles.valor}>{moeda(emp.iptu_anual ? Number(emp.iptu_anual) : null)}</Text>
          </View>
          <View style={styles.linha}>
            <Text style={styles.label}>Aluguel estimado</Text>
            <Text style={styles.valor}>{moeda(emp.aluguel_estimado ? Number(emp.aluguel_estimado) : null)}/mes</Text>
          </View>
        </View>

        <Text style={styles.rodape}>
          Gerado por Lastro em {new Date().toLocaleDateString("pt-BR")}. Projecoes sao estimativas baseadas em modelo
          estatistico e nao constituem recomendacao de investimento.
        </Text>
      </Page>
    </Document>
  );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${emp.nome.replace(/[^\w-]+/g, "_")}.pdf"`,
    },
  });
}
