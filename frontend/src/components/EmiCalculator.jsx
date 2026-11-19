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
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-muted">{label}</label>
        <output htmlFor={id} className="font-display text-base font-bold text-brand-700 tabular-nums">
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
        className="emi-range mt-2.5 w-full"
        style={{ "--pct": `${pct}%` }}
      />
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

const RING = 2 * Math.PI * 42; // circumference of the r=42 donut

export default function EmiCalculator({ headingAs }) {
  const [amount, setAmount] = useState(5_000_000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);

  const months = years * 12;
  const monthly = emi(amount, rate, months);
  const total = monthly * months;
  const interest = total - amount;
  const interestShare = interest / total;
  const interestPct = Math.round(interestShare * 100);

  const emiRef = useRef(null);
  const shown = useRef({ v: monthly });

  // Tween the headline EMI whenever inputs change.
  useGSAP(
    () => {
      gsap.to(shown.current, {
        v: monthly,
        duration: prefersReducedMotion() ? 0 : 0.6,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => {
          if (emiRef.current) emiRef.current.textContent = formatINR(shown.current.v);
        },
      });
    },
    { dependencies: [monthly] }
  );

  return (
    <section id="emi" className="py-8 sm:py-10">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_minmax(0,30rem)] lg:items-center lg:gap-16">
        <div>
          <SectionHeading
            eyebrow="EMI calculator"
            as={headingAs}
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

        <div className="w-full rounded-3xl border border-line bg-white p-2 shadow-[0_30px_60px_-40px_rgb(70_32_141/0.5)]" data-reveal>
          <div className="grid gap-5 px-4 pt-4 pb-5 sm:px-5">
            <Slider label="Loan amount" value={amount} min={100_000} max={20_000_000} step={100_000} onChange={setAmount} display={formatShort} minLabel="₹1 L" maxLabel="₹2 Cr" />
            <Slider label="Interest rate (p.a.)" value={rate} min={6} max={20} step={0.05} onChange={setRate} display={(v) => `${v.toFixed(2)}%`} minLabel="6%" maxLabel="20%" />
            <Slider label="Tenure" value={years} min={1} max={30} step={1} onChange={setYears} display={(v) => `${v} yr${v > 1 ? "s" : ""}`} minLabel="1 yr" maxLabel="30 yrs" />
          </div>

          <div className="rounded-[20px] bg-brand-900 p-5 text-white">
            <div className="flex items-center gap-5">
              {/* Donut: the full ring is the total payable, the orange arc is the interest share */}
              <div className="relative size-24 shrink-0" role="img" aria-label={`Principal ${100 - interestPct}%, interest ${interestPct}% of total payable`}>
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" strokeWidth="12" className="stroke-brand-300" />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="12"
                    strokeDasharray={RING}
                    strokeDashoffset={RING * (1 - interestShare)}
                    className="stroke-flame-400 transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
                  />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-center leading-none" aria-hidden="true">
                  <span>
                    <span className="block font-display text-lg font-bold tabular-nums">{interestPct}%</span>
                    <span className="text-[10px] text-brand-200">interest</span>
                  </span>
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-brand-200">Your monthly EMI</p>
                <p className="mt-0.5 font-display text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                  <span className="sr-only" aria-live="polite">{formatINR(monthly)} per month</span>
                  <span ref={emiRef} aria-hidden="true">{formatINR(monthly)}</span>
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs">
              <div>
                <dt className="flex items-center gap-1.5 text-brand-200"><span className="size-2 rounded-full bg-brand-300" />Principal</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums">{formatShort(amount)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-brand-200"><span className="size-2 rounded-full bg-flame-400" />Interest</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums">{formatShort(interest)}</dd>
              </div>
              <div>
                <dt className="text-brand-200">Total payable</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums">{formatShort(total)}</dd>
              </div>
            </dl>

            <Link to="/search" className="btn-accent mt-5 w-full text-sm">
              Get offers at this EMI <Icon name="ArrowRight" size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
