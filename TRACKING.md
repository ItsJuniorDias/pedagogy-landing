# 📊 Tracking do Meta Pixel — Pedagogy

Mapa completo de todos os eventos do Meta (Facebook) Pixel instrumentados neste
site. O funil inteiro está coberto: do topo (landing) até a conversão de
assinatura, incluindo compras avulsas de moedas e sinais de engajamento.

**Pixel ID:** `967920369353096` (o mesmo do seu `index.html`).

---

## 🧱 Arquitetura

O tracking tem 4 camadas, para nunca quebrar e ficar fácil de manter:

| Camada | Arquivo | Papel |
| --- | --- | --- |
| **Pixel base** | `index.html` | Carrega o `fbq`, faz o `init` e dispara o **primeiro** `PageView`. Já estava aqui. |
| **Camada de eventos** | `src/lib/pixel.js` | Único ponto por onde todo evento passa. Wrapper seguro do `fbq` + helpers nomeados + **Advanced Matching** (`identify`, `applyAdvancedMatching`, `bootIdentity`). |
| **Identidade + CAPI (cliente)** | `src/lib/identity.js`, `src/lib/capi-client.js` | Guardam email/nome/`external_id`, leem `_fbp`/`_fbc`, e espelham eventos no backend (CAPI). |
| **Hooks** | `src/lib/pixel-hooks.js` | Eventos que não vêm de um clique: `PageView` por troca de rota (SPA), profundidade de rolagem, "visível na viewport". |

## 🎯 Qualidade da Correspondência de Eventos (EMQ) — de 3/10 para 7-8+

EMQ baixa = o Meta recebe os eventos mas quase não os casa com usuários reais,
porque o `user_data` vai fraco. A correção tem duas frentes:

**1. Advanced Matching no navegador.** Antes o `init` do pixel não mandava
nenhum dado do usuário. Agora, assim que sabemos o email (captura, cadastro ou
login), `identify()` salva a identidade e reinicia o pixel com `em`/`fn`/`ln`/
`ph`/`external_id` (o `fbq` hasheia sozinho) — e **todos os eventos seguintes**
passam a carregar isso. Um `external_id` estável é aplicado logo no boot.

**2. Captura de email (o `EmailGate`).** `src/components/EmailGate.jsx` mostra um
modal pedindo o email no clique de "baixar o app" (o momento de maior intenção),
uma única vez por visitante. Ao enviar: `identify` → `Lead` (navegador + CAPI) →
segue pro destino (App Store / app web). Um link "No thanks" não bloqueia quem
não quiser dar o email.

**3. Espelho server-side (CAPI).** Eventos server-side casam melhor porque levam
o que o navegador sozinho não garante: `client_ip_address`, `client_user_agent`,
`_fbp`, `_fbc`. O `Lead` é espelhado em `POST /api/lead`; o `Purchase` do webhook
é enriquecido com os dados guardados via `POST /api/checkout/attach` (chamado no
retorno do checkout). Tudo deduplicado com o navegador pelo mesmo `event_id`.

> **Ordem de impacto:** `_fbc` (clique no anúncio) > `em` (email) > `_fbp` > IP +
> User-Agent > `external_id`. A captura de email destrava o `em` para o funil
> inteiro; o resto já entra automaticamente.

> **Sem backend?** Sem `VITE_API_BASE`, o Advanced Matching do pixel continua
> funcionando (o `em` entra em todos os eventos do navegador); só o espelho
> server-side vira no-op seguro. Configure `VITE_API_BASE` + o `META_CAPI_TOKEN`
> no backend para ganhar IP/UA/`_fbp`/`_fbc` server-side.

**Por que uma camada única?** Assim os nomes e parâmetros dos eventos ficam
consistentes em todo o código, nada dispara se o pixel estiver bloqueado/ausente
(ex.: no código dos jogos react-native-web onde não existe `fbq`), e você liga o
modo debug num lugar só.

---

## 🗺️ Mapa de eventos

Legenda do tipo: **Padrão** = evento nativo do Meta (o Gerenciador de Anúncios
otimiza por ele nativamente) · **Custom** = evento nosso (vira Conversão
Personalizada / público no Gerenciador de Eventos).

### Topo do funil — Landing

| Ação do usuário | Evento | Tipo | Parâmetros | Onde dispara |
| --- | --- | --- | --- | --- |
| Abrir/navegar entre páginas | `PageView` | Padrão | — | `index.html` (1º load) + `usePageViews` a cada rota |
| Clicar em qualquer CTA de baixar o app (botão "Download free", selos App Store/Google Play, botões de preço) | `DownloadClick` | Custom | `placement`, `cta`, `destination` (`app_store`\|`web_app`), `plan` | `hooks/useGetApp.js` |
| Seção de **preços** entra na tela | `ViewContent` | Padrão | `content_type: pricing` | `components/Pricing.jsx` |
| Clicar em "Get started" / "Log in" no header | `CTAClick` | Custom | `cta`, `placement` (`nav`\|`nav_mobile`) | `components/Nav.jsx` |
| Clicar no botão flutuante do **WhatsApp** | `Contact` | Padrão | `channel: whatsapp` | `components/WhatsAppButton.jsx` |
| Rolar 25% / 50% / 75% / 100% da landing | `ScrollDepth` | Custom | `depth` | `pages/Landing.jsx` (via `useScrollDepth`) |

