import { useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { DOCUMENTS, ELIGIBILITY, LENDERS, kindLabel, lenderById, loanById } from "../lib/loans";
import { emi, formatINR, formatShort } from "../lib/emi";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon } from "../components/ui";

function ProductPanel({ lender, product }) {
  const type = loanById(product.type);
  const maxAmt = Math.min(type.max, product.maxAmount);
  const [amount, setAmount] = useState(Math.min(type.defaultAmount, maxAmt));
  const [years, setYears] = useState(type.defaultTenure);
  const monthly = emi(amount, product.rate, years * 12);
  const pct = ((amount - type.min) / (maxAmt - type.min)) * 100;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <dl className="grid grid-cols-3 gap-3">
          {[["Rate from", `${product.rate.toFixed(2)}%`], ["Max amount", formatShort(product.maxAmount)], ["Max tenure", `${product.maxTenure} yrs`]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-brand-50 p-4">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 font-display text-xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm font-semibold">Key features</p>
        <ul className="mt-3 grid gap-2">
          {[...product.features, `Processing fee ${lender.fee}`].map((f) => (
            <li key={f} className="flex items-center gap-3 text-muted">
              <span className="grid size-6 place-items-center rounded-full bg-green-50 text-success"><Icon name="Check" size={14} strokeWidth={2.5} /></span>
              {f}
            </li>
          ))}
        </ul>
        <Link to={`/search?type=${product.type}`} className="btn-primary mt-6">
          Check my {type.label.toLowerCase()} offer <Icon name="ArrowRight" size={18} />
        </Link>
      </div>

      <div className="rounded-3xl bg-brand-900 p-6 text-white">
        <p className="text-sm text-brand-200">Estimate your EMI with {lender.name}</p>
        <label htmlFor="ld-amt" className="mt-5 flex items-baseline justify-between text-sm">
          Loan amount <span className="font-display text-lg font-bold">{formatShort(amount)}</span>
        </label>
        <input id="ld-amt" type="range" min={type.min} max={maxAmt} step={type.min} value={amount} onChange={(e) => setAmount(Number(e.target.value))} aria-valuetext={formatShort(amount)} className="emi-range mt-3 w-full" style={{ "--pct": `${pct}%` }} />
        <p className="mt-5 text-sm">Tenure</p>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Tenure">
          {type.tenures.map((y) => (
            <button key={y} role="radio" aria-checked={years === y} onClick={() => setYears(y)} className={`min-h-10 min-w-14 rounded-full px-3 text-sm font-semibold transition-colors ${years === y ? "bg-flame-400 text-ink" : "bg-white/10 hover:bg-white/20"}`}>
              {y}y
            </button>
          ))}
        </div>
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-sm text-brand-200">Monthly EMI at {product.rate.toFixed(2)}%</p>
          <p className="font-display text-4xl font-extrabold tabular-nums" aria-live="polite">{formatINR(monthly)}</p>
          <p className="mt-1 text-sm text-brand-200">Total interest {formatShort(monthly * years * 12 - amount)}</p>
        </div>
      </div>
    </div>
  );
}

export default function LenderDetail() {
  const { id } = useParams();
  const lender = lenderById(id);
  const root = useRef(null);
  const [productType, setProductType] = useState(null);
  const [profile, setProfile] = useState("salaried");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.from(".ld-logo", { scale: 0.6, autoAlpha: 0, rotate: -8, duration: 0.9 })
          .from(".ld-anim", { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.06 }, "-=0.6");
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [id], revertOnUpdate: true }
  );

  if (!lender) return <Navigate to="/lenders" replace />;

  const idx = LENDERS.findIndex((l) => l.id === id);
  const prev = LENDERS[(idx - 1 + LENDERS.length) % LENDERS.length];
  const next = LENDERS[(idx + 1) % LENDERS.length];
  const product = lender.products.find((p) => p.type === productType) ?? lender.products[0];
  const similar = LENDERS.filter((l) => l.kind === lender.kind && l.id !== lender.id).slice(0, 4);
  const maxLoan = Math.max(...lender.products.map((p) => p.maxAmount));

  return (
    <div ref={root} key={id} className="bg-paper pb-24">
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-paper pt-8 pb-12">
        <div className="pointer-events-none absolute -top-32 right-0 size-96 rounded-full bg-brand-200/50 blur-[100px]" />
        <div className="container-x relative">
          <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-4 text-sm">
            <ol className="flex items-center gap-2 text-muted">
              <li><Link to="/lenders" className="hover:text-brand-700">All lenders</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-medium text-ink">{lender.name}</li>
            </ol>
            <span className="tabular-nums text-muted">{idx + 1} of {LENDERS.length}</span>
          </nav>

          <div className="mt-8 grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="ld-logo grid size-28 place-items-center rounded-3xl border border-line bg-white p-3 shadow-[0_20px_40px_-25px_rgb(36_16_82/0.5)] sm:size-32">
              <img src={`/bank-logos/${lender.logo}.png`} alt={`${lender.name} logo`} className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <p className="ld-anim eyebrow">{lender.kind} · {kindLabel(lender.kind)}</p>
              <h1 className="ld-anim mt-3 text-4xl font-extrabold sm:text-5xl">{lender.name}</h1>
              <p className="ld-anim mt-3 max-w-2xl text-muted">{lender.about}</p>
            </div>
            <Link to={`/search?type=${lender.products[0].type}`} className="ld-anim btn-primary">
              <Icon name="Search" size={18} /> Check my offer
            </Link>
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
            {[
              ["Rates starting from", `${lender.lowestRate.toFixed(2)}% p.a.`],
              ["Loan types offered", `${lender.products.length} of 7`],
              ["Max loan amount", `Up to ${formatShort(maxLoan)}`],
              ["Processing fee", lender.fee],
            ].map(([k, v]) => (
              <div key={k} className="ld-anim bg-white p-5">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Products */}
      <section className="container-x mt-6">
        <h2 className="text-3xl font-bold">Loans from {lender.name}</h2>
        <div role="tablist" aria-label="Loan type" className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
          {lender.products.map((p) => {
            const t = loanById(p.type);
            const on = p.type === product.type;
            return (
              <button key={p.type} role="tab" aria-selected={on} aria-controls="ld-panel" onClick={() => setProductType(p.type)} className={`flex min-h-14 shrink-0 items-center gap-2 rounded-2xl border px-4 text-left transition-colors ${on ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white hover:border-brand-300"}`}>
                <Icon name={t.icon} size={18} className={on ? "text-flame-400" : "text-brand-700"} />
                <span className="leading-tight">
                  <span className="block text-sm font-semibold">{t.label}</span>
                  <span className={`text-xs ${on ? "text-brand-100" : "text-muted"}`}>from {p.rate.toFixed(2)}%</span>
                </span>
              </button>
            );
          })}
        </div>
        <div id="ld-panel" role="tabpanel" className="mt-5 rounded-[28px] border border-line bg-white p-6 sm:p-8">
          <ProductPanel key={product.type} lender={lender} product={product} />
        </div>
      </section>

      {/* Rate table */}
      <section className="container-x mt-12" data-reveal>
        <h2 className="text-2xl font-bold">Rate card</h2>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-brand-50 text-muted">
              <tr>
                {["Loan type", "Rate from (p.a.)", "Max amount", "Max tenure", "EMI per ₹1 lakh*"].map((h) => <th key={h} scope="col" className="px-5 py-3 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lender.products.map((p) => {
                const t = loanById(p.type);
                return (
                  <tr key={p.type}>
                    <th scope="row" className="px-5 py-4 font-semibold"><span className="flex items-center gap-2"><Icon name={t.icon} size={16} className="text-brand-700" />{t.label}</span></th>
                    <td className="px-5 py-4 font-semibold text-brand-700 tabular-nums">{p.rate.toFixed(2)}%</td>
                    <td className="px-5 py-4 tabular-nums">{formatShort(p.maxAmount)}</td>
                    <td className="px-5 py-4 tabular-nums">{p.maxTenure} yrs</td>
                    <td className="px-5 py-4 tabular-nums">{formatINR(emi(1e5, p.rate, t.defaultTenure * 12))} <span className="text-xs text-muted">/ {t.defaultTenure} yrs</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">*Indicative, at the starting rate. Final rate depends on {lender.name}’s assessment of your profile.</p>
      </section>

      {/* Eligibility & documents */}
      <section className="container-x mt-12" data-reveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Eligibility & documents</h2>
          <div role="radiogroup" aria-label="Your profile" className="flex rounded-xl bg-brand-50 p-1">
            {[["salaried", "Salaried"], ["self", "Self-employed"]].map(([v, l]) => (
              <button key={v} role="radio" aria-checked={profile === v} onClick={() => setProfile(v)} className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors ${profile === v ? "bg-white text-brand-700 shadow" : "text-muted"}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[["BadgeCheck", "Typical eligibility", ELIGIBILITY[profile]], ["FileText", "Documents required", DOCUMENTS[profile]]].map(([icon, title, items]) => (
            <div key={title} className="rounded-3xl border border-line bg-white p-6">
              <p className="flex items-center gap-2 font-display text-lg font-bold"><Icon name={icon} size={20} className="text-brand-700" />{title}</p>
              <ul className="mt-4 grid gap-3">
                {items.map((x) => <li key={x} className="flex gap-3 text-muted"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-flame-500" />{x}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Similar */}
      {similar.length > 0 && (
        <section className="container-x mt-12" data-reveal>
          <h2 className="text-2xl font-bold">Similar {lender.kind === "NBFC" || lender.kind === "HFC" ? lender.kind + "s" : lender.kind + "s"}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((l) => (
              <li key={l.id}>
                <Link to={`/lenders/${l.id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-brand-300">
                  <img src={`/bank-logos/${l.logo}.png`} alt="" loading="lazy" className="h-10 w-16 object-contain" />
                  <span className="leading-tight"><span className="block font-semibold">{l.name}</span><span className="text-xs text-muted">from {l.lowestRate.toFixed(2)}%</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* One-by-one navigation */}
      <nav aria-label="Browse lenders" className="container-x mt-12 grid grid-cols-2 gap-3">
        {[[prev, "Previous lender", "ArrowLeft"], [next, "Next lender", "ArrowRight"]].map(([l, label, icon], i) => (
          <Link key={label} to={`/lenders/${l.id}`} className={`group flex items-center gap-4 rounded-3xl border border-line bg-white p-5 transition-colors hover:border-brand-700 ${i ? "flex-row-reverse text-right" : ""}`}>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white"><Icon name={icon} size={18} /></span>
            <span className="min-w-0 leading-tight">
              <span className="block text-xs text-muted">{label}</span>
              <span className="block truncate font-semibold">{l.name}</span>
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
