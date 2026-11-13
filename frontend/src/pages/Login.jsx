import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { updateProfile } from "../lib/activity";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon, Logo } from "../components/ui";

const PERKS = [
  ["BadgeCheck", "Pre-approved offers saved to one place"],
  ["Clock", "Live status on every application"],
  ["ShieldCheck", "Bank-grade security · no spam calls"],
];

const METHODS = [
  { id: "phone", label: "Mobile number", icon: "Smartphone" },
  { id: "email", label: "Email address", icon: "Mail" },
];

const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function OtpInput({ value, onChange, invalid }) {
  const refs = useRef([]);
  const set = (i, ch) => {
    const arr = value.padEnd(6, " ").split("");
    arr[i] = ch || " ";
    onChange(arr.join("").trimEnd());
  };
  return (
    <div className="flex justify-between gap-2" role="group" aria-label="6-digit code">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid}
          value={value[i]?.trim() ?? ""}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            set(i, d);
            if (d && i < 5) refs.current[i + 1].focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i]?.trim() && i > 0) refs.current[i - 1].focus();
          }}
          onPaste={(e) => {
            const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (d) { e.preventDefault(); onChange(d); refs.current[Math.min(d.length, 5)].focus(); }
          }}
          className={`otp-box size-12 rounded-xl border-2 bg-white text-center font-display text-2xl font-bold caret-flame-500 outline-none transition-colors focus:border-brand-600 focus:ring-4 focus:ring-brand-100 sm:size-14 ${invalid ? "border-red-600" : value[i]?.trim() ? "border-brand-300" : "border-line"}`}
        />
      ))}
    </div>
  );
}

/** Labelled input row with a leading icon or prefix. */
function Field({ id, label, hint, error, lead, children }) {
  return (
    <div>
      <label htmlFor={id} className="block font-medium">{label}</label>
      <div className={`mt-2 flex items-center rounded-2xl border-2 bg-white px-4 transition-colors focus-within:ring-4 ${error ? "border-red-600 focus-within:ring-red-100" : "border-line focus-within:border-brand-600 focus-within:ring-brand-100"}`}>
        {lead}
        {children}
      </div>
      <p id={`${id}-msg`} role={error ? "alert" : undefined} className={`mt-1.5 min-h-5 text-sm ${error ? "text-red-700" : "text-muted"}`}>{error || hint}</p>
    </div>
  );
}

const Spinner = () => <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />;

