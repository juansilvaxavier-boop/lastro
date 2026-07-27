import { z } from "zod";

export const localizacaoSchema = z.object({
  nome: z.string().min(1),
  tipo: z.enum(["estado", "regiao", "cidade", "bairro"]),
  parentId: z.string().uuid().nullable().optional(),
  codigoIbge: z.string().regex(/^\d{7}$/, "Código IBGE deve ter 7 dígitos").nullable().optional(),
});

export const construtoraSchema = z.object({
  nome: z.string().min(1),
  cnpj: z.string().min(11).max(18).optional(),
  anoFundacao: z.number().int().min(1900).max(2100).optional(),
  reputacaoScore: z.number().min(0).max(100).optional(),
  statusCertidoes: z.enum(["regular", "pendente", "irregular"]).optional(),
});

export const empreendimentoSchema = z.object({
  nome: z.string().min(1),
  construtoraId: z.string().uuid().nullable().optional(),
  bairroId: z.string().uuid().nullable().optional(),
  metragemPrivativa: z.number().positive().optional(),
  metragemTotal: z.number().positive().optional(),
  precoTotal: z.number().positive(),
  dataLancamento: z.string().optional(),
  dataEntregaPrevista: z.string().optional(),
  dataEntregaReal: z.string().nullable().optional(),
  indiceCorrecaoObra: z.enum(["INCC", "IPCA", "IGPM"]).optional(),
  indiceCorrecaoPosEntrega: z.enum(["IPCA", "IGPM"]).optional(),
  status: z.enum(["lancamento", "em_obra", "pronto"]),
  unidadesTotais: z.number().int().min(0),
  unidadesDisponiveis: z.number().int().min(0),
  imagemUrl: z.string().url().optional(),
  ativo: z.boolean().optional(),
  observacaoValorizacao: z.string().max(1000).nullable().optional(),
});

export const clienteSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().optional(),
  email: z.string().email().optional(),
  perfil: z.enum(["primeira_moradia", "investidor", "troca_imovel"]).optional(),
  origemLead: z.enum(["indicacao", "site", "redes_sociais", "plantao"]).optional(),
  corretorResponsavelId: z.string().uuid().nullable().optional(),
  etapaFunil: z.enum(["lead", "em_atendimento", "apresentacao", "proposta", "fechado", "perdido"]).optional(),
  orcamentoMin: z.number().min(0).optional(),
  orcamentoMax: z.number().min(0).optional(),
  formaPagamentoPretendida: z.enum(["a_vista", "financiado", "misto"]).optional(),
  rendaInformada: z.number().min(0).optional(),
  empreendimentoInteresseId: z.string().uuid().optional(),
  valorEntradaDisponivel: z.number().min(0).nullable().optional(),
  parcelaMaximaMensal: z.number().min(0).nullable().optional(),
  estrategiaSaida: z.enum(["ganho_capital", "renda_aluguel", "patrimonial"]).nullable().optional(),
});

export const interacaoSchema = z.object({
  clienteId: z.string().uuid(),
  tipo: z.enum(["ligacao", "whatsapp", "email", "reuniao", "visita"]),
  observacao: z.string().max(2000).optional(),
  data: z.string().optional(),
});

export const indicadorSchema = z.object({
  tipo: z.enum(["selic", "cdi", "ipca", "igpm", "incc"]),
  valor: z.number(),
  dataReferencia: z.string(),
  fonte: z.string().min(1),
});

export const lancarIndicadoresSchema = z.object({
  indicadores: z
    .array(
      z.object({
        indicador: z.enum(["selic", "cdi", "igpm", "ipca"]),
        valor: z.number(),
        dataReferencia: z.string(),
        fonte: z.string().min(1),
        raw: z.unknown(),
      })
    )
    .min(1),
});

export const precoMercadoSchema = z.object({
  localizacaoId: z.string().uuid(),
  tipo: z.enum(["venda", "aluguel", "hospedagem"]),
  segmento: z.enum(["residencial", "comercial"]).optional(),
  valorM2: z.number().positive(),
  variacaoMensal: z.number().optional(),
  variacaoAnual12m: z.number().optional(),
  dataReferencia: z.string(),
});

export const importarPrecosSchema = z.object({
  localizacaoId: z.string().uuid(),
  linhas: z
    .array(
      z.object({
        tipo: z.enum(["venda", "aluguel"]),
        segmento: z.enum(["residencial", "comercial"]),
        valorM2: z.number().positive(),
        variacaoMensal: z.number().nullable(),
        variacaoAnual12m: z.number().nullable(),
        dataReferencia: z.string(),
      })
    )
    .min(1),
});

export const favoritoSchema = z.object({
  empreendimentoId: z.string().uuid(),
});

export const pontoInteresseSchema = z.object({
  cidadeId: z.string().uuid(),
  nome: z.string().min(1),
  tipo: z.enum(["shopping", "hospital", "universidade", "via", "outro"]),
  descricao: z.string().max(500).optional(),
  previsaoConclusao: z.string().nullable().optional(),
});

export const cenarioMacroSchema = z.object({
  texto: z.string().min(1).max(4000),
});

export const simulacaoSchema = z.object({
  empreendimentoId: z.string().uuid(),
  clienteId: z.string().uuid().nullable().optional(),
  formaPagamento: z.enum([
    "a_vista",
    "financiamento_construtora",
    "financiamento_bancario",
    "fluxo_personalizado",
  ]),
  parametros: z.record(z.string(), z.unknown()),
});
