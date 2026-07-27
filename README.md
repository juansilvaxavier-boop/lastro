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
- **Mapa de bairros** (`src/components/regioes/MapaCidade.tsx`, Leaflet +
  OpenStreetMap, sem chave de API) — coordenadas buscadas automaticamente via
  geocodificação gratuita (Nominatim, `src/lib/connectors/geocodificacao.ts`).
  Os próprios nomes dos bairros de uma cidade também podem ser descobertos
  automaticamente (Overpass API/OpenStreetMap, `src/lib/connectors/overpass.ts`)
  com revisão antes de cadastrar
- **Assistente de IA** (`src/app/api/assistente`, `src/lib/assistente`) — chat
  interno (texto ou voz) construído com a API da Anthropic (`@anthropic-ai/sdk`,
  modelo `claude-opus-5`), com ferramentas para consultar e criar/editar dados
  do CRM (clientes, imóveis, construtoras, interações) e busca na web nativa —
  visível apenas para `admin`/`gestor`
- **Comparador de estratégias** (`src/lib/engine/comparador.ts`) — cruza a
  capacidade financeira do cliente (entrada disponível, parcela máxima,
  estratégia de saída) com cada imóvel ativo: viabilidade de financiamento,
  ROI sobre capital próprio, comparativo com renda fixa líquida de IR e
  "custo do atraso" (quanto o imóvel encarece por mês de espera)
- **Modo apresentação** (`/apresentacao`) — sequência em tela cheia pensada
  para reunião com cliente: cenário macro → dados da cidade → mapa com
  bairros mais valorizados e infraestrutura futura → casos de sucesso
  (valorização real desde o lançamento) → captura de dados do cliente →
  recomendação personalizada
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
    assistente/       ferramentas do chat de IA (tool use)
  components/
    ui/               primitivos (Button, Card, Modal, ConfirmDialog...)
    imoveis/ clientes/ construtoras/ regioes/ dados/ tendencias/ assistente/
    apresentacao/     slides do modo apresentacao (reusa os componentes acima)
  app/
    (app)/            paginas autenticadas: tendencias, imoveis, clientes,
                       construtoras, regioes, dados
    apresentacao/      modo apresentacao em tela cheia (fora do Shell/sidebar)
    login/            login (e-mail + senha)
    api/               rotas REST + job de sistema (sync-bacen) + assistente
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
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) — necessária para o assistente de IA (`/api/assistente`); sem ela o chat fica desabilitado (as demais telas funcionam normalmente) |

O projeto Supabase (`Lastro`, região us-west-2) e o schema (usuarios,
construtoras, localizacoes, empreendimentos, clientes, interacoes,
indicadores_mercado, precos_mercado_local, simulacoes etc.) já estão criados.
O primeiro usuário precisa ser inserido manualmente em `usuarios` (papel
`admin`) apontando para um usuário já criado em Supabase Auth.

## Deploy (Vercel)

1. Importe este repositório na Vercel.
2. Configure as 5 variáveis de ambiente acima em Project Settings > Environment
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
- O botão de voz do assistente usa a Web Speech API do navegador (reconhecimento
  de fala nativo) — funciona em Chrome/Edge; navegadores sem suporte simplesmente
  não mostram o botão de microfone, o chat continua funcionando por texto.
- Não foi possível testar o assistente de IA neste ambiente de desenvolvimento
  (rede do sandbox bloqueia chamadas à API da Anthropic) — validar manualmente
  após o deploy, com `ANTHROPIC_API_KEY` configurada na Vercel.
- A geocodificação de bairros (Nominatim) também não pôde ser testada neste
  ambiente pelo mesmo motivo (rede do sandbox bloqueia o domínio) — validar
  manualmente após o deploy. Nominatim é gratuito mas tem limite de 1
  requisição/segundo e pode não encontrar bairros com nomes muito genéricos ou
  ambíguos; nesses casos o bairro fica sem coordenada (não aparece no mapa) até
  ser corrigido manualmente. O mesmo vale para os pontos de interesse
  (infraestrutura futura) cadastrados no mapa.
- O **comparador de estratégias** projeta valorização usando a variação anual
  observada no histórico de preços do bairro (quando existe); sem esse
  histórico, o ganho de capital projetado fica em branco e só a viabilidade
  de financiamento é calculada. "Taxa de ocupação/liquidez de revenda" de um
  empreendimento não é calculável automaticamente (não existe fonte pública
  nem dado de mercado secundário no sistema) — fica como campo manual opcional
  (`observação de valorização/liquidez`) no cadastro do imóvel.
- O **modo apresentação** não tem estado próprio além do que já existe no
  banco — trocar de cidade ou sair da tela reseta a navegação por slides
  (o cliente cadastrado e os dados ficam salvos normalmente).
- A **busca automática de bairros** (Overpass API/OpenStreetMap) também não
  pôde ser testada neste ambiente (mesma restrição de rede do sandbox) —
  validar após o deploy. Exige que a cidade já tenha coordenadas (buscar
  antes na aba Mapa da cidade); a busca cobre um raio de ~15km e depende da
  qualidade do mapeamento OSM na região — bairros não mapeados como
  `suburb`/`neighbourhood`/`quarter` no OpenStreetMap não aparecem e
  continuam precisando de cadastro manual.
