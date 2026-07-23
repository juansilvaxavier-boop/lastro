# Lastro

Sistema de análise de investimento imobiliário para São José do Rio Preto/SP.
O produto final é o **encaixe**: o cruzamento entre o perfil do investidor, o
produto (empreendimento) e o contexto (bairro + macroeconomia) — não um
ranking genérico de "melhores imóveis".

## Stack

Tudo em TypeScript, um repo, um deploy:

- **Next.js 16 (App Router)** — frontend + `app/api/*` como camada de API
- **Supabase** — Postgres (dados), Auth (login por link mágico), RLS
- **Vercel** — hosting + Cron Jobs (scheduler de alertas e sincronização de fontes)
- **Motor de cálculo** (`src/lib/engine`) — scores de valorização/renda, matching
  perfil×produto, cenários via simulação Monte Carlo, simulador de financiamento
  (PRICE/SAC), selo de confiança de calibração
- **Conectores de dados** (`src/lib/connectors`) — Bacen (SGS), IBGE (SIDRA), CVM
  (informes mensais de FII)
- `@react-pdf/renderer` para o PDF one-pager, `recharts` para os gráficos

## Estrutura

```
src/
  lib/
    engine/         motor de calculo puro (sem I/O) - testavel isoladamente
    connectors/      integracoes Bacen/IBGE/CVM
    pipeline.ts      liga o motor ao banco (recalculo de scores e matches)
    supabase/        clientes Supabase (browser, server, admin)
    validation.ts    schemas zod
  app/
    (app)/           paginas autenticadas: dashboard, watchlist, alertas
    onboarding/       questionario essencial + refinamento
    login/            login por link magico
    api/              rotas REST + jobs de sistema
```

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha as chaves (ver abaixo)
npm run dev
```

### Variáveis de ambiente

| Variável | Onde conseguir |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase > Project Settings > API (publishable/anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API (**secreta** — nunca no cliente) |
| `CRON_SECRET` | Gere uma string aleatória; configure a mesma na Vercel |

O projeto Supabase (`Lastro`, região us-west-2) e o schema já estão criados e
populados com dados de exemplo de 8 empreendimentos em 5 bairros de Rio Preto.

## Deploy (Vercel)

1. Importe este repositório na Vercel.
2. Configure as 4 variáveis de ambiente acima em Project Settings > Environment
   Variables (todas em Production e Preview).
3. O arquivo `vercel.json` já declara os Cron Jobs:
   - `sync-bacen` diário — Selic/CDI/IGP-M/IPCA
   - `sync-ibge` mensal — população do município
   - `sync-cvm` mensal — rendimento/P-VP médio de FIIs
   - `recalcular` diário — roda o motor sobre empreendimentos ativos e gera
     alertas de novo encaixe (Processo 8)
4. A Vercel injeta automaticamente `Authorization: Bearer $CRON_SECRET` nas
   chamadas de Cron — por isso `CRON_SECRET` precisa estar configurado.

## Fluxo (Processos 1-9, ver documento de arquitetura)

1. **Perfil** — onboarding com 3 perguntas essenciais (objetivo, prazo,
   liquidez) + refinamento opcional (tolerância a risco, observações)
2. **Dados** — empreendimento, bairro, macro (automatizados: Bacen/IBGE/CVM;
   manuais: renda/densidade por bairro, plano diretor, valor venal — replica a
   decisão do slide 9 do documento original)
3. **Scores** — valorização e renda, 0-100, recalculados por `recalcularScoresEempreendimento`
4. **Matching** — encaixe perfil×score, com penalidades por liquidez/risco
5. **Cenários** — pessimista/base/otimista via Monte Carlo (percentis 10/50/90)
6. **Dashboards + PDF + alertas** — implementados
7. **Calibração + selo de confiança** — schema e função de cálculo prontos
   (`calcularSeloConfianca`); a **coleta** de projeção-vs-realizado 6/12 meses
   depois ainda depende de alimentação manual ou de uma fonte de avaliação
   futura — não há automação para isso ainda

## Pendências conhecidas

- **`SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET`** precisam ser preenchidos
  (não foram gerados por segurança) antes do primeiro deploy.
- **Conector CVM**: o parser lê o CSV mensal de FIIs de forma defensiva (por
  nome de coluna, não por índice fixo), mas o endpoint não pôde ser testado
  neste ambiente de desenvolvimento (proxy de rede bloqueia `dados.cvm.gov.br`).
  Confirme o resultado do job `sync-cvm` após o primeiro deploy.
- **Renda média/densidade por bairro** continuam cadastro manual, por decisão
  do próprio documento de arquitetura (dado de setor censitário, sem endpoint
  automatizável simples).
- Autenticação testada apenas até a tela de login (o fluxo de link mágico não
  pôde ser concluído sem acesso a uma caixa de e-mail real neste ambiente).
