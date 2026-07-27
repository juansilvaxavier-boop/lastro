// Tipos compartilhados pelo motor de calculo do CRM (Parte B da especificacao).

export type IndiceCorrecao = "INCC" | "IPCA" | "IGPM";

export interface PontoIndicador {
  dataReferencia: string; // ISO yyyy-mm-dd
  valor: number; // fracao anual, ex 0.045 = 4.5% a.a.
}

export interface PontoPrecoMercado {
  dataReferencia: string;
  valorM2: number;
  variacaoMensal: number | null;
  variacaoAnual12m: number | null;
}

export interface EmpreendimentoResumo {
  id: string;
  precoTotal: number;
  unidadesTotais: number;
  unidadesDisponiveis: number;
  dataLancamento: string | null;
}

export interface AluguelEstimado {
  valorMensal: number;
}
