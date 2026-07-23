// Tipos compartilhados pelo motor de calculo (Processos 5-7 do fluxo Lastro).

export type Objetivo = "valorizacao" | "renda" | "misto";
export type Prazo = "curto" | "medio" | "longo";
export type Liquidez = "baixa" | "media" | "alta";
export type ToleranciaRisco = "baixa" | "media" | "alta";

export interface Perfil {
  id: string;
  objetivo: Objetivo;
  prazo: Prazo;
  liquidez: Liquidez;
  toleranciaRisco: ToleranciaRisco;
  capitalDisponivel: number | null;
}

export interface Bairro {
  id: string;
  nome: string;
  populacao: number | null;
  densidadeDemografica: number | null;
  rendaMedia: number | null;
}

export interface MacroIndicadores {
  selicAnual: number | null;
  cdiAnual: number | null;
  igpmAnual: number | null;
  ipcaAnual: number | null;
}

export interface Empreendimento {
  id: string;
  tipo: "lancamento" | "na_planta" | "pronto" | "usado";
  statusObra: "nao_iniciada" | "em_obras" | "concluida" | null;
  preco: number;
  areaM2: number | null;
  valorCondominio: number | null;
  iptuAnual: number | null;
  aluguelEstimado: number | null;
}

export interface ScoreValorizacao {
  score: number; // 0-100
  detalhes: {
    precoPorM2: number | null;
    precoPorM2RelativoAoBairro: number | null; // <1 = abaixo da media do bairro (bom)
    pressaoDemandaBairro: number; // 0-100, deriva de renda/densidade
    momentumMacro: number; // 0-100, deriva de IGP-M/IPCA
    estagioObra: number; // 0-100, quanto mais cedo no ciclo, maior o potencial
  };
}

export interface ScoreRenda {
  score: number; // 0-100
  detalhes: {
    yieldBrutoAnual: number | null; // aluguel*12 / preco
    yieldLiquidoAnual: number | null; // descontando condominio + iptu
    custoOportunidadeCdi: number | null; // yield liquido - CDI anual
  };
}

export interface MatchResult {
  scoreEncaixe: number; // 0-100
  pesos: { valorizacao: number; renda: number };
  detalhes: {
    penalidadeLiquidez: number;
    penalidadeRisco: number;
    penalidadeOrcamento: number;
  };
}

export type TipoCenario = "pessimista" | "base" | "otimista";

export interface CenarioResultado {
  tipo: TipoCenario;
  valorizacaoProjetadaPct: number;
  rendaProjetadaMensal: number | null;
}

export interface SimulacaoMonteCarloParams {
  taxaEsperadaAnual: number; // media de valorizacao esperada ao ano (fracao, ex 0.08)
  volatilidadeAnual: number; // desvio padrao anual (fracao, ex 0.05)
  anos: number;
  simulacoes?: number;
  seed?: number;
}
