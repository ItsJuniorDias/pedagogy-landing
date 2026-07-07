import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthContext.jsx";
import { Reveal, Stagger, RevealItem, Check } from "../../components/ui.jsx";
import { fadeUp, spring } from "../../motion.js";
import { PRICING } from "../../data.js";
import { isPremiumPlan } from "../../access.js";
import {
  startSubscriptionCheckout,
  isCheckoutConfigured,
  readCheckoutReturn,
  readPendingCheckout,
  clearPendingCheckout,
  fetchSubscriptionStatus,
} from "../../payments/mercadopago.js";
import {
  parsePrice,
  trackViewPaywall,
  trackSelectPlan,
  trackInitiateSubscription,
  trackSubscriptionPurchase,
  trackSimulatedSubscribe,
} from "../../lib/pixel.js";

// Where to send people who back out, based on what they tried to unlock.
const backFor = (kind) => (kind === "course" ? "/app/path" : "/app/stories");

function PlanCard({
  id,
  name,
  price,
  per,
  sub,
  features,
  highlight,
  selected,
  onSelect,
}) {
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
          : "bg-white text-ink ring-1 " +
            (selected ? "ring-grape" : "ring-black/5")) +
        (selected ? " shadow-[0_22px_46px_-26px_rgba(58,49,66,.55)]" : "")
      }
      style={
        highlight
          ? { background: "linear-gradient(160deg,#6D4BE0,#5435C4)" }
          : undefined
      }
    >
      {highlight && (
        <span className="absolute -top-3 right-5 rounded-full bg-sunny text-ink text-[11px] sm:text-[12px] font-extrabold px-3 py-1 shadow">
          ★ BEST VALUE
        </span>
      )}

      {/* title row — check sits inline so it never overlaps the name */}
      <div className={"flex items-center gap-2.5 " + (highlight ? "mt-1" : "")}>
        <span className={checkClasses} aria-hidden="true">
          ✓
        </span>
        <span
          className={
            "font-display font-extrabold text-lg sm:text-xl " +
            (highlight ? "" : "text-ink")
          }
        >
          {name}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-1">
        <span className="font-display font-extrabold text-4xl sm:text-5xl leading-none">
          {price}
        </span>
        <span
          className={
            "mb-1 font-bold text-sm sm:text-base " +
            (highlight ? "text-white/80" : "text-inksoft")
          }
        >
          / {per}
        </span>
      </div>
      <p
        className={
          "mt-2 font-bold text-[13px] sm:text-[14px] " +
          (highlight ? "text-sunny" : "text-inksoft")
        }
      >
        {sub}
      </p>

      <ul className="mt-5 space-y-2.5 flex-1">
        {features.map((f, i) => (
          <li
            key={i}
            className={
              "flex gap-2.5 font-bold text-[14px] sm:text-[15px] " +
              (highlight ? "" : "text-ink")
            }
          >
            <Check color={highlight ? "#16BFA6" : "#6D4BE0"} />
            {f}
          </li>
        ))}
      </ul>
    </motion.button>
  );
}

