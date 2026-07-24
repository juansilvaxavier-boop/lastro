import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { exigirPapel } from "@/lib/auth";
import { FERRAMENTAS_CRM } from "@/lib/assistente/tools";
import { z } from "zod";

export const maxDuration = 60;

const bodySchema = z.object({
  mensagem: z.string().min(1).max(4000),
  historico: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        texto: z.string(),
      })
    )
    .max(30)
    .optional(),
});

const MAX_ITERACOES = 8;

function montarSystemPrompt(nome: string, papel: string): string {
  const hoje = new Date().toISOString().slice(0, 10);
  return `Você é o assistente interno do Lastro, um CRM imobiliário usado por uma imobiliária que atua em São José do Rio Preto (SP) e cidades da região.

Você está conversando com ${nome} (papel: ${papel}). Data de hoje: ${hoje}.

Use as ferramentas disponíveis para consultar ou alterar dados do sistema (clientes, empreendimentos, construtoras, localizações, indicadores de mercado) sempre que a pergunta depender de dados reais — nunca invente números, nomes ou IDs. Use a busca na web para perguntas sobre informações externas ao sistema (notícias, dados de mercado públicos, contexto econômico, etc.).

Antes de criar ou alterar um registro (cliente, empreendimento, interação), confirme com o usuário os dados principais caso não estejam claros na mensagem. Depois de executar uma ação, resuma o que foi feito.

Responda sempre em português do Brasil, de forma direta e objetiva.`;
}

export async function POST(request: NextRequest) {
  const guard = await exigirPapel(["admin", "gestor"]);
  if ("resposta" in guard) return guard.resposta;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Assistente não configurado (ANTHROPIC_API_KEY ausente)." }, { status: 503 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { mensagem, historico } = parsed.data;

  const supabase = await createClient();
  const client = new Anthropic();

  const messages: Anthropic.MessageParam[] = [
    ...(historico ?? []).map((h) => ({ role: h.role, content: h.texto }) satisfies Anthropic.MessageParam),
    { role: "user", content: mensagem },
  ];

  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: 5 },
    ...FERRAMENTAS_CRM.map((f) => f.definicao),
  ];

  const ferramentasPorNome = new Map(FERRAMENTAS_CRM.map((f) => [f.definicao.name, f]));
  const acoes: { ferramenta: string; ok: boolean; resumo?: string }[] = [];

  let iteracoes = 0;
  let ultimaResposta: Anthropic.Message | null = null;

  try {
    while (iteracoes < MAX_ITERACOES) {
      iteracoes++;

      const response = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: 4096,
        system: montarSystemPrompt(guard.usuario.nome ?? "usuário", guard.usuario.papel),
        tools,
        messages,
      });

      ultimaResposta = response;

      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        continue;
      }

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) break;

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const bloco of toolUseBlocks) {
        const ferramenta = ferramentasPorNome.get(bloco.name);
        if (!ferramenta) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: bloco.id,
            content: `Ferramenta desconhecida: ${bloco.name}`,
            is_error: true,
          });
          continue;
        }
        try {
          const resultado = await ferramenta.executar(bloco.input as Record<string, unknown>, {
            supabase,
            usuarioId: guard.usuario.id,
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: bloco.id,
            content: JSON.stringify(resultado),
          });
          acoes.push({ ferramenta: bloco.name, ok: true });
        } catch (erro) {
          const msg = erro instanceof Error ? erro.message : "Erro desconhecido";
          toolResults.push({
            type: "tool_result",
            tool_use_id: bloco.id,
            content: `Erro: ${msg}`,
            is_error: true,
          });
          acoes.push({ ferramenta: bloco.name, ok: false, resumo: msg });
        }
      }

      messages.push({ role: "user", content: toolResults });
    }
  } catch (erro) {
    if (erro instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Chave de API da Anthropic inválida." }, { status: 503 });
    }
    if (erro instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Limite de requisições da API atingido, tente novamente em instantes." }, { status: 503 });
    }
    if (erro instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `Erro na API do assistente: ${erro.message}` }, { status: 502 });
    }
    throw erro;
  }

  const textoResposta = (ultimaResposta?.content ?? [])
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();

  return NextResponse.json({
    resposta: textoResposta || "Não consegui gerar uma resposta. Tente reformular a pergunta.",
    acoes,
  });
}
