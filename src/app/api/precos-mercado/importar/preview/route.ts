import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import { parsePlanilhaPrecos } from "@/lib/connectors/planilhaPrecos";

const TAMANHO_MAXIMO = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  const formData = await request.formData();
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo de planilha (.xlsx)." }, { status: 400 });
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return NextResponse.json({ error: "Arquivo muito grande (máximo 10MB)." }, { status: 400 });
  }

  let cidadesParseadas;
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    cidadesParseadas = parsePlanilhaPrecos(buffer);
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o arquivo. Confira se é um .xlsx válido." }, { status: 400 });
  }

  if (cidadesParseadas.length === 0) {
    return NextResponse.json(
      { error: "Não reconheci o formato da planilha (esperado: uma aba por cidade, no padrão do índice de preços FipeZAP)." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: cidadesCadastradas } = await supabase.from("localizacoes").select("id, nome").eq("tipo", "cidade");

  const normalizar = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();

  const cidades = cidadesParseadas.map((c) => {
    const match = (cidadesCadastradas ?? []).find((cc) => normalizar(cc.nome) === normalizar(c.nomeCidade));
    const totalLinhas = c.linhas.length;
    const datas = c.linhas.map((l) => l.dataReferencia).sort();
    const porSegmentoTipo: Record<string, number> = {};
    for (const l of c.linhas) {
      const chave = `${l.segmento}_${l.tipo}`;
      porSegmentoTipo[chave] = (porSegmentoTipo[chave] ?? 0) + 1;
    }
    return {
      nomeCidade: c.nomeCidade,
      localizacaoIdSugerido: match?.id ?? null,
      linhas: c.linhas,
      resumo: {
        totalLinhas,
        dataInicial: datas[0] ?? null,
        dataFinal: datas[datas.length - 1] ?? null,
        porSegmentoTipo,
      },
    };
  });

  return NextResponse.json({ cidades, cidadesCadastradas: cidadesCadastradas ?? [] });
}
