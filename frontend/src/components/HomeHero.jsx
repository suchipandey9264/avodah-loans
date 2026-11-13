import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LOAN_TYPES } from "../lib/loans";
import { formatShort } from "../lib/emi";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon, SplitWords } from "./ui";

const HERO_IMG =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1100&q=80";

const TRUST = [
  { icon: "Zap", title: "Quick & 100%", sub: "digital" },
  { icon: "BadgeCheck", title: "Best rates", sub: "& offers" },
  { icon: "ShieldCheck", title: "Secure &", sub: "encrypted" },
];

function SearchWidget() {
  const navigate = useNavigate();
  const [typeId, setTypeId] = useState("home");
  const type = LOAN_TYPES.find((t) => t.id === typeId);
  const [amount, setAmount] = useState(type.defaultAmount);
  const [tenure, setTenure] = useState(type.defaultTenure);
  const [income, setIncome] = useState("");
  const fields = useRef(null);

  const pick = (t) => {
    setTypeId(t.id);
    setAmount(t.defaultAmount);
    setTenure(t.defaultTenure);
    gsap.fromTo(fields.current.children, { y: 12, autoAlpha: 0.3 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.05, ease: "power3.out" });
  };

  const submit = (e) => {
    e.preventDefault();
    const monthly = Number(income.replace(/\D/g, ""));
    const q = new URLSearchParams({ type: typeId, amount, tenure });
    if (monthly) q.set("income", monthly * 12);
    navigate(`/search?${q}`);
  };

  const incomeView = income ? "₹ " + new Intl.NumberFormat("en-IN").format(Number(income.replace(/\D/g, ""))) : "";

  return (
    <form onSubmit={submit} className="hero-search relative rounded-[28px] border border-white bg-white/90 p-3 shadow-[0_40px_80px_-40px_rgb(36_16_82/0.45)] backdrop-blur-xl sm:p-4">
      <div role="tablist" aria-label="Loan type" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {LOAN_TYPES.map((t) => {
          const active = t.id === typeId;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pick(t)}
              className={`flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-colors ${
                active ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30" : "text-ink hover:bg-brand-50"
              }`}
            >
              <Icon name={t.icon} size={18} className={active ? "text-flame-400" : "text-brand-600"} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div ref={fields} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="grid gap-1 rounded-2xl border border-line bg-white px-4 pt-2.5 pb-1 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <span className="text-xs font-medium text-muted">Loan amount</span>
          <select value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="min-h-9 bg-transparent text-base font-semibold outline-none">
            {type.amounts.map((a) => <option key={a} value={a}>{formatShort(a)}</option>)}
          </select>
        </label>
        <label className="grid gap-1 rounded-2xl border border-line bg-white px-4 pt-2.5 pb-1 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <span className="text-xs font-medium text-muted">Tenure</span>
          <select value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="min-h-9 bg-transparent text-base font-semibold outline-none">
            {type.tenures.map((y) => <option key={y} value={y}>{y} {y > 1 ? "years" : "year"}</option>)}
          </select>
        </label>
        <label className="grid gap-1 rounded-2xl border border-line bg-white px-4 pt-2.5 pb-1 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <span className="text-xs font-medium text-muted">Monthly income</span>
          <input
            inputMode="numeric"
            placeholder="₹ 1,50,000"
            value={incomeView}
            onChange={(e) => setIncome(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="min-h-9 bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-muted/70"
          />
        </label>
        <button type="submit" className="btn-primary min-h-16 rounded-2xl px-8 text-base">
          <Icon name="Search" size={18} /> Search Loan
        </button>
      </div>
    </form>
  );
}

export default function HomeHero() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.from(".hero-title .word-mask > span", { yPercent: 110, duration: 1.1, stagger: 0.05 })
          .from(".hero-sub, .hero-trust > li", { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.07 }, "-=0.8")
          .from(".hero-blob", { scale: 0.85, autoAlpha: 0, duration: 1.4 }, 0.1)
          .from(".hero-photo", { scale: 1.25, duration: 1.8 }, 0.1)
          .from(".hero-float", { y: 30, autoAlpha: 0, scale: 0.9, duration: 0.9, stagger: 0.12, ease: "back.out(1.6)" }, "-=1.2")
          .from(".hero-search", { y: 40, autoAlpha: 0, duration: 1 }, "-=1");

        gsap.to(".hero-float-inner", { y: -8, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.6 });

        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to(".hero-photo", { yPercent: 12, ease: "none", scrollTrigger: st });
        gsap.to(".hero-float-a", { y: -90, ease: "none", scrollTrigger: st });
        gsap.to(".hero-float-b", { y: -40, ease: "none", scrollTrigger: st });
        gsap.to(".hero-orb", { yPercent: 40, ease: "none", scrollTrigger: st });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-[#f3eefd] to-paper pt-10 pb-16 sm:pt-14">
      <div className="hero-orb pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-brand-200/60 blur-[120px]" />
      <div className="hero-orb pointer-events-none absolute top-20 right-[-10%] size-[460px] rounded-full bg-flame-100 blur-[120px]" />

      <div className="container-x relative">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative z-10 order-1">
            <h1 className="hero-title text-[2.6rem] leading-[1.02] font-extrabold sm:text-6xl xl:text-[4.25rem]">
              <SplitWords text="Search & get the" />
              <br />
              <SplitWords text="Best Loan" wordClassName="text-brand-700" />
              <SplitWords text="in India" />
            </h1>
            <p className="hero-sub mt-6 max-w-lg text-lg text-muted">
              Check offers from 50+ banks & NBFCs. Compare rates, EMIs and eligibility — all in one place, in under 2 minutes.
            </p>
            <ul className="hero-trust mt-8 flex flex-wrap gap-x-7 gap-y-4">
              {TRUST.map((t) => (
                <li key={t.title} className="flex items-center gap-3 text-sm leading-tight">
                  <span className="grid size-11 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-brand-100">
                    <Icon name={t.icon} size={20} />
                  </span>
                  <span>
                    <span className="block font-semibold">{t.title}</span>
                    <span className="text-muted">{t.sub}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual */}
          <div className="relative order-3 mx-auto aspect-[5/4] w-full max-w-[560px] lg:order-2">
            <div className="hero-blob absolute inset-0 overflow-hidden rounded-[42%_58%_46%_54%/55%_45%_55%_45%] bg-brand-200">
              <img src={HERO_IMG} alt="Bright, modern living room in a new home" className="hero-photo size-full object-cover" fetchPriority="high" />
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/30 via-transparent to-transparent" />
            </div>

            <div className="hero-float hero-float-a absolute top-[8%] -left-2 sm:-left-8">
              <div className="hero-float-inner flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl">
                <span className="grid size-10 place-items-center rounded-full bg-green-100 text-success"><Icon name="Check" size={20} strokeWidth={2.5} /></span>
                <span className="leading-tight">
                  <span className="block text-xs text-muted">Home loan approved</span>
                  <span className="font-display text-lg font-bold">₹45,00,000</span>
                </span>
              </div>
            </div>

            <div className="hero-float hero-float-b absolute -right-2 bottom-[12%] sm:-right-6">
              <div className="hero-float-inner rounded-2xl bg-brand-900 p-4 text-white shadow-xl">
                <p className="text-xs text-brand-200">Rates starting from</p>
                <p className="font-display text-3xl font-extrabold text-flame-400">7.35%<span className="ml-1 text-sm font-medium text-brand-200">p.a.</span></p>
                <div className="mt-2 flex -space-x-2">
                  {["sbi", "hdfs", "icic", "axis"].map((l) => (
                    <img key={l} src={`/bank-logos/${l}.png`} alt="" className="size-7 rounded-full border-2 border-brand-900 bg-white object-contain p-0.5" />
                  ))}
                  <span className="grid size-7 place-items-center rounded-full border-2 border-brand-900 bg-flame-400 text-[10px] font-bold text-ink">50+</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 order-2 lg:order-3 lg:col-span-2 lg:-mt-16">
            <SearchWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
