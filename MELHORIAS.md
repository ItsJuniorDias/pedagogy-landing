# 🔧 Melhorias aplicadas — funil de conversão (web / Meta Ads)

Resumo do que mudou e, principalmente, **o que você PRECISA configurar** para as
mudanças de fato converterem. Código sozinho não resolve os 3 itens de
infraestrutura (back_url do MP, `VITE_API_BASE`, `MP_ACCESS_TOKEN`).

---

## ✅ O que mudou no código

### 1. Funil pago encurtado — nova página pública `/premium` (o maior ganho)
Antes, o `InitiateCheckout` só era atingível após EmailGate → `/login` → cadastro
de 2 etapas → navegar → tocar num conteúdo bloqueado → paywall (~9 passos). Agora:

**anúncio → `/premium` (email + escolher plano + Assinar) → checkout MP → paga → Premium liberado.**

- `src/pages/Premium.jsx` **(novo)**: paywall público, e-mail inline (que também
  alimenta a EMQ via `identify` + `Lead`), dispara `InitiateCheckout` e vai direto
  ao checkout do Mercado Pago. A **conta é criada só após o pagamento confirmado**.
  Também é o handler de retorno do checkout (confirma status → libera → `Purchase`).
- `src/App.jsx`: rota pública `/premium` (fora do `RequireAuth`).
- `src/components/Pricing.jsx` + `src/hooks/useSubscribe.js` **(novo)**: os botões
  “Start monthly/annual” agora vão direto pro `/premium` (Android/desktop) ou App
  Store (iOS), em vez de caírem no `/login`.

### 2. Roteamento de device corrigido
`src/device.js`: **desktop agora vai pro app web** (antes ia pra App Store, onde
não há checkout MP nem pixel web). iOS continua na App Store. O fallback web dos
CTAs “grátis” passou de `/login` para `/signup` (melhor pra tráfego frio).

### 3. Moeda corrigida para BRL (era USD)
`InitiateCheckout`/`Purchase` iam com `USD 9.99/79.99`, mas o MP cobra em BRL.
- `src/payments/mercadopago.js`: `amountBRL` por plano é a **fonte única** do
  preço (exibição **e** `value` enviado ao Meta). Helpers `planPricing()` e
  `formatBRL()`.
- `src/data.js`: `PRICING` agora deriva de `amountBRL` (BRL, pt-BR).
- `src/pages/app/Paywall.jsx`: `value/currency` vêm do número (não de string USD).

### 4. Limpezas
Comentário obsoleto no `Paywall` (anual “coming soon”) corrigido; `.env` viraram
templates documentados (sem segredos reais — os de produção ficam na Vercel/Render).

> Build validado: `npm install && npx vite build` → OK (831 módulos).

---

## 🚨 O que você PRECISA configurar (senão nada disso converte)

### A. `back_url` de cada plano no painel do Mercado Pago → aponte pra `/premium`  ⟵ CRÍTICO
Ferramentas de vendas → Planos de assinatura → cada plano → **URL de retorno**:
```
https://SEU_DOMINIO/premium
```
Se apontar para `/app/paywall` (que exige login), o visitante não logado é jogado
pro `/login` no retorno e **o pagamento nunca é confirmado**. Faça isso nos dois planos.

### B. `VITE_API_BASE` na Vercel (build time)  ⟵ destrava Purchase + EMQ server-side
Vercel → Project → Settings → Environment Variables → `VITE_API_BASE` = URL do seu
backend (ex.: `https://SEU-BACKEND.onrender.com`) → **Redeploy**. Sem isto o
`Purchase` do navegador nunca dispara e a camada CAPI fica desligada.

### C. Variáveis do backend no Render  ⟵ destrava Purchase server-side
Render → Service → Environment: `MP_ACCESS_TOKEN` (produção), `META_PIXEL_ID`,
`META_CAPI_TOKEN`, `PUBLIC_APP_URL`, `CORS_ORIGINS`. Sem `MP_ACCESS_TOKEN`, o
webhook não lê a preapproval e o `Purchase` nunca sai.

### D. Webhook do Mercado Pago
Notificações/Webhooks → URL `https://SEU-BACKEND/api/webhooks/mercadopago`,
eventos **Assinaturas (preapproval)** e **Pagamentos de assinatura**.

### E. Preço real dos planos
Em `src/payments/mercadopago.js`, ajuste `amountBRL` (mensal/anual) para bater
**exatamente** com o valor configurado no painel do MP. Hoje está `R$ 29,90` /
`R$ 239,90` como placeholder. Se não bater, o usuário vê um preço ≠ do cobrado.

---

## ✅ Como verificar
- Backend vivo: abra `https://SEU-BACKEND/health` → quer `{ mp: true, capi: true }`.
- Eventos: navegue com `?pixeldebug=1` na URL e veja o console; confirme
  `InitiateCheckout` disparando em `/premium` e o `Purchase` no retorno.
- Fonte da verdade: Gerenciador de Eventos → **Testar eventos** (coloque
  `META_TEST_EVENT_CODE` no Render pra validar antes de ir pra valer).

## 💡 Recomendações (opcionais, alto impacto)
- Aponte o anúncio de assinatura **direto pra `/premium`** — é o funil mais curto.
- A landing e o `/premium` estão em inglês; para público BR, **localizar pt-BR**
  tende a subir conversão (posso fazer). O FAQ “cancele nas configurações da App
  Store” também não vale pra quem assina via web/MP — vale revisar.
- Backend no Render free tier hiberna: o cold start pode estourar a janela de
  verificação (5×3s) e o `matchStore` (em memória) se perde no deploy. Considere
  um plano que não dorme, ou mova o store pra Redis.
