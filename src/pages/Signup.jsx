import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AuthShell from "../components/auth/AuthShell.jsx";
import { Field, SocialButtons } from "../components/app/Field.jsx";
import AvatarPicker from "../components/app/AvatarPicker.jsx";
import Avatar from "../components/app/Avatar.jsx";
import { LEVELS } from "../data.app.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { spring, EASE } from "../motion.js";
import { trackLead, trackCompleteRegistration } from "../lib/pixel.js";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [account, setAccount] = useState({ name: "", email: "", password: "" });
  const [reader, setReader] = useState({
    name: "",
    age: 5,
    emoji: "🐻",
    color: "grape",
    level: "explorer",
  });
  const [err, setErr] = useState("");

  const next = (e) => {
    e.preventDefault();
    if (
      !account.name.trim() ||
      !account.email.trim() ||
      account.password.length < 4
    ) {
      setErr("Add your name, a valid email, and a password (4+ characters).");
      return;
    }
    setErr("");
    trackLead({ content_name: "signup", step: "account" });
    setStep(1);
  };

  const finish = (e) => {
    e.preventDefault();
    if (!reader.name.trim()) {
      setErr("What's your reader's name?");
      return;
    }
    signup({
      name: account.name.trim(),
      email: account.email.trim().toLowerCase(),
      firstReader: reader,
    });
    trackCompleteRegistration({ method: "email" });
    navigate("/app", { replace: true });
  };

  return (
    <AuthShell
      title={step === 0 ? "Create your account" : "Add your first reader"}
      subtitle={
        step === 0
          ? "Free to start. One account for the whole family."
          : "This is the profile your child will see. You can add more later."
      }
      footer={
        step === 0 ? (
          <>
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-grape font-extrabold hover:underline"
            >
              Log in
            </Link>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setErr("");
              setStep(0);
            }}
            className="text-grape font-extrabold hover:underline"
          >
            ← Back to account details
          </button>
        )
      }
    >
      {/* step dots */}
      <div className="flex items-center gap-2 mb-6">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: i === step ? 28 : 10,
              background: i <= step ? "#6D4BE0" : "#E7E0FF",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 ? (
          <motion.form
            key="step-account"
            onSubmit={next}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="space-y-4"
            noValidate
          >
            <Field
              label="Your name"
              placeholder="Alex Parent"
              autoComplete="name"
              value={account.name}
              onChange={(e) => setAccount({ ...account, name: e.target.value })}
            />
            <Field
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={account.email}
              onChange={(e) =>
                setAccount({ ...account, email: e.target.value })
              }
            />
            <Field
              label="Password"
              type="password"
              placeholder="At least 4 characters"
              autoComplete="new-password"
              value={account.password}
              onChange={(e) =>
                setAccount({ ...account, password: e.target.value })
              }
            />

            {err && <p className="text-sm font-bold text-bubbled">{err}</p>}

            <motion.button
              type="submit"
              className="btn3d b-pink w-full px-6 py-3.5 text-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.press}
            >
              Continue
            </motion.button>

            {/* <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-black/10" />
              <span className="text-xs font-bold uppercase tracking-wide text-inksoft">or</span>
              <span className="h-px flex-1 bg-black/10" />
            </div>

            <SocialButtons
              onClick={() => {
                signup({ name: 'Demo Parent', email: 'demo@pedagogy.app', firstReader: reader })
                trackCompleteRegistration({ method: 'social' })
                navigate('/app', { replace: true })
              }}
            /> */}
          </motion.form>
        ) : (
          <motion.form
            key="step-reader"
            onSubmit={finish}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="space-y-5"
            noValidate
          >
            <div className="flex items-center gap-4 rounded-2xl bg-cream/60 p-4 ring-1 ring-black/5">
              <Avatar
                emoji={reader.emoji}
                color={reader.color}
                size={64}
                selected
              />
              <div className="min-w-0">
                <p className="font-display font-extrabold text-lg text-ink truncate">
                  {reader.name.trim() || "Your reader"}
                </p>
                <p className="text-sm font-bold text-inksoft">
                  {reader.age} years old
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Name"
                placeholder="Mia"
                value={reader.name}
                onChange={(e) => setReader({ ...reader, name: e.target.value })}
              />
              <Field label="Age">
                <select
                  className="w-full rounded-2xl border-2 border-black/5 bg-cream/40 px-4 py-3 font-bold text-ink focus:outline-none focus:border-grape focus:bg-white"
                  value={reader.age}
                  onChange={(e) =>
                    setReader({ ...reader, age: Number(e.target.value) })
                  }
                >
                  {Array.from({ length: 9 }, (_, i) => i + 2).map((a) => (
                    <option key={a} value={a}>
                      {a} years
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Reading level">
              <select
                className="w-full rounded-2xl border-2 border-black/5 bg-cream/40 px-4 py-3 font-bold text-ink focus:outline-none focus:border-grape focus:bg-white"
                value={reader.level}
                onChange={(e) =>
                  setReader({ ...reader, level: e.target.value })
                }
              >
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.emoji} {l.label} — {l.sub}
                  </option>
                ))}
              </select>
            </Field>

            <AvatarPicker
              emoji={reader.emoji}
              color={reader.color}
              onEmoji={(emoji) => setReader({ ...reader, emoji })}
              onColor={(color) => setReader({ ...reader, color })}
            />

            {err && <p className="text-sm font-bold text-bubbled">{err}</p>}

            <motion.button
              type="submit"
              className="btn3d b-grape w-full px-6 py-3.5 text-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.press}
            >
              Start reading 🚀
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
