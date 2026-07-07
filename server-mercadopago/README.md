# server-mercadopago — verificação de pagamento + CAPI

Esta pasta **não faz parte do site** (landing React/Vite). Ela vai no seu
**backend Fastify** (o de analytics no Render). É o pedaço que faltava para o
evento de compra só disparar quando o dinheiro entrou de verdade.

## O problema que isso resolve

Antes, o site tratava "voltei do checkout do Mercado Pago" (presença de
`preapproval_id` na URL) como "pagou", liberava Premium e disparava a conversão.
O MP manda o usuário de volta **mesmo sem pagamento** (cartão em análise, Pix/
boleto pendente, aba fechada), então dava pra ter `Purchase` no Meta com **0
assinantes no Mercado Pago** — exatamente o que você viu.

Agora:

- O site, no retorno, chama `GET /api/subscriptions/:id/status` e **só libera +
  dispara o Purchase** se o status real do MP for `authorized`.
- O `Purchase` server-side (CAPI) é disparado **apenas** pelo webhook, quando o
  MP confirma `authorized`/`approved` — nunca no clique nem no back_url.
- Navegador e servidor usam o **mesmo `event_id`** (`sub.<preapproval_id>`), então
  o Meta **deduplica** as duas cópias em vez de contar receita dobrada.

## Instalar

```ts
// no seu app Fastify
import mercadopagoConversions from "./server-mercadopago/mercadopago-conversions";
await app.register(mercadopagoConversions);
```

Requer Node 18+ (usa `fetch` e `crypto.subtle` globais).

## Variáveis de ambiente

| Var | Para que serve |
| --- | --- |
| `MP_ACCESS_TOKEN` | Access token do Mercado Pago (Produção). Lê a preapproval. |
| `META_PIXEL_ID` | `967920369353096`. |
| `META_CAPI_TOKEN` | Token da Conversions API (System User no Gerenciador de Eventos). |
| `META_TEST_EVENT_CODE` | Opcional. `TESTxxxx` para validar em **Eventos de teste**. |
| `PUBLIC_APP_URL` | Opcional. Ex.: `https://pedagogy.com.br` (`event_source_url`). |

## Configurar no Mercado Pago

Notificações/Webhooks → URL `https://<seu-backend>/api/webhooks/mercadopago`,
marcando os eventos **Assinaturas (preapproval)** e **Pagamentos de assinatura
(authorized_payment)**.

## Configurar no site (landing)

No `.env` do site, aponte para o backend:

```
VITE_API_BASE=https://<seu-backend>
```

Se ficar vazio, o site **falha seguro**: não libera Premium nem dispara Purchase
no retorno — ele confia no webhook + no re-sync do plano no próximo carregamento.

## Como testar sem cobrar de verdade

1. Preencha `META_TEST_EVENT_CODE` e abra **Gerenciador de Eventos → Eventos de
   teste**.
2. Faça um checkout real com um cartão de teste do MP que **recuse** o pagamento
   → a preapproval fica `pending`/`cancelled` → **nenhum** Purchase é disparado.
3. Faça um que **aprove** → o webhook recebe `authorized` → **um** Purchase
   aparece (deduplicado com a cópia do navegador pelo `event_id`).

## Nota sobre otimização de campanha

Depois disso, o `Purchase` passa a representar receita real. Só troque a
otimização das campanhas para `Purchase` **depois** de acumular alguns eventos
verdadeiros — otimizar em cima de 1 compra fantasma (ou de InitiateCheckout, que
é topo de funil) ensina o algoritmo a buscar quem inicia mas não paga.
