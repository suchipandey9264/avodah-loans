import { useId, useRef, useState } from "react";
import { emi, formatINR, formatShort } from "../lib/emi";
import { Link } from "react-router-dom";
import { gsap, useGSAP, prefersReducedMotion } from "../lib/motion";
import { Icon, SectionHeading } from "./ui";

function Slider({ label, value, min, max, step, onChange, display, minLabel, maxLabel }) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="font-medium">{label}</label>
        <output htmlFor={id} className="rounded-lg bg-brand-50 px-3 py-1 font-display text-lg font-bold text-brand-700 tabular-nums">
          {display(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display(value)}
        className="emi-range mt-4 w-full"
        style={{ "--pct": `${pct}%` }}
      />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

export default function EmiCalculator() {
  const [amount, setAmount] = useState(5_000_000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const months = years * 12;
  const monthly = emi(amount, rate, months);
  const total = monthly * months;
  const interest = total - amount;
  const interestShare = interest / total;

  const emiRef = useRef(null);
  const barRef = useRef(null);
  const shown = useRef({ v: monthly });

  // Tween the headline EMI and the breakdown bar whenever inputs change.
  useGSAP(
    () => {
      const instant = prefersReducedMotion();
      gsap.to(shown.current, {
        v: monthly,
        duration: instant ? 0 : 0.6,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => {
          if (emiRef.current) emiRef.current.textContent = formatINR(shown.current.v);
        },
      });
      gsap.to(barRef.current, { scaleX: interestShare, duration: instant ? 0 : 0.6, ease: "power3.out", overwrite: true });
    },
    { dependencies: [monthly, interestShare] }
  );

  return (
    <section id="emi" className="py-24 sm:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="EMI calculator"
            title="Know your EMI before you apply."
            sub="Drag the sliders to see your monthly instalment and total interest instantly. Plan smarter, borrow confidently."
          />
          <ul className="mt-8 grid gap-3 text-muted" data-stagger>
            {["Personal, home, business & Mudra loan EMIs", "Eligibility & prepayment planning", "FD, post-office FD, GST & NPS calculators"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-brand-100 text-brand-700"><Icon name="Check" size={14} strokeWidth={2.5} /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_40px_80px_-50px_rgb(70_32_141/0.5)]" data-reveal>
          <div className="grid gap-8 p-6 sm:p-8">
            <Slider label="Loan amount" value={amount} min={100_000} max={20_000_000} step={100_000} onChange={setAmount} display={formatShort} minLabel="₹1 L" maxLabel="₹2 Cr" />
            <Slider label="Interest rate (p.a.)" value={rate} min={6} max={20} step={0.05} onChange={setRate} display={(v) => `${v.toFixed(2)}%`} minLabel="6%" maxLabel="20%" />
            <Slider label="Tenure" value={years} min={1} max={30} step={1} onChange={setYears} display={(v) => `${v} yr${v > 1 ? "s" : ""}`} minLabel="1 yr" maxLabel="30 yrs" />
          </div>

          <div className="bg-brand-900 p-6 text-white sm:p-8">
            <p className="text-sm text-brand-200">Your monthly EMI</p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">
              <span className="sr-only" aria-live="polite">{formatINR(monthly)} per month</span>
              <span ref={emiRef} aria-hidden="true">{formatINR(monthly)}</span>
            </p>

            <div className="mt-6">
              <div className="relative h-3 overflow-hidden rounded-full bg-brand-300" role="img" aria-label={`Principal ${Math.round((1 - interestShare) * 100)}%, interest ${Math.round(interestShare * 100)}% of total payable`}>
                <div ref={barRef} className="absolute inset-0 origin-right rounded-full bg-flame-400" style={{ transform: `scaleX(${interestShare})` }} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-brand-200"><span className="size-2.5 rounded-full bg-brand-300" />Principal</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatShort(amount)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-brand-200"><span className="size-2.5 rounded-full bg-flame-400" />Interest</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatShort(interest)}</dd>
                </div>
                <div>
                  <dt className="text-brand-200">Total payable</dt>
                  <dd className="mt-1 font-semibold tabular-nums">{formatShort(total)}</dd>
                </div>
              </dl>
            </div>
            <Link to="/search" className="btn-accent mt-8 w-full sm:w-auto">
              Get offers at this EMI <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
