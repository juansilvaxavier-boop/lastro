# Lastro

CRM imobiliário: acompanhamento de tendências de mercado, controle de imóveis
(empreendimentos), funil de clientes, cadastro de construtoras, hierarquia de
regiões (estado → região → cidade → bairro) e dados de mercado (Selic, CDI,
IPCA, IGP-M, INCC, preço/aluguel por região) — tudo num único sistema interno
para a equipe (admin/corretor/gestor).

## Stack

Tudo em TypeScript, um repo, um deploy:

- **Next.js 16 (App Router)** — frontend + `app/api/*` como camada de API
- **Supabase** — Postgres (dados), Auth (e-mail + senha), RLS
- **Vercel** — hosting + Cron Job (sincronização diária de indicadores do Bacen)
- **Motor de cálculo** (`src/lib/engine`) — financiamento SAC/PRICE, calculadora
  com os 4 modos de pagamento (à vista, financiamento bancário, financiamento
  direto com a construtora, fluxo personalizado), cap rate, % de entregas no
  prazo, ROI acumulado, projeção de valor de revenda
- **Conector de dados** (`src/lib/connectors/bacen.ts`) — Bacen (SGS): Selic, CDI,
  IGP-M, IPCA
- `recharts` para os gráficos, `lucide-react` para os ícones

## Estrutura

```
src/
  lib/
    engine/          motor de calculo puro (sem I/O) - testavel isoladamente
    connectors/       integracao Bacen (SGS)
    supabase/         clientes Supabase (browser, server, admin)
    validation.ts     schemas zod
    auth.ts           guardas de sessao/papel para as rotas
  components/
    ui/               primitivos (Button, Card, Modal, ConfirmDialog...)
    imoveis/ clientes/ construtoras/ regioes/ dados/ tendencias/
  app/
    (app)/            paginas autenticadas: tendencias, imoveis, clientes,
                       construtoras, regioes, dados
    login/            login (e-mail + senha)
    api/               rotas REST + job de sistema (sync-bacen)
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

O projeto Supabase (`Lastro`, região us-west-2) e o schema (usuarios,
construtoras, localizacoes, empreendimentos, clientes, interacoes,
indicadores_mercado, precos_mercado_local, simulacoes etc.) já estão criados.
O primeiro usuário precisa ser inserido manualmente em `usuarios` (papel
`admin`) apontando para um usuário já criado em Supabase Auth.

## Deploy (Vercel)

1. Importe este repositório na Vercel.
2. Configure as 4 variáveis de ambiente acima em Project Settings > Environment
   Variables (todas em Production e Preview).
3. O arquivo `vercel.json` já declara o Cron Job `sync-bacen` (diário —
   Selic/CDI/IGP-M/IPCA). A Vercel injeta automaticamente
   `Authorization: Bearer $CRON_SECRET` na chamada — por isso `CRON_SECRET`
   precisa estar configurado.

## Papéis

- **admin** / **gestor** — podem criar/editar/excluir construtoras, imóveis,
  regiões e indicadores.
- **corretor** — gerencia clientes, interações e simulações; leitura em tudo
  mais.

## Pendências conhecidas

- **INCC** e **preço m²/aluguel por região** não têm fonte pública gratuita
  confiável (FipeZAP não expõe API oficial) — ficam como cadastro manual pela
  tela Dados (`+ Novo dado`).
- **`SUPABASE_SERVICE_ROLE_KEY` e `CRON_SECRET`** precisam ser preenchidos
  antes do primeiro deploy.
- Fluxo de autenticação testado via renderização da tela `/login`; o
  login end-to-end (sessão + navegação autenticada) não pôde ser exercitado
  neste ambiente de desenvolvimento porque a política de rede do sandbox
  bloqueia chamadas diretas do navegador ao domínio do Supabase — validar
  manualmente após o deploy ou em ambiente com rede liberada.
- "Velocidade de vendas" (tela Tendências) usa apenas 2 pontos reais (data de
  lançamento → hoje), pois o schema não mantém histórico mensal de unidades
  disponíveis; para uma série mensal completa seria necessário um snapshot
  periódico (ex: job diário gravando `unidades_disponiveis` em uma tabela de
  histórico).
