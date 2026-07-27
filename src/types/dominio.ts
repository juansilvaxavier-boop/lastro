import type { Tables } from "./database";

export type Localizacao = Tables<"localizacoes">;
export type Construtora = Tables<"construtoras"> & {
  numeroEmpreendimentosAtivos?: number;
  percentualEntregasNoPrazo?: number | null;
};
export type Empreendimento = Tables<"empreendimentos"> & {
  construtora?: { id: string; nome: string } | null;
  bairro?: { id: string; nome: string; parent_id?: string | null } | null;
  favoritado?: boolean;
  valorizacaoBairroDesdeLancamento?: number | null;
};
export type Cliente = Tables<"clientes"> & {
  corretor?: { id: string; nome: string | null } | null;
  ultimaInteracaoEm?: string | null;
  imovelInteresse?: { id: string; nome: string } | null;
};
export type Interacao = Tables<"interacoes"> & {
  usuario?: { id: string; nome: string | null } | null;
};
export type Usuario = Tables<"usuarios">;
export type IndicadorMercado = Tables<"indicadores_mercado">;
export type PrecoMercadoLocal = Tables<"precos_mercado_local"> & {
  localizacao?: { id: string; nome: string; tipo: string } | null;
};
export type PontoInteresse = Tables<"pontos_interesse">;
export type CenarioMacro = Tables<"cenario_macro">;

export const ETAPAS_FUNIL = ["lead", "em_atendimento", "apresentacao", "proposta", "fechado", "perdido"] as const;
export const LABEL_ETAPA_FUNIL: Record<(typeof ETAPAS_FUNIL)[number], string> = {
  lead: "Lead",
  em_atendimento: "Em atendimento",
  apresentacao: "Apresentação",
  proposta: "Proposta",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const LABEL_STATUS_EMPREENDIMENTO: Record<string, string> = {
  lancamento: "Lançamento",
  em_obra: "Em obra",
  pronto: "Pronto",
};

export const LABEL_TIPO_LOCALIZACAO: Record<string, string> = {
  estado: "Estado",
  regiao: "Região",
  cidade: "Cidade",
  bairro: "Bairro",
};

export const ESTRATEGIAS_SAIDA = ["ganho_capital", "renda_aluguel", "patrimonial"] as const;
export const LABEL_ESTRATEGIA_SAIDA: Record<(typeof ESTRATEGIAS_SAIDA)[number], string> = {
  ganho_capital: "Ganho de capital (ágio)",
  renda_aluguel: "Renda de aluguel (yield)",
  patrimonial: "Patrimonial / preservação",
};

export const TIPOS_PONTO_INTERESSE = ["shopping", "hospital", "universidade", "via", "outro"] as const;
export const LABEL_TIPO_PONTO_INTERESSE: Record<(typeof TIPOS_PONTO_INTERESSE)[number], string> = {
  shopping: "Shopping",
  hospital: "Hospital",
  universidade: "Universidade",
  via: "Via / avenida",
  outro: "Outro",
};
