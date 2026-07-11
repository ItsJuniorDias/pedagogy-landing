// -----------------------------------------------------------------------------
// pages/Premium.jsx — PÁGINA PÚBLICA de assinatura (checkout-first).
//
// PARA QUE SERVE
//   Encurtar o funil pago ao máximo. Antes, o InitiateCheckout (evento que a
//   campanha otimiza) só era atingível depois de: EmailGate → /login → cadastro
//   de 2 etapas → navegar → tocar num conteúdo bloqueado → paywall. Aqui o
//   visitante chega direto do anúncio, informa o email UMA vez (que também
//   alimenta a EMQ) e vai pro checkout do Mercado Pago em UM passo. A conta é
//   criada só DEPOIS do pagamento confirmado.
//
//   Fluxo novo:  anúncio → /premium (email + escolher plano + Assinar)
//                        → checkout MP → paga → volta → Premium liberado.
//
// ⚠️ IMPORTANTE (config do painel do MP): o `back_url` de CADA plano no Mercado
//    Pago PRECISA apontar para ESTA rota pública (ex.: https://SEU_DOMINIO/premium).
//    Se apontar para /app/paywall (que exige login), o visitante não logado é
//    jogado pro /login no retorno e o pagamento nunca é confirmado. Ver MELHORIAS.md.
// -----------------------------------------------------------------------------
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../auth/AuthContext.jsx";
import { Reveal, Stagger, RevealItem, Check } from "../components/ui.jsx";
import { fadeUp, spring, EASE } from "../motion.js";
import { IMG } from "../assets.js";
import { PRICING } from "../data.js";
import { isPremiumPlan } from "../access.js";
import {
  startSubscriptionCheckout,
  isCheckoutConfigured,
  readCheckoutReturn,
  readPendingCheckout,
  clearPendingCheckout,
  fetchSubscriptionStatus,
  planPricing,
} from "../payments/mercadopago.js";
import {
  identify,
  trackLead,
  trackViewPaywall,
  trackSelectPlan,
  trackInitiateSubscription,
  trackSubscriptionPurchase,
  applyAdvancedMatching,
} from "../lib/pixel.js";
import { attachCheckoutMatch } from "../lib/capi-client.js";
import { hasEmail, getIdentity } from "../lib/identity.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Friendly display name from an email handle (used when we only have the email).
const nameFromEmail = (email) =>
  email
    ? email
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase())
    : "Friend";

function PlanCard({ id, name, price, per, sub, features, highlight, selected, onSelect }) {
  const checkClasses =
    "shrink-0 grid place-items-center w-6 h-6 rounded-full text-[13px] font-extrabold ring-1 " +
    (selected
      ? highlight
        ? "bg-sunny text-ink ring-transparent"
        : "bg-grape text-white ring-transparent"
      : highlight
        ? "bg-white/15 text-transparent ring-white/30"
        : "bg-cream text-transparent ring-black/10");

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={spring.press}
      aria-pressed={selected}
      className={
        "relative h-full w-full text-left rounded-3xl p-6 sm:p-7 flex flex-col transition-shadow focus:outline-none " +
        (highlight
          ? "text-white ring-1 ring-white/15"
          : "bg-white text-ink ring-1 " + (selected ? "ring-grape" : "ring-black/5")) +
        (selected ? " shadow-[0_22px_46px_-26px_rgba(58,49,66,.55)]" : "")
      }
      style={highlight ? { background: "linear-gradient(160deg,#6D4BE0,#5435C4)" } : undefined}
    >
      {highlight && (
        <span className="absolute -top-3 right-5 rounded-full bg-sunny text-ink text-[11px] sm:text-[12px] font-extrabold px-3 py-1 shadow">
          ★ BEST VALUE
        </span>
      )}

      <div className={"flex items-center gap-2.5 " + (highlight ? "mt-1" : "")}>
        <span className={checkClasses} aria-hidden="true">
          ✓
        </span>
        <span className={"font-display font-extrabold text-lg sm:text-xl " + (highlight ? "" : "text-ink")}>
          {name}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-1">
        <span className="font-display font-extrabold text-4xl sm:text-5xl leading-none">{price}</span>
        <span className={"mb-1 font-bold text-sm sm:text-base " + (highlight ? "text-white/80" : "text-inksoft")}>
          / {per}
        </span>
      </div>
      <p className={"mt-2 font-bold text-[13px] sm:text-[14px] " + (highlight ? "text-sunny" : "text-inksoft")}>
        {sub}
      </p>

      <ul className="mt-5 space-y-2.5 flex-1">
        {features.map((f, i) => (
          <li
            key={i}
            className={"flex gap-2.5 font-bold text-[14px] sm:text-[15px] " + (highlight ? "" : "text-ink")}
          >
            <Check color={highlight ? "#16BFA6" : "#6D4BE0"} />
            {f}
          </li>
        ))}
      </ul>
    </motion.button>
  );
}

