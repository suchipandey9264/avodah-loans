import { useRef, useState } from "react";
import { CONTACT, TESTIMONIALS } from "../lib/content";
import { Link } from "react-router-dom";
import { logCallback } from "../lib/activity";
import { api } from "../lib/api";
import { callbackSchema, check } from "../lib/schemas";
import { Captcha } from "./Captcha";
import { Icon } from "./ui";

/** `stacked` puts name + mobile side by side with a full-width button below (for narrow cards). */
export function CallbackForm({ stacked = false }) {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const captcha = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const { data, errors: errs } = check(callbackSchema, Object.fromEntries(new FormData(form)));
    setErrors(errs);
    if (!data) return form.elements[Object.keys(errs)[0]]?.focus();
    setBusy(true);
    try {
      const captchaToken = await captcha.current?.getToken();
      await api.requestCallback({ ...data, captchaToken });
      logCallback({ name: data.name });
      setSent(true);
    } catch (err) {
      setErrors(err.fields && Object.keys(err.fields).length ? err.fields : { _: err.message || "Couldn’t send your request — please try again." });
    } finally {
      setBusy(false);
    }
  };
  const message = errors.name || errors.phone || errors._;
  const span = stacked ? "sm:col-span-2" : "sm:col-span-3";

  if (sent)
    return (
      <div role="status" className="flex items-center gap-3 rounded-2xl bg-white/10 p-5">
        <span className="grid size-10 place-items-center rounded-full bg-flame-400 text-ink"><Icon name="Check" size={20} strokeWidth={2.5} /></span>
        <p>Thanks! A loan advisor will call you shortly.</p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className={`grid gap-3 ${stacked ? "sm:grid-cols-2" : "sm:grid-cols-[1fr_1fr_auto]"}`}>
      <label className="grid gap-1 text-sm">
        <span className="text-brand-100">Your name</span>
        <input name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby="cb-err" className="field border-white/20 bg-white/10 text-white placeholder:text-brand-300 focus:border-flame-400 focus:ring-flame-400/30" placeholder="Priya Shah" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-brand-100">Mobile number</span>
        <input name="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby="cb-err" className="field border-white/20 bg-white/10 text-white placeholder:text-brand-300 focus:border-flame-400 focus:ring-flame-400/30" placeholder="98765 43210" />
      </label>
      <button type="submit" disabled={busy} className={`btn-accent disabled:opacity-60 ${stacked ? `mt-1 w-full ${span}` : "self-end"}`}>
        {busy ? "Sending…" : <>Call me back <Icon name="PhoneCall" size={16} /></>}
      </button>
      <p id="cb-err" role="alert" className={`text-sm text-flame-400 empty:hidden ${span}`}>{message}</p>
      <Captcha ref={captcha} theme="dark" className={`empty:hidden ${span}`} />
    </form>
  );
}

const PERKS = ["100% free advice", "No impact on credit score", "50+ banks & NBFCs"];

export default function Cta() {
  return (
    <section id="contact" className="px-3 pb-10 sm:px-5 sm:pb-14">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-6 py-12 text-white sm:px-10 sm:py-14 lg:px-14">
        {/* Decoration: grid texture, warm glow, concentric rings */}
        <div className="grain-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="pointer-events-none absolute -right-20 -bottom-40 size-[28rem] rounded-full bg-flame-500/25 blur-[110px]" />
        <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-brand-500/25 blur-[90px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -right-40 hidden size-[30rem] rounded-full border border-white/5 lg:block">
          <div className="absolute inset-12 rounded-full border border-white/5" />
          <div className="absolute inset-24 rounded-full border border-white/5" />
        </div>

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-flame-400">
              <span className="size-1.5 rounded-full bg-flame-400" /> Apply in under 2 minutes
            </p>
            <h2 className="mt-5 text-4xl leading-[1.05] font-extrabold sm:text-5xl">
              Ready to get the <span className="bg-gradient-to-r from-flame-400 to-sun-400 bg-clip-text text-transparent">best loan deal?</span>
            </h2>
            <p className="mt-4 max-w-lg text-lg text-brand-100">
              Compare offers, check eligibility and apply — all in one place, without visiting a branch.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {PERKS.map((p) => (
                <li key={p} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm ring-1 ring-white/10">
                  <Icon name="CircleCheck" size={15} className="text-flame-400" /> {p}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/search" className="btn-accent">
                Search Loan <Icon name="ArrowRight" size={16} />
              </Link>
              <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="btn-ghost border-white/30 text-white hover:bg-white/10">
                <Icon name="Phone" size={16} /> {CONTACT.phone}
              </a>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2" aria-hidden="true">
                {TESTIMONIALS.map((t, i) => (
                  <span key={t.name} className={`grid size-9 place-items-center rounded-full font-display text-xs font-bold ring-2 ring-brand-900 ${i === 1 ? "bg-flame-400 text-ink" : "bg-brand-100 text-brand-700"}`}>
                    {t.initials}
                  </span>
                ))}
              </div>
              <div className="leading-tight">
                <div className="flex gap-0.5 text-flame-400" role="img" aria-label="Rated 5 out of 5">
                  {Array.from({ length: 5 }).map((_, k) => <Icon key={k} name="Star" size={13} fill="currentColor" />)}
                </div>
                <p className="mt-1 text-sm text-brand-200">Trusted by 2.4 lakh+ customers</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-6 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] backdrop-blur-md sm:p-7">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-flame-500 to-sun-400 text-ink shadow-lg shadow-flame-500/30">
                <Icon name="Headphones" size={22} />
              </span>
              <div>
                <p className="font-display text-xl font-bold">Prefer a callback?</p>
                <p className="mt-1 text-sm text-brand-200">Leave your number — a loan advisor will reach out.</p>
              </div>
            </div>
            <div className="mt-6">
              <CallbackForm stacked />
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-brand-300">
              <Icon name="Lock" size={12} /> Your details are safe with us. No spam, ever.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