> **Sobre o `DownloadClick`:** como o produto é o app, o clique de download é a
> conversão-chave da landing. O `placement` diz de onde veio (`hero`,
> `final_cta`, `pricing`, `badge`) e o `cta` diz qual botão (`download_free`,
> `apple_badge`, `google_badge`, `start_monthly`, `start_annual`). No iOS/desktop
> `destination` é `app_store`; no Android é `web_app` (você manda pro app web).

### Cadastro / Login (funil do app web — usuários Android e web)

| Ação | Evento | Tipo | Parâmetros | Onde dispara |
| --- | --- | --- | --- | --- |
| Preencher a etapa de conta (nome+email+senha válidos) e avançar | `Lead` | Padrão | `content_name: signup`, `step: account` | `pages/Signup.jsx` |
| Concluir o cadastro (por email) | `CompleteRegistration` | Padrão | `method: email` | `pages/Signup.jsx` |
| Concluir cadastro pelos botões sociais (Google/Apple) | `CompleteRegistration` | Padrão | `method: social` | `pages/Signup.jsx` |
| Fazer login (usuário existente) | `Login` | Custom | `method: email` | `pages/Login.jsx` |

### Assinatura — a receita 💰

| Ação | Evento | Tipo | Parâmetros | Onde dispara |
| --- | --- | --- | --- | --- |
| Abrir o **paywall** | `ViewContent` | Padrão | `content_type: paywall`, `context` | `pages/app/Paywall.jsx` |
| Alternar plano (mensal/anual) | `PlanSelected` | Custom | `plan`, `value`, `currency` | `pages/app/Paywall.jsx` |
| Clicar em **Assinar** (vai pro checkout Mercado Pago) | `InitiateCheckout` | Padrão | `content_type: subscription`, `plan`, `value`, `currency` | `pages/app/Paywall.jsx` |
| **Pagamento confirmado** (status MP = `authorized`, verificado no servidor) | `Purchase` | Padrão | `content_type: subscription`, `plan`, `value`, `currency`, `predicted_ltv`, `subscription_id`, `transaction_id`, `eventID: sub.<preapproval_id>` | `pages/app/Paywall.jsx` |
| Botão dev "Simular assinatura" | `SimulatedSubscribe` | Custom | `plan` | `pages/app/Paywall.jsx` |

> **Mensal = US$ 9,99 · Anual = US$ 79,99** → enviados como `USD`.
>
> ⚠️ **A compra só dispara com pagamento confirmado.** O retorno do checkout
> (`back_url`) **não** prova pagamento — o Mercado Pago manda o usuário de volta
> mesmo com a assinatura `pending`. Por isso o `Purchase` só é disparado depois
> que o servidor confirma o status real da preapproval como `authorized`
> (`fetchSubscriptionStatus` → backend em `server-mercadopago/`). O clique em
> Assinar continua sendo só `InitiateCheckout` (topo de funil, **não** é receita).
>
> O `eventID` é determinístico (`sub.<preapproval_id>`), idêntico ao do webhook
> no servidor, então o Meta **deduplica** navegador + CAPI. Use `Purchase` como a
> conversão da campanha de assinatura — mas só depois de acumular eventos reais.

### Compra de moedas — dentro do jogo Happy Farm (avulsa)

| Ação | Evento | Tipo | Parâmetros | Onde dispara |
| --- | --- | --- | --- | --- |
| Abrir o checkout de um pacote de moedas | `InitiateCheckout` | Padrão | `content_type: coins`, `content_ids`, `value`, `currency: BRL`, `coins` | `hooks/UseCoinStore.js` |
| **Compra creditada** no retorno do pagamento | `Purchase` | Padrão | `content_type: coins`, `content_ids`, `value`, `currency: BRL`, `coins`, `transaction_id` | `hooks/UseCoinStore.js` |
| Pacote sem link configurado (grant simulado, dev) | `SimulatedCoinPurchase` | Custom | `sku`, `coins` | `hooks/UseCoinStore.js` |

> Pacotes: R$ 19,90 / R$ 49,90 / R$ 99,90 → enviados como `BRL`.

### Engajamento — sinais para públicos e retenção