export default function Premium() {
  const { user, isAuthed, login, upgradePlan } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const plans = useMemo(
    () => ({
      monthly: {
        id: "monthly",
        name: "Monthly",
        price: PRICING.monthly.price,
        per: "month",
        sub: PRICING.monthly.note,
        features: PRICING.monthly.features,
      },
      annual: {
        id: "annual",
        name: "Annual",
        price: PRICING.annual.price,
        per: "year",
        sub: PRICING.annual.subnote,
        features: PRICING.annual.features,
        highlight: true,
      },
    }),
    [],
  );

  // Plano inicial vindo do CTA (?plan=monthly|annual); anual por padrão.
  const initialPlan = searchParams.get("plan") === "monthly" ? "monthly" : "annual";
  const [selected, setSelected] = useState(initialPlan);

  const [email, setEmail] = useState(() => getIdentity().email || "");
  const [name, setName] = useState(() => getIdentity().firstName || "");
  const [err, setErr] = useState("");
  const [working, setWorking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState(null); // 'coming-soon' | 'error' | 'cancelled' | 'processing'
  const viewFired = useRef(false);

  // ViewContent (paywall) uma vez ao abrir — mantém o funil ViewContent→IC→Purchase.
  useEffect(() => {
    if (viewFired.current) return;
    viewFired.current = true;
    trackViewPaywall({ kind: "premium_page", title: "Pedagogy Premium" });
  }, []);

  const selectPlan = (id) => {
    setSelected(id);
    const { value, currency } = planPricing(id);
    trackSelectPlan({ plan: id, value, currency });
  };

  // ── Retorno do checkout (o back_url do plano aponta pra cá) ─────────────────
  // Igual ao /app/paywall: o back_url NÃO prova pagamento. Confirmamos o status
  // real no servidor e só então criamos a conta, liberamos Premium e disparamos
  // o Purchase (eventID determinístico → dedupe com o CAPI do webhook).
  useEffect(() => {
    const ret = readCheckoutReturn(searchParams);
    if (!ret) return;

    if (ret.outcome === "cancelled") {
      clearPendingCheckout();
      setNotice("cancelled");
      setSearchParams({}, { replace: true });
      return;
    }

    const pending = readPendingCheckout();
    const planId = pending?.planId || selected;
    const returnTo = pending?.returnTo || "/app";

    // EMQ: garante o Advanced Matching e anexa email + _fbp + _fbc + external_id
    // (+ IP/UA reais desta request) à preapproval, pro Purchase do webhook casar forte.
    applyAdvancedMatching();
    if (ret.preapprovalId) attachCheckoutMatch(ret.preapprovalId);

    const confirmPaid = () => {
      const { value, currency } = planPricing(planId);
      const id = getIdentity();
      const mail = id.email;
      const fullName =
        [id.firstName, id.lastName].filter(Boolean).join(" ").trim() || nameFromEmail(mail);

      // Cria/restaura a conta SÓ agora (após pagar) — e só se ainda não logado.
      if (!isAuthed && mail) login({ email: mail, name: fullName });

      upgradePlan("Premium", {
        plan: planId,
        cycle: plans[planId]?.per,
        provider: "mercadopago",
        preapprovalId: ret.preapprovalId,
      });
      trackSubscriptionPurchase({ plan: planId, value, currency, id: ret.preapprovalId });
      clearPendingCheckout();
      navigate(returnTo, { replace: true });
    };

    let cancelled = false;
    (async () => {
      setNotice(null);
      setVerifying(true);

      const MAX_TRIES = 5;
      const DELAY_MS = 3000;
      for (let i = 0; i < MAX_TRIES && !cancelled; i++) {
        const r = await fetchSubscriptionStatus(ret.preapprovalId);
        if (cancelled) return;

        if (r.status === "authorized" || r.paid) {
          setVerifying(false);
          confirmPaid();
          return;
        }
        if (r.status === "cancelled" || r.status === "paused") {
          setVerifying(false);
          setNotice("cancelled");
          setSearchParams({}, { replace: true });
          return;
        }
        if (r.status === "unconfigured") {
          // Sem VITE_API_BASE não dá pra verificar. FALHA SEGURA: não libera nem
          // dispara Purchase — o webhook confirma depois.
          break;
        }
        if (i < MAX_TRIES - 1) await new Promise((res) => setTimeout(res, DELAY_MS));
      }

      if (!cancelled) {
        setVerifying(false);
        setNotice("processing");
        setSearchParams({}, { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Já é assinante → não faz sentido mostrar o paywall.
  if (isPremiumPlan(user?.plan)) {
    return <Navigate to="/app" replace />;
  }

  const handleSubscribe = async () => {
    setErr("");
    setNotice(null);

    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setErr("Enter a valid email so we can send your access.");
      return;
    }
    if (!isCheckoutConfigured(selected)) {
      setNotice("coming-soon");
      return;
    }

    // 1) Identifica (Advanced Matching: email hasheado em todo evento seguinte).
    const firstCapture = !hasEmail();
    identify({ email: value, firstName: name });
    // 2) Lead só na primeira captura deste visitante (nav + CAPI, mesmo eventID).
    if (firstCapture) trackLead({ content_name: "premium_page", step: "inline_email" });

    // 3) InitiateCheckout (valor/moeda vêm do número do plano → sempre BRL correto).
    const pricing = planPricing(selected);
    trackInitiateSubscription({ plan: selected, value: pricing.value, currency: pricing.currency });

    // 4) Redireciona pro checkout hospedado do Mercado Pago.
    setWorking(true);
    try {
      const res = await startSubscriptionCheckout({ planId: selected, returnTo: "/app" });
      if (!res?.ok) setNotice("coming-soon");
    } catch {
      setNotice("error");
    } finally {
      setWorking(false);
    }
  };

  const busy = working || verifying;

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <Reveal>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-display font-extrabold text-inksoft hover:text-grape text-sm"
          >
            ← Back to site
          </Link>
        </Reveal>

        {/* hero */}
        <Reveal delay={40}>
          <div
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white"
            style={{ background: "linear-gradient(140deg,#6D4BE0,#5435C4)" }}
          >
            <div className="relative z-10 max-w-lg">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-wide">
                ✨ Pedagogy Premium
              </span>
              <h1 className="mt-3 font-display font-extrabold text-2xl sm:text-4xl leading-tight">
                Unlock the whole world of stories
              </h1>
              <p className="mt-2 text-white/85 font-semibold text-[15px] sm:text-base leading-snug">
                50+ interactive stories, the full phonics path, and mini-games — one plan for the
                whole family. Cancel anytime.
              </p>
            </div>
            <img
              src={IMG.owl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute -right-3 -bottom-4 h-28 sm:h-36 select-none opacity-95"
            />
          </div>
        </Reveal>

        {/* plans */}
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch" stagger={0.1}>
          <RevealItem variants={fadeUp}>
            <PlanCard
              {...plans.monthly}
              selected={selected === "monthly"}
              onSelect={() => selectPlan("monthly")}
            />
          </RevealItem>
          <RevealItem variants={fadeUp}>
            <PlanCard
              {...plans.annual}
              selected={selected === "annual"}
              onSelect={() => selectPlan("annual")}
            />
          </RevealItem>
        </Stagger>

        {/* checkout */}
        <Reveal>
          <div className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-black/5 shadow-[0_18px_40px_-30px_rgba(58,49,66,.6)] space-y-3">
            <div>
              <label htmlFor="premium-email" className="block text-[13px] font-extrabold uppercase tracking-wide text-inksoft mb-1.5">
                Email
              </label>
              <input
                id="premium-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (err) setErr("");
                }}
                disabled={busy}
                className="w-full rounded-2xl border-2 border-black/5 bg-cream px-4 py-3.5 text-base font-bold text-ink placeholder:text-inksoft/60 focus:border-grape focus:outline-none disabled:opacity-60"
              />
            </div>
            <input
              type="text"
              autoComplete="given-name"
              placeholder="Your first name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              className="w-full rounded-2xl border-2 border-black/5 bg-cream px-4 py-3.5 text-base font-bold text-ink placeholder:text-inksoft/60 focus:border-grape focus:outline-none disabled:opacity-60"
            />

            {err && <p className="text-sm font-bold text-bubbled">{err}</p>}

            <motion.button
              type="button"
              onClick={handleSubscribe}
              disabled={busy}
              whileTap={{ scale: 0.98 }}
              transition={spring.press}
              className={"btn3d b-grape w-full px-6 py-4 text-base sm:text-lg " + (busy ? "opacity-70 pointer-events-none" : "")}
            >
              {verifying
                ? "Confirming your payment…"
                : working
                  ? "Connecting…"
                  : `Subscribe — ${plans[selected].price} / ${plans[selected].per}`}
            </motion.button>

            {verifying && (
              <p className="rounded-2xl bg-cream px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-black/5">
                ⏳ Confirming your payment with Mercado Pago… this only takes a moment.
              </p>
            )}
            {notice === "processing" && (
              <p className="rounded-2xl bg-butter px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-sunnyd/20">
                We got your checkout, but the payment is still being processed by Mercado Pago. As
                soon as it’s approved your access unlocks automatically — you can close this page.
                Pix or boleto can take a few minutes to confirm.
              </p>
            )}
            {notice === "coming-soon" && (
              <p className="rounded-2xl bg-butter px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-sunnyd/20">
                💳 This plan isn’t available for checkout just yet. Try the other plan, or check back
                soon!
              </p>
            )}
            {notice === "cancelled" && (
              <p className="rounded-2xl bg-butter px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-sunnyd/20">
                No worries — checkout was cancelled and you weren’t charged. You can subscribe
                whenever you’re ready.
              </p>
            )}
            {notice === "error" && (
              <p className="rounded-2xl bg-blush px-4 py-3 text-[14px] font-bold text-bubbled ring-1 ring-bubblegum/20">
                Something went wrong reaching checkout. Please try again.
              </p>
            )}

            <p className="pt-1 text-center text-[13px] font-bold text-inksoft">
              Cancel anytime · No ads, ever · Secure checkout by Mercado Pago
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