export default function Login() {
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const navigate = useNavigate();
  const { login } = useAuth();
  const root = useRef(null);

  const [step, setStep] = useState("details");
  const [method, setMethod] = useState("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [timer, setTimer] = useState(0);
  const [mode, setMode] = useState("api"); // "local" when the backend can't be reached
  const [devOtp, setDevOtp] = useState("");

  const contact = method === "phone" ? { phone } : { email: email.trim().toLowerCase() };
  const shown = method === "phone" ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : email.trim();

  useEffect(() => {
    if (!timer) return;
    const t = setTimeout(() => setTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".login-anim", { y: 18, autoAlpha: 0, filter: "blur(6px)", duration: 0.7, stagger: 0.05, ease: "expo.out", clearProps: "filter" });
        if (step === "details") {
          gsap.from(".perk", { x: -24, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: "expo.out", delay: 0.15 });
          gsap.from(".track-step", { scaleX: 0, transformOrigin: "left", duration: 0.9, stagger: 0.18, ease: "expo.out", delay: 0.5 });
        }
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [step], revertOnUpdate: true }
  );

  const validate = () => {
    const e = {};
    if (!NAME_RE.test(name.trim())) e.name = "Enter your full name as on your PAN card.";
    if (method === "phone" && !PHONE_RE.test(phone)) e.contact = "Enter a valid 10-digit Indian mobile number.";
    if (method === "email" && !EMAIL_RE.test(email.trim())) e.contact = "Enter a valid email address, like name@example.com.";
    return e;
  };

  const sendOtp = async (ev) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (e.name) return document.getElementById("l-name")?.focus();
    if (e.contact) return document.getElementById("l-contact")?.focus();
    setBusy(true);
    try {
      const res = await api.sendOtp(contact);
      setMode("api");
      setDevOtp(res.devOtp ?? "");
    } catch (err) {
      if (err.status && err.status < 500) {
        setBusy(false);
        return setErrors({ contact: err.message });
      }
      setMode("local"); // backend offline → demo login on this device
      setDevOtp("");
    }
    setBusy(false);
    setOtp("");
    setStep("otp");
    setTimer(30);
  };

  const verify = async (ev) => {
    ev.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setErrors({ otp: "Enter all 6 digits of the code." });
      gsap.fromTo(".otp-box", { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1,0.3)" });
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const u = mode === "api"
        ? await api.verifyOtp(contact, otp, name.trim())
        : { id: contact.phone ?? contact.email, name: name.trim(), ...contact };
      login(u);
      if (method === "phone") updateProfile({ whatsapp });
      navigate(next, { replace: true });
    } catch (err) {
      setBusy(false);
      setErrors({ otp: err.message || "Could not verify the code. Try again." });
    }
  };

  const switchMethod = (id) => {
    setMethod(id);
    setErrors((e) => ({ ...e, contact: "" }));
  };

  return (
    <div ref={root} className="grid min-h-[calc(100dvh-72px)] lg:grid-cols-[1fr_1.1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="grain-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-flame-500/25 blur-[110px]" />
        <div className="pointer-events-none absolute -top-24 right-0 size-72 rounded-full bg-brand-500/30 blur-[90px]" />
        <Logo tone="light" className="relative h-10" />

        <div className="relative">
          <h2 className="max-w-md text-5xl leading-[1.04] font-extrabold xl:text-6xl">
            One account. Every offer you’ve <span className="text-flame-400">found.</span>
          </h2>
          <ul className="mt-10 grid gap-4">
            {PERKS.map(([icon, text]) => (
              <li key={text} className="perk flex items-center gap-4 text-lg text-brand-100">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-flame-400 ring-1 ring-white/10"><Icon name={icon} size={22} /></span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Illustrative application tracker */}
        <div className="relative max-w-sm rounded-3xl bg-white p-5 text-ink shadow-[0_30px_60px_-20px_rgb(0_0_0/0.5)]" aria-hidden="true">
          <div className="flex items-center gap-3">
            <img src="/bank-logos/sbi.png" alt="" className="h-9 w-14 object-contain" />
            <div className="flex-1 leading-tight">
              <p className="font-semibold">Home Loan · ₹35 L</p>
              <p className="text-xs text-muted">State Bank of India · 7.50% p.a.</p>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-success ring-1 ring-green-200">Sanctioned</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {["Applied", "Documents", "Sanction", "Disbursal"].map((s, i) => (
              <div key={s}>
                <span className={`track-step block h-1.5 rounded-full ${i < 3 ? "bg-success" : "bg-flame-400"}`} />
                <span className="mt-1.5 block text-[11px] text-muted">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-gradient-to-b from-brand-50 to-paper px-4 py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgb(36_16_82/0.45)] sm:p-9">
            {step === "details" ? (
              <form onSubmit={sendOtp} noValidate>
                <h1 className="login-anim text-3xl font-bold sm:text-4xl">Log in or sign up</h1>
                <p className="login-anim mt-2 text-muted">New to AvodahLoans? Your account is created in the same step.</p>

                <div role="radiogroup" aria-label="Sign in with" className="login-anim relative mt-7 grid grid-cols-2 rounded-2xl bg-brand-50 p-1 ring-1 ring-brand-100">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-[0_4px_14px_-6px_rgb(36_16_82/0.35)] transition-transform duration-300 ease-out-expo"
                    style={{ transform: method === "email" ? "translateX(100%)" : "none" }}
                  />
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      role="radio"
                      aria-checked={method === m.id}
                      onClick={() => switchMethod(m.id)}
                      className={`relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${method === m.id ? "text-brand-800" : "text-muted hover:text-ink"}`}
                    >
                      <Icon name={m.icon} size={16} /> {m.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 grid gap-1">
                  <div className="login-anim">
                    <Field id="l-name" label="Full name" hint="As on your PAN card — lenders match this." error={errors.name} lead={<Icon name="UserRound" size={18} className="shrink-0 text-muted" />}>
                      <input
                        id="l-name"
                        autoComplete="name"
                        placeholder="Rahul Kumar"
                        value={name}
                        onChange={(e) => { setErrors((x) => ({ ...x, name: "" })); setName(e.target.value.replace(/[^A-Za-z .'-]/g, "").slice(0, 80)); }}
                        aria-invalid={!!errors.name}
                        aria-describedby="l-name-msg"
                        className="min-h-13 w-full bg-transparent px-3 text-lg font-medium outline-none placeholder:font-normal placeholder:text-muted/70"
                      />
                    </Field>
                  </div>

                  <div className="login-anim">
                    {method === "phone" ? (
                      <Field id="l-contact" label="Mobile number" hint="We’ll send a 6-digit OTP by SMS." error={errors.contact} lead={<span className="shrink-0 border-r border-line pr-3 font-semibold text-muted">+91</span>}>
                        <input
                          key="phone"
                          id="l-contact"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => { setErrors((x) => ({ ...x, contact: "" })); setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); }}
                          aria-invalid={!!errors.contact}
                          aria-describedby="l-contact-msg"
                          className="min-h-13 w-full bg-transparent px-3 font-display text-xl font-bold tracking-wider tabular-nums outline-none placeholder:font-sans placeholder:text-lg placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/70"
                        />
                      </Field>
                    ) : (
                      <Field id="l-contact" label="Email address" hint="We’ll email you a 6-digit code." error={errors.contact} lead={<Icon name="AtSign" size={18} className="shrink-0 text-muted" />}>
                        <input
                          key="email"
                          id="l-contact"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => { setErrors((x) => ({ ...x, contact: "" })); setEmail(e.target.value.replace(/\s/g, "").slice(0, 120)); }}
                          aria-invalid={!!errors.contact}
                          aria-describedby="l-contact-msg"
                          className="min-h-13 w-full bg-transparent px-3 text-lg font-medium outline-none placeholder:font-normal placeholder:text-muted/70"
                        />
                      </Field>
                    )}
                  </div>
                </div>

                {method === "phone" && (
                  <label className="login-anim mt-1 flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                    <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="size-5 shrink-0 rounded accent-brand-700" />
                    <span>Send loan updates on <strong className="font-semibold">WhatsApp</strong></span>
                  </label>
                )}

                <button type="submit" disabled={busy} className="login-anim btn-primary mt-6 min-h-14 w-full text-base">
                  {busy ? <Spinner /> : <>Send OTP <Icon name="ArrowRight" size={18} /></>}
                </button>
                <p className="login-anim mt-5 text-center text-xs leading-relaxed text-muted">
                  By continuing you agree to our Terms and Privacy Policy and consent to be contacted about your loan.
                </p>
              </form>
            ) : (
              <form onSubmit={verify} noValidate>
                <button type="button" onClick={() => { setStep("details"); setErrors({}); }} className="login-anim -ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-medium text-muted hover:text-ink">
                  <Icon name="ArrowLeft" size={18} /> Edit details
                </button>
                <span className="login-anim mt-3 grid size-14 place-items-center rounded-2xl bg-brand-700 text-white"><Icon name="KeyRound" size={26} /></span>
                <h1 className="login-anim mt-5 text-3xl font-bold sm:text-4xl">Verify your {method === "phone" ? "mobile" : "email"}</h1>
                <p className="login-anim mt-2 text-muted">
                  Hi {name.trim().split(" ")[0]}, enter the 6-digit code sent to <strong className="text-ink [overflow-wrap:anywhere]">{shown}</strong>
                </p>

                <div className="login-anim mt-7"><OtpInput value={otp} onChange={(v) => { setOtp(v); setErrors({}); }} invalid={!!errors.otp} /></div>
                <p role="alert" className="mt-2 min-h-5 text-sm text-red-700">{errors.otp}</p>

                {mode === "api" && devOtp ? (
                  <div className="login-anim flex items-center justify-between gap-3 rounded-xl bg-flame-50 px-3 py-2 text-sm text-flame-600 ring-1 ring-flame-100">
                    <span>Demo mode — your code is <strong className="font-bold tracking-widest tabular-nums">{devOtp}</strong></span>
                    <button type="button" onClick={() => setOtp(devOtp)} className="min-h-9 shrink-0 rounded-lg bg-white px-3 font-semibold text-flame-600 ring-1 ring-flame-100 hover:bg-flame-100">Fill it</button>
                  </div>
                ) : mode === "local" ? (
                  <p className="login-anim rounded-xl bg-flame-50 px-3 py-2 text-sm text-flame-600 ring-1 ring-flame-100">Demo mode (server offline) — enter any 6 digits.</p>
                ) : null}

                <button type="submit" disabled={busy} className="login-anim btn-primary mt-5 min-h-14 w-full text-base">
                  {busy ? <Spinner /> : "Verify & continue"}
                </button>
                <p className="login-anim mt-5 text-center text-sm text-muted">
                  {timer ? `Resend code in 0:${String(timer).padStart(2, "0")}` : (
                    <button type="button" onClick={() => sendOtp()} className="min-h-10 font-semibold text-brand-700">Resend code</button>
                  )}
                </p>
              </form>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-muted">
            Just browsing? <Link to="/search" className="font-semibold text-brand-700 underline-offset-4 hover:underline">Search loans without logging in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