| Ação | Evento | Tipo | Parâmetros | Onde dispara |
| --- | --- | --- | --- | --- |
| Abrir uma **história** | `ViewContent` | Padrão | `content_type: story`, `content_ids`, `content_name` | `pages/app/StoryReader.jsx` |
| Abrir uma **lição / curso** | `ViewContent` | Padrão | `content_type: lesson`, `content_ids`, `content_name` | `pages/app/LessonReader.jsx` |
| Abrir um **jogo** (Happy Farm / Neon Pong) | `GamePlayed` | Custom | `game` (`farm`\|`pong`) | `pages/app/Farm.jsx`, `pages/app/Pong.jsx` |
| Adicionar um novo leitor (criança) | `AddReader` | Custom | — | `pages/app/Profile.jsx` |

---

## 🚨 Dados de conversão limpos (importante)

Os botões de **desenvolvimento** (simular assinatura, grant de moedas sem link)
disparam eventos **custom separados** (`SimulatedSubscribe`,
`SimulatedCoinPurchase`) — **nunca** os eventos reais `Subscribe`/`Purchase`.
Assim seus testes não contaminam os dados de conversão que a campanha usa para
otimizar.

---

## ✅ Como verificar

Três formas, da mais rápida à mais completa:

1. **Console do navegador (dev)** — rode `npm run dev` ou abra qualquer página
   com `?pixeldebug=1` no fim da URL (ex.: `https://seusite.com/?pixeldebug=1`).
   Cada evento é logado no console como `[pixel] track|trackCustom NomeDoEvento`
   com todos os parâmetros. Funciona até em produção (é só o parâmetro na URL).

2. **Meta Pixel Helper** — extensão do Chrome. Navegue pelo site clicando nos
   CTAs e veja os eventos pipocarem em tempo real, com os parâmetros.

3. **Gerenciador de Eventos → Testar eventos** — cole a URL do site, interaja, e
   confira os eventos chegando no servidor do Meta (é a fonte da verdade).

**Roteiro de teste sugerido:** abra a landing (`PageView`) → role até o fim
(`ScrollDepth` + `ViewContent` de pricing) → clique em "Download free"
(`DownloadClick`) → clique no WhatsApp (`Contact`) → crie uma conta
(`Lead` → `CompleteRegistration`) → abra uma história (`ViewContent`) → vá ao
paywall (`ViewContent`) → alterne o plano (`PlanSelected`) → clique em Assinar
(`InitiateCheckout`).

---

## ⚙️ Configuração e ajustes

### Trocar o Pixel ID
O ID está em dois lugares. Para trocar:
1. Em `index.html` (o `fbq('init', '...')` e o `<noscript>`).
2. Opcionalmente, defina `VITE_META_PIXEL_ID` no `.env` — o `src/lib/pixel.js`
   usa esse valor se existir, senão cai no ID padrão. (Só afeta a camada de
   eventos; o `init` de fato vive no `index.html`.)

### Otimizar a campanha por qual evento?
- **Assinatura:** use **`Purchase`** como evento de conversão. Ele agora só
  dispara com **pagamento confirmado** (status MP `authorized`), no navegador e
  no servidor (CAPI), deduplicado pelo `eventID` determinístico. Só troque a
  otimização para `Purchase` **depois** de acumular alguns eventos reais —
  otimizar em cima de compra fantasma (ou de `InitiateCheckout`, que é topo de
  funil) ensina o algoritmo a buscar quem inicia mas não paga.
- **Compra de moedas:** já é `Purchase` (evento avulso correto).
- **Instalação do app / topo:** crie uma Conversão Personalizada em cima de
  `DownloadClick` (opcionalmente filtrando `destination = app_store`).

### Conversions API (CAPI) — confirmação de pagamento
A compra da assinatura é confirmada no servidor, não no navegador:
- O site, no retorno do checkout, chama `GET /api/subscriptions/:id/status` e só
  libera Premium + dispara `Purchase` se o MP responder `authorized`.
- O `Purchase` server-side é disparado **apenas** pelo webhook do Mercado Pago,
  quando o pagamento é confirmado — nunca no clique nem no `back_url`.
- Navegador e servidor usam o mesmo `eventID` (`sub.<preapproval_id>`), então o
  Meta deduplica as duas cópias.

Código do backend e instruções: **`server-mercadopago/`**. Aponte o site para ele
com `VITE_API_BASE` no `.env`. Vazio = falha segura (não libera nem dispara até o
webhook confirmar).

---

## 🧩 Adicionar um evento novo (padrão de código)

1. Adicione um helper em `src/lib/pixel.js`:
   ```js
   export const trackAlgo = ({ x } = {}) => trackCustom('Algo', { x })
   ```
2. Importe e chame onde a ação acontece:
   ```js
   import { trackAlgo } from '../lib/pixel.js'
   // ...
   onClick={() => trackAlgo({ x: 1 })}
   ```

Nunca chame `window.fbq` direto nos componentes — sempre passe pela camada
`pixel.js`, para manter a consistência e a segurança (guarda contra pixel
ausente/bloqueado).