export default function Paywall() {
  const { user, upgradePlan } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ctx = location.state || {}; // { kind, title, emoji, from }

  const [selected, setSelected] = useState("annual");
  const [notice, setNotice] = useState(null); // 'coming-soon' | 'error' | 'cancelled' | 'processing'
  const [working, setWorking] = useState(false);
  const [verifying, setVerifying] = useState(false); // confirmando pagamento no retorno
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

  // { value, currency } for a plan id, parsed from its display price.
  const priceOf = (id) => parsePrice(plans[id]?.price);

  // Fire ViewContent once when the paywall is actually shown (not on redirect).
  useEffect(() => {
    if (isPremiumPlan(user?.plan)) return;
    trackViewPaywall({ kind: ctx.kind, title: ctx.title });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Select a plan + report the choice (with value/currency) to the pixel.
  const selectPlan = (id) => {
    setSelected(id);
    const { value, currency } = priceOf(id);
    trackSelectPlan({ plan: id, value, currency });
  };

  // Trata o retorno do checkout hospedado do Mercado Pago (o back_url do plano
  // aponta pra cá, ex.: https://<domínio>/app/paywall).
  //
  // ⚠️  O back_url NÃO prova pagamento — o MP manda o usuário de volta mesmo com
  // a assinatura `pending` (cartão em análise, Pix/boleto não pago, aba fechada).
  // Então NÃO liberamos o acesso nem disparamos a conversão só porque voltou.
  // Confirmamos o status REAL no servidor (fetchSubscriptionStatus → MP) e só
  // quando ele volta `authorized` é que liberamos Premium e disparamos o
  // Purchase — com eventID determinístico para deduplicar com o CAPI do backend.
  useEffect(() => {
    const ret = readCheckoutReturn(searchParams);
    if (!ret) return;

    // Cancelamento explícito na própria URL: não há o que confirmar.
    if (ret.outcome === "cancelled") {
      clearPendingCheckout();
      setNotice("cancelled");
      setSearchParams({}, { replace: true }); // evita re-disparo no refresh
      return;
    }

    // Recupera plano + retorno guardados antes do redirect (location.state some).
    const pending = readPendingCheckout();
    const planId = pending?.planId || selected;
    const returnTo = pending?.returnTo || ctx.from || "/app";

    // Confirma o pagamento e SÓ ENTÃO libera + dispara o Purchase.
    const confirmPaid = () => {
      const { value, currency } = priceOf(planId);
      upgradePlan("Premium", {
        plan: planId,
        cycle: plans[planId]?.per,
        provider: "mercadopago",
        preapprovalId: ret.preapprovalId,
      });
      trackSubscriptionPurchase({
        plan: planId,
        value,
        currency,
        id: ret.preapprovalId,
      });
      clearPendingCheckout();
      navigate(returnTo, { replace: true });
    };

    let cancelled = false;
    (async () => {
      setNotice(null);
      setVerifying(true);

      // O primeiro pagamento recorrente pode levar alguns segundos pra sair de
      // `pending` → `authorized`. Fazemos algumas tentativas antes de entregar
      // ao webhook. (Purchase usa eventID determinístico, então mesmo que o
      // webhook também dispare, o Meta deduplica.)
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
          // Sem VITE_API_BASE: não dá pra verificar. FALHA SEGURA — não libera e
          // não dispara Purchase. O webhook + re-sync do plano no próximo load
          // é a fonte da verdade.
          if (import.meta?.env?.DEV) {
            // eslint-disable-next-line no-console
            console.warn(
              "[paywall] VITE_API_BASE não configurado — sem verificar pagamento; mantendo bloqueado até o webhook confirmar.",
            );
          }
          break;
        }
        // 'pending' | 'error' | 'unknown' → espera e tenta de novo.
        if (i < MAX_TRIES - 1) {
          await new Promise((res) => setTimeout(res, DELAY_MS));
        }
      }

      if (!cancelled) {
        // Não confirmou dentro da janela → NÃO libera, NÃO dispara Purchase.
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

  // Already subscribed → no paywall; go back where they were.
  if (isPremiumPlan(user?.plan)) {
    return <Navigate to={ctx.from || "/app"} replace />;
  }

  const goBack = ctx.from && ctx.kind ? backFor(ctx.kind) : "/app";

  // Redirect to Mercado Pago's hosted checkout for the selected plan. Plans
  // without a preapproval_plan_id yet (e.g. annual) report "coming soon".
  const handleSubscribe = async () => {
    setNotice(null);
    if (!isCheckoutConfigured(selected)) {
      setNotice("coming-soon");
      return;
    }
    const { value, currency } = priceOf(selected);
    trackInitiateSubscription({ plan: selected, value, currency });
    setWorking(true);
    try {
      const res = await startSubscriptionCheckout({
        planId: selected,
        email: user?.email,
        returnTo: ctx.from,
      });
      // On success the browser is redirecting; only handle the no-redirect case.
      if (!res?.ok) setNotice("coming-soon");
    } catch {
      setNotice("error");
    } finally {
      setWorking(false);
    }
  };

  // Dev-only: flip to Premium so the unlock flow is testable before payments.
  const handleSimulate = () => {
    trackSimulatedSubscribe({ plan: selected });
    upgradePlan("Premium", { plan: selected, cycle: plans[selected].per });
    navigate(ctx.from || "/app", { replace: true });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Reveal>
        <Link
          to={goBack}
          className="inline-flex items-center gap-1.5 font-display font-extrabold text-inksoft hover:text-grape text-sm"
        >
          ← Maybe later
        </Link>
      </Reveal>

      {/* hero */}
      <Reveal delay={40}>
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-7 text-white"
          style={{ background: "linear-gradient(140deg,#6D4BE0,#5435C4)" }}
        >
          <div className="relative z-10 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-wide">
              ✨ Pedagogy Premium
            </span>
            <h1 className="mt-3 font-display font-extrabold text-2xl sm:text-3xl leading-tight">
              {ctx.title
                ? `Unlock ${ctx.title}`
                : "Unlock the whole world of stories"}
            </h1>
            <p className="mt-2 text-white/85 font-semibold text-[15px] sm:text-base leading-snug">
              {ctx.title
                ? "Plus every other story, the full learning path, and new content each month."
                : "50+ interactive stories, the full phonics path, and mini-games — all in one plan."}
            </p>
          </div>
          <div className="pointer-events-none absolute -right-2 -bottom-4 text-[4.5rem] sm:text-[6rem] opacity-90 select-none">
            {ctx.emoji || "🪄"}
          </div>
        </div>
      </Reveal>

      {/* plans */}
      <Stagger
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch max-w-sm sm:max-w-2xl mx-auto"
        stagger={0.1}
      >
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
        <div className="rounded-3xl bg-white p-5 sm:p-6 ring-1 ring-black/5 shadow-[0_18px_40px_-30px_rgba(58,49,66,.6)]">
          <motion.button
            type="button"
            onClick={handleSubscribe}
            disabled={working || verifying}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className={
              "btn3d b-grape w-full px-6 py-3.5 text-base sm:text-lg " +
              (working || verifying ? "opacity-70 pointer-events-none" : "")
            }
          >
            {verifying
              ? "Confirming your payment…"
              : working
                ? "Connecting…"
                : `Subscribe — ${plans[selected].price} / ${plans[selected].per}`}
          </motion.button>

          {verifying && (
            <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-black/5">
              ⏳ Confirming your payment with Mercado Pago… this only takes a
              moment.
            </p>
          )}
          {notice === "processing" && (
            <p className="mt-3 rounded-2xl bg-butter px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-sunnyd/20">
              We got your checkout, but the payment is still being processed by
              Mercado Pago. As soon as it’s approved your access unlocks
              automatically — you can close this page. Pix or boleto can take a
              few minutes to confirm.
            </p>
          )}
          {notice === "coming-soon" && (
            <p className="mt-3 rounded-2xl bg-butter px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-sunnyd/20">
              💳 This plan isn’t available for checkout just yet. Try the other
              plan, or check back soon!
            </p>
          )}
          {notice === "cancelled" && (
            <p className="mt-3 rounded-2xl bg-butter px-4 py-3 text-[14px] font-bold text-ink ring-1 ring-sunnyd/20">
              No worries — checkout was cancelled and you weren’t charged. You
              can subscribe whenever you’re ready.
            </p>
          )}
          {notice === "error" && (
            <p className="mt-3 rounded-2xl bg-blush px-4 py-3 text-[14px] font-bold text-bubbled ring-1 ring-bubblegum/20">
              Something went wrong reaching checkout. Please try again.
            </p>
          )}

          <p className="mt-4 text-center text-[13px] font-bold text-inksoft">
            Cancel anytime · Family-friendly billing · No ads, ever
          </p>
        </div>
      </Reveal>
    </div>
  );
}
