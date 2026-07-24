import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesUpdate } from "@/types/database";

type ClientePatch = TablesUpdate<"clientes">;

type Supabase = SupabaseClient<Database>;

export interface ContextoFerramentas {
  supabase: Supabase;
  usuarioId: string;
}

export interface FerramentaCrm {
  definicao: Anthropic.Tool;
  executar: (input: Record<string, unknown>, ctx: ContextoFerramentas) => Promise<unknown>;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() ? valor.trim() : undefined;
}

function numero(valor: unknown): number | undefined {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : undefined;
}

const buscarClientes: FerramentaCrm = {
  definicao: {
    name: "buscar_clientes",
    description:
      "Busca clientes cadastrados no CRM. Use para responder perguntas sobre leads, funil de vendas, orçamento ou dados de contato.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Filtra por nome (busca parcial, case-insensitive)" },
        etapaFunil: {
          type: "string",
          enum: ["lead", "em_atendimento", "apresentacao", "proposta", "fechado", "perdido"],
        },
        limite: { type: "number", description: "Máximo de resultados (padrão 20, máximo 50)" },
      },
    },
  },
  async executar(input, ctx) {
    let query = ctx.supabase
      .from("clientes")
      .select("id, nome, telefone, email, perfil, etapa_funil, orcamento_min, orcamento_max, created_at")
      .order("created_at", { ascending: false })
      .limit(Math.min(numero(input.limite) ?? 20, 50));

    const nome = texto(input.nome);
    if (nome) query = query.ilike("nome", `%${nome}%`);
    const etapa = texto(input.etapaFunil);
    if (etapa) query = query.eq("etapa_funil", etapa);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { clientes: data };
  },
};

