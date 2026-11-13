import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap, useGSAP, MOTION_OK, prefersReducedMotion } from "../lib/motion";
import { logCredit } from "../lib/activity";
import { Icon, SectionHeading } from "../components/ui";

const BANDS = [
  { min: 300, max: 549, label: "Poor", color: "#dc2626", text: "text-red-700", note: "Most lenders will decline or charge high rates. Focus on clearing dues first.", loans: ["Gold loan", "Secured loans"] },
  { min: 550, max: 649, label: "Fair", color: "#f59e0b", text: "text-amber-700", note: "Some NBFCs will lend, usually at higher interest. Small improvements help a lot.", loans: ["Gold loan", "Loan against property", "Select NBFC personal loans"] },
  { min: 650, max: 749, label: "Good", color: "#65a30d", text: "text-lime-700", note: "You qualify with most lenders. Push past 750 to unlock the best rates.", loans: ["Home loan", "Car loan", "Business loan", "Personal loan"] },
  { min: 750, max: 900, label: "Excellent", color: "#15803d", text: "text-green-700", note: "You’re a preferred borrower — expect the lowest rates and quick approvals.", loans: ["All loans at the best rates", "Pre-approved offers", "Higher limits"] },
];
const bandOf = (s) => BANDS.find((b) => s >= b.min && s <= b.max) ?? BANDS[0];

// Semicircle geometry: centre (130,130), radius 105, 300 → left, 900 → right.
const polar = (score, r = 105) => {
  const a = Math.PI * (1 - (score - 300) / 600);
  return [130 + r * Math.cos(a), 130 - r * Math.sin(a)];
};
const arc = (from, to) => {
  const [x1, y1] = polar(from);
  const [x2, y2] = polar(to);
  return `M ${x1} ${y1} A 105 105 0 0 1 ${x2} ${y2}`;
};

function Gauge({ score }) {
  const needle = useRef(null);
  const label = useRef(null);
  const shown = useRef({ v: 300 });

  useGSAP(
    () => {
      const rot = -90 + ((score - 300) / 600) * 180;
      const d = prefersReducedMotion() ? 0 : 0.9;
      gsap.to(needle.current, { rotation: rot, svgOrigin: "130 130", duration: d, ease: "elastic.out(1, 0.6)" });
      gsap.to(shown.current, { v: score, duration: d, ease: "power3.out", onUpdate: () => label.current && (label.current.textContent = Math.round(shown.current.v)) });
    },
    { dependencies: [score] }
  );

  const band = bandOf(score);
  return (
    <figure className="relative mx-auto w-full max-w-sm">
      <svg viewBox="0 0 260 150" className="w-full" role="img" aria-label={`Credit score ${score}, ${band.label}`}>
        {BANDS.map((b, i) => (
          <path key={b.label} d={arc(b.min + (i ? 2 : 0), b.max - 2)} stroke={b.color} strokeWidth="18" fill="none" opacity={b === band ? 1 : 0.28} className="transition-opacity duration-300" />
        ))}
        <g ref={needle}>
          <path d="M 126 130 L 130 44 L 134 130 Z" fill="var(--color-ink)" />
        </g>
        <circle cx="130" cy="130" r="10" fill="var(--color-ink)" />
        <circle cx="130" cy="130" r="4" fill="white" />
        <text x="22" y="148" fontSize="10" fill="var(--color-muted)">300</text>
        <text x="220" y="148" fontSize="10" fill="var(--color-muted)">900</text>
      </svg>
      <figcaption className="-mt-2 text-center">
        <span ref={label} className="font-display text-6xl font-extrabold tabular-nums">{score}</span>
        <span className={`mt-1 block text-lg font-bold ${band.text}`}>{band.label}</span>
      </figcaption>
    </figure>
  );
}

function ReportForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const errs = {
      name: f.get("name").trim() ? "" : "Enter your full name as on PAN.",
      phone: /^[6-9]\d{9}$/.test(f.get("phone").replace(/\D/g, "")) ? "" : "Enter a valid 10-digit mobile number.",
      pan: /^[A-Z]{5}\d{4}[A-Z]$/.test(f.get("pan").toUpperCase()) ? "" : "PAN format: ABCDE1234F",
      consent: f.get("consent") ? "" : "Please give consent to fetch your report.",
    };
    setErrors(errs);
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) return e.currentTarget.elements[first].focus();
    logCredit({ name: f.get("name").trim() });
    setSent(true);
  };

  if (sent)
    return (
      <div role="status" className="py-10 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-success"><Icon name="Check" size={30} strokeWidth={2.5} /></span>
        <h3 className="mt-5 text-2xl font-bold">Request received</h3>
        <p className="mt-2 text-muted">We’ll verify your details and send your free credit report to your registered mobile number.</p>
      </div>
    );

  const field = (name, label, props = {}) => (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input name={name} aria-invalid={!!errors[name]} aria-describedby={`${name}-e`} className={`field ${errors[name] ? "border-red-600" : ""}`} {...props} />
      <span id={`${name}-e`} className="min-h-4 text-xs font-normal text-red-700">{errors[name]}</span>
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-2">
      {field("name", "Full name (as on PAN)", { autoComplete: "name", placeholder: "Priya Shah" })}
      {field("phone", "Mobile number", { type: "tel", autoComplete: "tel-national", inputMode: "numeric", placeholder: "98765 43210" })}
      {field("pan", "PAN", { autoCapitalize: "characters", placeholder: "ABCDE1234F", maxLength: 10, className: `field uppercase tracking-widest ${errors.pan ? "border-red-600" : ""}` })}
      <label className="flex gap-3 text-xs text-muted">
        <input type="checkbox" name="consent" className="mt-0.5 size-5 shrink-0 accent-brand-700" aria-describedby="consent-e" />
        I authorise AvodahLoans to fetch my credit report from credit bureaus for loan matching. This won’t affect my score.
      </label>
      <span id="consent-e" className="min-h-4 text-xs text-red-700">{errors.consent}</span>
      <button className="btn-primary mt-1 w-full">Get my free report <Icon name="ArrowRight" size={18} /></button>
    </form>
  );
}

const TIPS = [
  ["Clock", "Pay every EMI on time", "Payment history is the biggest factor. Set up auto-debit so you never miss a due date."],
  ["Percent", "Keep card usage under 30%", "High credit-card utilisation signals stress. Spread spends or ask for a higher limit."],
  ["Search", "Limit hard enquiries", "Many loan applications in a short time lower your score. Compare first with soft checks."],
  ["Landmark", "Keep old accounts open", "A longer credit history helps. Avoid closing your oldest credit card without reason."],
];

export default function CreditScore() {
  const [score, setScore] = useState(760);
  const band = bandOf(score);
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".cs-anim", { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      <section className="bg-gradient-to-b from-brand-50 to-paper pt-12 pb-20 sm:pt-16">
        <div className="container-x grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <div>
            <p className="cs-anim eyebrow">Free credit score</p>
            <h1 className="cs-anim mt-4 text-5xl leading-[1.02] font-extrabold sm:text-6xl">Know your score. <span className="text-brand-700">Borrow smarter.</span></h1>
            <p className="cs-anim mt-5 max-w-lg text-lg text-muted">Your credit score decides the rate you get. See what each range means — then get your full report free.</p>

            <div className="cs-anim mt-10 rounded-[28px] border border-line bg-white p-6 sm:p-8">
              <Gauge score={score} />
              <label htmlFor="score-range" className="mt-6 block text-sm font-medium">Drag to explore score ranges</label>
              <input id="score-range" type="range" min={300} max={900} value={score} onChange={(e) => setScore(Number(e.target.value))} aria-valuetext={`${score}, ${band.label}`} className="emi-range mt-3 w-full" style={{ "--pct": `${((score - 300) / 600) * 100}%` }} />
              <div className="mt-6 rounded-2xl bg-brand-50 p-4">
                <p className="text-sm">{band.note}</p>
                <p className="mt-3 text-xs font-semibold tracking-wider text-muted uppercase">Likely to qualify for</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {band.loans.map((l) => <li key={l} className="rounded-full bg-white px-3 py-1 text-sm font-medium ring-1 ring-line">{l}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="cs-anim rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_60px_-40px_rgb(36_16_82/0.5)] sm:p-8 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-700 text-white"><Icon name="Gauge" size={24} /></span>
              <div>
                <h2 className="text-xl font-bold">Get your full credit report</h2>
                <p className="text-sm text-muted">Free · No impact on your score</p>
              </div>
            </div>
            <div className="mt-6"><ReportForm /></div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Improve your score" title="Four habits that move your score up." />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-stagger>
            {TIPS.map(([icon, t, d]) => (
              <li key={t} className="rounded-3xl border border-line bg-white p-6">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Icon name={icon} size={22} /></span>
                <h3 className="mt-6 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ul>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-brand-900 p-8 text-white" data-reveal>
            <p className="font-display text-2xl font-bold">Score looking good? See the rates you qualify for.</p>
            <Link to="/search" className="btn-accent"><Icon name="Search" size={18} /> Search Loan</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
