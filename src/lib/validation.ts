import { z } from "zod";

export const perfilSchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  objetivo: z.enum(["valorizacao", "renda", "misto"]),
  prazo: z.enum(["curto", "medio", "longo"]),
  liquidez: z.enum(["baixa", "media", "alta"]),
  toleranciaRisco: z.enum(["baixa", "media", "alta"]),
  refinamento: z.record(z.string(), z.unknown()).optional(),
});

export const financiamentoSchema = z.object({
  empreendimentoId: z.string().uuid(),
  valorEntrada: z.number().min(0),
  numParcelas: z.number().int().min(1).max(480),
  taxaJurosAnual: z.number().min(0).max(1),
  sistema: z.enum(["PRICE", "SAC"]),
  salvar: z.boolean().optional(),
});

export const watchlistSchema = z.object({
  empreendimentoId: z.string().uuid(),
  status: z.enum(["salvo", "descartado"]),
  motivoDescarte: z.string().max(500).optional(),
});

export const empreendimentoSchema = z.object({
  nome: z.string().min(1),
  incorporadora: z.string().optional(),
  bairroId: z.string().uuid().optional(),
  endereco: z.string().optional(),
  tipo: z.enum(["lancamento", "na_planta", "pronto", "usado"]),
  statusObra: z.enum(["nao_iniciada", "em_obras", "concluida"]).optional(),
  dataEntregaPrevista: z.string().optional(),
  preco: z.number().positive(),
  areaM2: z.number().positive().optional(),
  quartos: z.number().int().min(0).optional(),
  vagas: z.number().int().min(0).optional(),
  valorCondominio: z.number().min(0).optional(),
  iptuAnual: z.number().min(0).optional(),
  aluguelEstimado: z.number().min(0).optional(),
});