const criarCliente: FerramentaCrm = {
  definicao: {
    name: "criar_cliente",
    description: "Cadastra um novo cliente/lead no CRM.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        telefone: { type: "string" },
        email: { type: "string" },
        perfil: { type: "string", enum: ["primeira_moradia", "investidor", "troca_imovel"] },
        origemLead: { type: "string", enum: ["indicacao", "site", "redes_sociais", "plantao"] },
        etapaFunil: {
          type: "string",
          enum: ["lead", "em_atendimento", "apresentacao", "proposta", "fechado", "perdido"],
        },
        orcamentoMin: { type: "number" },
        orcamentoMax: { type: "number" },
        rendaInformada: { type: "number" },
      },
      required: ["nome"],
    },
  },
  async executar(input, ctx) {
    const nome = texto(input.nome);
    if (!nome) throw new Error("Nome é obrigatório.");

    const { data, error } = await ctx.supabase
      .from("clientes")
      .insert({
        nome,
        telefone: texto(input.telefone),
        email: texto(input.email),
        perfil: texto(input.perfil),
        origem_lead: texto(input.origemLead),
        corretor_responsavel_id: ctx.usuarioId,
        etapa_funil: texto(input.etapaFunil) ?? "lead",
        orcamento_min: numero(input.orcamentoMin),
        orcamento_max: numero(input.orcamentoMax),
        renda_informada: numero(input.rendaInformada),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { cliente: data };
  },
};

const atualizarCliente: FerramentaCrm = {
  definicao: {
    name: "atualizar_cliente",
    description: "Atualiza campos de um cliente existente, incluindo mover a etapa do funil (kanban).",
    input_schema: {
      type: "object",
      properties: {
        clienteId: { type: "string", description: "UUID do cliente (obtenha via buscar_clientes)" },
        etapaFunil: {
          type: "string",
          enum: ["lead", "em_atendimento", "apresentacao", "proposta", "fechado", "perdido"],
        },
        orcamentoMin: { type: "number" },
        orcamentoMax: { type: "number" },
        telefone: { type: "string" },
        email: { type: "string" },
      },
      required: ["clienteId"],
    },
  },
  async executar(input, ctx) {
    const clienteId = texto(input.clienteId);
    if (!clienteId) throw new Error("clienteId é obrigatório.");

    const patch: ClientePatch = {};
    const etapa = texto(input.etapaFunil);
    if (etapa) patch.etapa_funil = etapa;
    const orcamentoMin = numero(input.orcamentoMin);
    if (orcamentoMin !== undefined) patch.orcamento_min = orcamentoMin;
    const orcamentoMax = numero(input.orcamentoMax);
    if (orcamentoMax !== undefined) patch.orcamento_max = orcamentoMax;
    const telefone = texto(input.telefone);
    if (telefone) patch.telefone = telefone;
    const email = texto(input.email);
    if (email) patch.email = email;

    const { data, error } = await ctx.supabase.from("clientes").update(patch).eq("id", clienteId).select().single();
    if (error) throw new Error(error.message);
    return { cliente: data };
  },
};

const registrarInteracao: FerramentaCrm = {
  definicao: {
    name: "registrar_interacao",
    description: "Registra uma interação (ligação, WhatsApp, e-mail, reunião ou visita) com um cliente.",
    input_schema: {
      type: "object",
      properties: {
        clienteId: { type: "string" },
        tipo: { type: "string", enum: ["ligacao", "whatsapp", "email", "reuniao", "visita"] },
        observacao: { type: "string" },
      },
      required: ["clienteId", "tipo"],
    },
  },
  async executar(input, ctx) {
    const clienteId = texto(input.clienteId);
    const tipo = texto(input.tipo);
    if (!clienteId || !tipo) throw new Error("clienteId e tipo são obrigatórios.");

    const { data, error } = await ctx.supabase
      .from("interacoes")
      .insert({
        cliente_id: clienteId,
        usuario_id: ctx.usuarioId,
        tipo,
        observacao: texto(input.observacao),
        data: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { interacao: data };
  },
};

const buscarEmpreendimentos: FerramentaCrm = {
  definicao: {
    name: "buscar_empreendimentos",
    description: "Busca imóveis/empreendimentos cadastrados, com filtros de status, construtora e faixa de preço.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        status: { type: "string", enum: ["lancamento", "em_obra", "pronto"] },
        precoMin: { type: "number" },
        precoMax: { type: "number" },
        limite: { type: "number" },
      },
    },
  },
  async executar(input, ctx) {
    let query = ctx.supabase
      .from("empreendimentos")
      .select(
        "id, nome, status, preco_total, preco_m2, percentual_vendido, unidades_totais, unidades_disponiveis, data_entrega_prevista, construtora:construtoras(id, nome), bairro:localizacoes(id, nome)"
      )
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .limit(Math.min(numero(input.limite) ?? 20, 50));

    const nome = texto(input.nome);
    if (nome) query = query.ilike("nome", `%${nome}%`);
    const status = texto(input.status);
    if (status) query = query.eq("status", status);
    const precoMin = numero(input.precoMin);
    if (precoMin !== undefined) query = query.gte("preco_total", precoMin);
    const precoMax = numero(input.precoMax);
    if (precoMax !== undefined) query = query.lte("preco_total", precoMax);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { empreendimentos: data };
  },
};

const criarEmpreendimento: FerramentaCrm = {
  definicao: {
    name: "criar_empreendimento",
    description: "Cadastra um novo imóvel/empreendimento. Peça confirmação do usuário antes de chamar esta ferramenta, pois cria um registro visível para toda a equipe.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        construtoraId: { type: "string", description: "UUID da construtora (obtenha via buscar_construtoras)" },
        bairroId: { type: "string", description: "UUID do bairro (obtenha via buscar_localizacoes)" },
        metragemPrivativa: { type: "number" },
        precoTotal: { type: "number" },
        dataLancamento: { type: "string", description: "formato YYYY-MM-DD" },
        dataEntregaPrevista: { type: "string", description: "formato YYYY-MM-DD" },
        status: { type: "string", enum: ["lancamento", "em_obra", "pronto"] },
        unidadesTotais: { type: "number" },
        unidadesDisponiveis: { type: "number" },
      },
      required: ["nome", "precoTotal", "status", "unidadesTotais", "unidadesDisponiveis"],
    },
  },
  async executar(input, ctx) {
    const nome = texto(input.nome);
    const precoTotal = numero(input.precoTotal);
    const status = texto(input.status);
    const unidadesTotais = numero(input.unidadesTotais);
    const unidadesDisponiveis = numero(input.unidadesDisponiveis);
    if (!nome || precoTotal === undefined || !status || unidadesTotais === undefined || unidadesDisponiveis === undefined) {
      throw new Error("nome, precoTotal, status, unidadesTotais e unidadesDisponiveis são obrigatórios.");
    }

    const { data, error } = await ctx.supabase
      .from("empreendimentos")
      .insert({
        nome,
        construtora_id: texto(input.construtoraId),
        bairro_id: texto(input.bairroId),
        metragem_privativa: numero(input.metragemPrivativa),
        preco_total: precoTotal,
        data_lancamento: texto(input.dataLancamento),
        data_entrega_prevista: texto(input.dataEntregaPrevista),
        status,
        unidades_totais: unidadesTotais,
        unidades_disponiveis: unidadesDisponiveis,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { empreendimento: data };
  },
};

const buscarConstrutoras: FerramentaCrm = {
  definicao: {
    name: "buscar_construtoras",
    description: "Busca construtoras cadastradas.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
      },
    },
  },
  async executar(input, ctx) {
    let query = ctx.supabase.from("construtoras").select("*").order("nome");
    const nome = texto(input.nome);
    if (nome) query = query.ilike("nome", `%${nome}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { construtoras: data };
  },
};

const buscarLocalizacoes: FerramentaCrm = {
  definicao: {
    name: "buscar_localizacoes",
    description: "Busca estados, regiões, cidades ou bairros cadastrados (hierarquia de localização).",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string" },
        tipo: { type: "string", enum: ["estado", "regiao", "cidade", "bairro"] },
      },
    },
  },
  async executar(input, ctx) {
    let query = ctx.supabase.from("localizacoes").select("id, nome, tipo, parent_id").order("nome");
    const nome = texto(input.nome);
    if (nome) query = query.ilike("nome", `%${nome}%`);
    const tipo = texto(input.tipo);
    if (tipo) query = query.eq("tipo", tipo);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return { localizacoes: data };
  },
};

const buscarIndicadores: FerramentaCrm = {
  definicao: {
    name: "buscar_indicadores",
    description: "Busca o histórico recente de indicadores de mercado (Selic, CDI, IPCA, IGP-M, INCC).",
    input_schema: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["selic", "cdi", "ipca", "igpm", "incc"] },
        limite: { type: "number", description: "Quantos pontos retornar, do mais recente (padrão 12)" },
      },
      required: ["tipo"],
    },
  },
  async executar(input, ctx) {
    const tipo = texto(input.tipo);
    if (!tipo) throw new Error("tipo é obrigatório.");
    const { data, error } = await ctx.supabase
      .from("indicadores_mercado")
      .select("valor, data_referencia, fonte")
      .eq("tipo", tipo)
      .order("data_referencia", { ascending: false })
      .limit(Math.min(numero(input.limite) ?? 12, 36));
    if (error) throw new Error(error.message);
    return { historico: data };
  },
};

export const FERRAMENTAS_CRM: FerramentaCrm[] = [
  buscarClientes,
  criarCliente,
  atualizarCliente,
  registrarInteracao,
  buscarEmpreendimentos,
  criarEmpreendimento,
  buscarConstrutoras,
  buscarLocalizacoes,
  buscarIndicadores,
];
