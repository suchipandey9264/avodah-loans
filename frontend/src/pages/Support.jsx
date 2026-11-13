import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CONTACT, FAQS } from "../lib/content";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Accordion } from "../components/Faq";
import { CallbackForm } from "../components/Cta";
import { Icon } from "../components/ui";

const EXTRA = [
  { q: "How do I track my loan application?", a: "Log in with your mobile number. Every application you start through AvodahLoans appears with its live status — submitted, under review, sanctioned or disbursed.", cat: "account" },
  { q: "I didn’t receive my OTP. What should I do?", a: "Wait 30 seconds and tap ‘Resend OTP’. Check that the number is correct and that DND/SMS blocking is off. Still stuck? Request a callback below.", cat: "account" },
  { q: "How is my EMI calculated?", a: "EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ − 1), where P is the loan amount, r is the monthly interest rate and n is the number of months. Use our EMI calculator to try different values.", cat: "emi" },
  { q: "Can I change my EMI date?", a: "Most lenders let you choose or change the EMI date once during the loan. Contact your lender or our advisor, who can raise the request for you.", cat: "emi" },
];

const CAT_OF = { 0: "eligibility", 1: "eligibility", 2: "eligibility", 3: "documents", 4: "about", 5: "about", 6: "eligibility", 7: "emi" };
const ALL = [...FAQS.map((f, i) => ({ ...f, cat: CAT_OF[i] })), ...EXTRA];

const CATS = [
  { id: "all", label: "All topics", icon: "Sparkles" },
  { id: "eligibility", label: "Eligibility", icon: "BadgeCheck" },
  { id: "documents", label: "Documents", icon: "FileUp" },
  { id: "emi", label: "EMI & repayment", icon: "Calculator" },
  { id: "account", label: "Account & login", icon: "User" },
  { id: "about", label: "About us", icon: "Info" },
];

export default function Support() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const root = useRef(null);

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ALL.filter((f) => (cat === "all" || f.cat === cat) && (!s || (f.q + f.a).toLowerCase().includes(s)));
  }, [q, cat]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".sp-anim", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "expo.out" });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      <section className="relative overflow-hidden bg-brand-900 pt-16 pb-28 text-white">
        <div className="grain-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -top-24 right-0 size-96 rounded-full bg-brand-500/40 blur-[100px]" />
        <div className="container-x relative text-center">
          <p className="sp-anim eyebrow border-white/15 bg-white/5 text-flame-400"><Icon name="Headphones" size={14} /> Support & Help</p>
          <h1 className="sp-anim mx-auto mt-5 max-w-2xl text-5xl leading-[1.05] font-extrabold sm:text-6xl">How can we help you today?</h1>
          <div className="sp-anim relative mx-auto mt-10 max-w-2xl">
            <Icon name="Search" size={22} className="absolute top-1/2 left-5 -translate-y-1/2 text-muted" />
            <label htmlFor="help-search" className="sr-only">Search help articles</label>
            <input
              id="help-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search e.g. ‘documents’, ‘CIBIL’, ‘prepay’"
              className="min-h-16 w-full rounded-2xl bg-white pr-5 pl-14 text-lg text-ink shadow-2xl outline-none focus:ring-4 focus:ring-flame-400/50"
            />
          </div>
        </div>
      </section>

      <section className="container-x relative -mt-14">
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            { icon: "PhoneCall", t: "Call an advisor", d: "Mon–Sat, 9am–7pm", href: `tel:${CONTACT.phone.replace(/\s/g, "")}`, cta: CONTACT.phone },
            { icon: "Mail", t: "Email us", d: "We reply within one working day", href: `mailto:${CONTACT.email}`, cta: CONTACT.email },
            { icon: "Calculator", t: "Self-serve tools", d: "EMI and credit score calculators", to: "/emi-calculator", cta: "Open calculators" },
          ].map((c) => {
            const inner = (
              <>
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white"><Icon name={c.icon} size={22} /></span>
                <span className="mt-5 block font-display text-xl font-bold">{c.t}</span>
                <span className="text-sm text-muted">{c.d}</span>
                <span className="mt-4 flex items-center gap-1.5 font-semibold break-all text-brand-700">{c.cta} <Icon name="ArrowRight" size={16} className="shrink-0 transition-transform group-hover:translate-x-1" /></span>
              </>
            );
            const cls = "sp-anim group flex h-full flex-col rounded-3xl border border-line bg-white p-6 shadow-[0_20px_40px_-30px_rgb(36_16_82/0.5)] transition-transform hover:-translate-y-1";
            return <li key={c.t}>{c.to ? <Link to={c.to} className={cls}>{inner}</Link> : <a href={c.href} className={cls}>{inner}</a>}</li>;
          })}
        </ul>
      </section>

      <section className="py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[260px_1fr]">
          <nav aria-label="Help topics" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="no-scrollbar flex gap-2 overflow-x-auto lg:grid lg:gap-1">
              {CATS.map((c) => (
                <li key={c.id} className="shrink-0">
                  <button aria-pressed={cat === c.id} onClick={() => setCat(c.id)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-medium transition-colors ${cat === c.id ? "bg-brand-700 text-white" : "hover:bg-brand-50"}`}>
                    <Icon name={c.icon} size={18} /> {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="text-3xl font-bold" aria-live="polite">
              {items.length ? `${items.length} answer${items.length > 1 ? "s" : ""}` : "No matching answers"}
              {q && <span className="font-normal text-muted"> for “{q}”</span>}
            </h2>
            {items.length ? (
              <div className="mt-6"><Accordion key={cat + q} items={items} idPrefix="help" /></div>
            ) : (
              <p className="mt-4 text-muted">Try another word, or ask our team directly below.</p>
            )}
          </div>
        </div>
      </section>

      <section className="px-3 pb-24 sm:px-5">
        <div className="mx-auto max-w-7xl rounded-[28px] bg-brand-800 p-8 text-white sm:p-12" data-reveal>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Still need help?</h2>
              <p className="mt-2 text-brand-200">Leave your number and a loan advisor will call you back — free.</p>
            </div>
            <CallbackForm />
          </div>
        </div>
      </section>
    </div>
  );
}
