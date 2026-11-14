import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EMPLOYMENT, LOAN_TYPES, loanById } from "../lib/loans";
import { emi, formatINR, formatShort } from "../lib/emi";
import { gsap, useGSAP, MOTION_OK, prefersReducedMotion } from "../lib/motion";
import { Icon, LoanIcon } from "../components/ui";
import { check, detailsSchema } from "../lib/schemas";

const inr = new Intl.NumberFormat("en-IN");
const digits = (v) => String(v ?? "").replace(/\D/g, "");

const STEPS = [
  { id: "type", label: "Loan type" },
  { id: "employment", label: "Employment" },
  { id: "details", label: "Your details" },
  { id: "offers", label: "Offers" },
];

const TIPS = {
  type: "Pick the loan that fits your goal — you can switch anytime without losing your details.",
  employment: "Lenders assess salaried, government, self-employed and retired applicants differently. This helps us show offers you can actually get.",
  details: "We only run a soft check. Your credit score is not affected and nothing is shared without your consent.",
};

/* ---------- Journey header: what you're searching for + progress ---------- */
function Journey({ step, type, emp }) {
  const current = STEPS.findIndex((s) => s.id === step);
  const empLabel = EMPLOYMENT.find((e) => e.id === emp)?.label;
  return (
    <header className="relative overflow-hidden border-b border-line bg-gradient-to-r from-brand-50 via-white to-flame-50/40 px-6 py-5 sm:px-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {type ? (
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-700 text-white shadow-lg shadow-brand-700/25"><Icon name={type.icon} size={22} /></span>
            <div className="leading-tight">
              <p className="text-xs font-medium text-muted">You’re searching for</p>
              <p className="font-display text-xl font-bold">{type.label}</p>
            </div>
          </div>
        ) : (
          <p className="font-display text-2xl font-bold">Let’s find your loan.</p>
        )}

        {/* Desktop: full stepper */}
        <ol className="hidden items-center gap-2 md:flex" aria-label="Progress">
          {STEPS.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.id} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                <span className={`flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-sm font-semibold transition-colors ${active ? "bg-brand-900 text-white shadow-md shadow-brand-900/20" : done ? "bg-white text-ink ring-1 ring-line" : "text-muted"}`}>
                  <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${done ? "bg-flame-400 text-ink" : active ? "bg-white text-brand-800" : "bg-brand-100 text-brand-500"}`}>
                    {done ? <Icon name="Check" size={13} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="leading-tight">
                    {s.label}
                    {s.id === "employment" && done && empLabel && <span className="block text-[11px] font-medium text-muted">{empLabel}</span>}
                  </span>
                </span>
                {i < STEPS.length - 1 && <span className={`h-0.5 w-5 rounded-full lg:w-7 ${done ? "bg-flame-400" : "bg-line"}`} />}
              </li>
            );
          })}
        </ol>

        {/* Mobile: compact progress */}
        <div className="md:hidden">
          <p className="text-sm font-semibold">Step {current + 1} of {STEPS.length} · <span className="text-brand-700">{STEPS[current].label}</span></p>
          <div className="mt-2 flex gap-1.5">
            {STEPS.map((s, i) => <span key={s.id} className={`h-1.5 flex-1 rounded-full ${i < current ? "bg-flame-400" : i === current ? "bg-brand-700" : "bg-brand-100"}`} />)}
          </div>
        </div>
      </div>
    </header>
  );
}

/** "Good to know" note; `dark` styles it for the purple side panel. */
function Tip({ step, className = "lg:max-w-xs", dark = false }) {
  if (!TIPS[step]) return null;
  return (
    <div className={`step-anim rounded-2xl p-4 text-sm ${dark ? "bg-white/5 text-brand-100 ring-1 ring-white/10" : "bg-brand-50 text-brand-900 ring-1 ring-brand-100"} ${className}`}>
      <p className={`mb-1 flex items-center gap-2 font-semibold ${dark ? "text-white" : ""}`}><Icon name="Info" size={15} className="text-flame-400" /> Good to know</p>
      <p className={dark ? "text-brand-200" : "text-brand-800/80"}>{TIPS[step]}</p>
    </div>
  );
}

/* ---------- Step 1: loan type ---------- */
function TypeStep({ onPick }) {
  return (
    <div>
      <h1 className="step-anim text-3xl font-bold sm:text-4xl">What kind of loan do you need?</h1>
      <p className="step-anim mt-2 text-muted">Choose one to see tailored offers from 50+ lenders.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Loan type">
        {LOAN_TYPES.map((t) => (
          <div key={t.id} className="step-anim"><button role="radio" aria-checked="false" onClick={() => onPick(t.id)} className="group w-full flex items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg">
            <LoanIcon name={t.icon} className="size-12 group-hover:bg-brand-700 group-hover:text-white" size={24} />
            <span className="flex-1 leading-tight">
              <span className="block font-semibold">{t.label}</span>
              <span className="text-sm text-muted">{t.tagline}</span>
            </span>
            <Icon name="ChevronRight" size={18} className="text-brand-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-700" />
          </button></div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Step 2: employment ---------- */
const EMP_GROUPS = [
  { id: "salaried", title: "Salary or pension", sub: "A fixed amount lands in your bank every month", icon: "Wallet" },
  { id: "self", title: "Self-employed", sub: "You earn from your own business or practice", icon: "Store" },
];

function EmploymentStep({ type, value, onPick }) {
  const [picked, setPicked] = useState(value);
  const [group, setGroup] = useState(EMPLOYMENT.find((e) => e.id === value)?.group ?? EMP_GROUPS[0].id);
  const refs = useRef({});
  const list = useRef(null);
  const pickedInfo = EMPLOYMENT.find((e) => e.id === picked);
  const options = EMPLOYMENT.filter((e) => e.group === group);

  const switchGroup = (id) => {
    if (id === group) return;
    setGroup(id);
    requestAnimationFrame(() => {
      if (list.current && !prefersReducedMotion()) {
        gsap.fromTo(list.current.children, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.05, ease: "power3.out" });
      }
    });
  };

  // Arrow keys move through the visible options; Enter on the selected one continues.
  const onKey = (e, id) => {
    if (e.key === "Enter" && picked === id) { e.preventDefault(); onPick(id); return; }
    const i = options.findIndex((x) => x.id === id);
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = options[(i + step + options.length) % options.length];
    setPicked(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center">
        <h1 className="step-anim text-3xl font-bold sm:text-4xl">How are you employed?</h1>
        <p className="step-anim mx-auto mt-2 max-w-xl text-muted">Pick your main source of income. Lenders treat each profile differently for a {type.label.toLowerCase()}, so this keeps your offers realistic.</p>
      </div>

      {/* Income group */}
      <div role="tablist" aria-label="Income group" className="step-anim mt-8 grid gap-1.5 rounded-[22px] bg-brand-50 p-1.5 ring-1 ring-brand-100 sm:grid-cols-2">
        {EMP_GROUPS.map((g) => {
          const on = g.id === group;
          const hasPick = pickedInfo?.group === g.id;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              id={`eg-tab-${g.id}`}
              aria-selected={on}
              aria-controls="emp-options"
              onClick={() => switchGroup(g.id)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-[background-color,box-shadow] duration-300 ${on ? "bg-white shadow-[0_10px_30px_-18px_rgb(36_16_82/0.6)]" : "hover:bg-white/60"}`}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${on ? "bg-brand-900 text-white" : "bg-white text-brand-700 ring-1 ring-brand-100"}`}>
                <Icon name={g.icon} size={18} />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-bold">{g.title}</span>
                <span className="text-xs text-muted">{g.sub}</span>
              </span>
              {hasPick && <span className="size-2 shrink-0 rounded-full bg-flame-500" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {/* Options in the chosen group */}
      <div id="emp-options" role="tabpanel" aria-labelledby={`eg-tab-${group}`} className="mt-5">
        <div ref={list} role="radiogroup" aria-label="Employment type" className="grid gap-2.5">
          {options.map((e, idx) => {
            const on = picked === e.id;
            const focusable = on || (!options.some((o) => o.id === picked) && idx === 0);
            return (
              <button
                key={e.id}
                ref={(el) => (refs.current[e.id] = el)}
                role="radio"
                aria-checked={on}
                tabIndex={focusable ? 0 : -1}
                onClick={() => setPicked(e.id)}
                onKeyDown={(ev) => onKey(ev, e.id)}
                onDoubleClick={() => onPick(e.id)}
                className={`step-anim group flex w-full items-center gap-3.5 rounded-2xl border bg-white px-4 py-3.5 text-left transition-[border-color,box-shadow,background-color] duration-300 ${
                  on ? "border-brand-600 bg-brand-50/50 ring-2 ring-brand-600/15" : "border-line hover:border-brand-300 hover:bg-paper"
                }`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors duration-300 ${on ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700 group-hover:bg-brand-100"}`}>
                  <Icon name={e.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block font-semibold">{e.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{e.desc}</span>
                </span>
                <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-brand-700 bg-brand-700" : "border-line bg-white"}`}>
                  <Icon name="Check" size={11} strokeWidth={3.5} className={`text-white transition-transform duration-300 ease-out-expo ${on ? "scale-100" : "scale-0"}`} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Documents + continue */}
      <div className={`step-anim mt-6 overflow-hidden rounded-2xl transition-colors duration-300 ${pickedInfo ? "bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-[0_24px_50px_-26px_rgb(36_16_82/0.9)]" : "bg-paper ring-1 ring-line"}`}>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          {pickedInfo ? (
            <div key={pickedInfo.id} className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-200"><Icon name="FileText" size={13} /> Keep these handy for your application</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {pickedInfo.docs.map((d) => (
                  <li key={d} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium ring-1 ring-white/15">
                    <Icon name="Check" size={11} strokeWidth={3} className="text-flame-400" />{d}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted"><Icon name="Lock" size={14} /> 256-bit encryption · No impact on credit score</p>
          )}
          <button type="button" disabled={!pickedInfo} onClick={() => onPick(picked)} className="btn-primary min-h-12 shrink-0 px-7 text-sm disabled:cursor-not-allowed disabled:opacity-50">
            Continue <Icon name="ArrowRight" size={16} />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <p className="step-anim flex items-start gap-2 text-sm text-muted">
          <Icon name="Info" size={15} className="mt-0.5 shrink-0 text-brand-600" />
          More than one source? Choose the one that brings in the most — you can add the rest to your dashboard later.
        </p>
        <Tip step="employment" className="" />
      </div>
    </div>
  );
}

/* ---------- Step 3: details ---------- */
/** A white rounded row with a small icon and label, matching the employment option rows. */
function FieldRow({ icon, label, htmlFor, labelId, children }) {
  const Tag = htmlFor ? "label" : "p";
  return (
    <div className="step-anim rounded-2xl border border-line bg-white p-4 transition-colors focus-within:border-brand-300">
      <Tag id={labelId} htmlFor={htmlFor} className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name={icon} size={17} /></span>
        <span className="font-semibold">{label}</span>
      </Tag>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Money({ id, value, onChange, error, hint, onBlur, placeholder }) {
  return (
    <div>
      <div className={`flex items-center rounded-xl border bg-paper px-3.5 transition-colors focus-within:bg-white focus-within:ring-4 ${error ? "border-red-600 focus-within:ring-red-100" : "border-line focus-within:border-brand-500 focus-within:ring-brand-100"}`}>
        <span className="font-display text-lg font-bold text-muted">₹</span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={value ? inr.format(value) : ""}
          onChange={(e) => onChange(Number(digits(e.target.value).slice(0, 10)))}
          onBlur={onBlur}
          aria-invalid={!!error}
          aria-describedby={`${id}-help`}
          className="min-h-12 w-full bg-transparent px-2 font-display text-lg font-bold tabular-nums caret-flame-500 outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted/70"
        />
        {value > 0 && <span className="shrink-0 rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{formatShort(value)}</span>}
      </div>
      <p id={`${id}-help`} role={error ? "alert" : undefined} className={`mt-1.5 text-xs ${error ? "text-red-700" : "text-muted"}`}>{error || hint}</p>
    </div>
  );
}

function DetailsStep({ type, emp, initial, onSubmit }) {
  const empInfo = EMPLOYMENT.find((e) => e.id === emp) ?? EMPLOYMENT[0];
  const [amount, setAmount] = useState(initial.amount || 0);
  const [tenure, setTenure] = useState(type.tenures.includes(initial.tenure) ? initial.tenure : type.defaultTenure);
  const [pincode, setPincode] = useState(initial.pincode || "");
  const [income, setIncome] = useState(initial.income || 0);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (v = { amount, pincode, income }) => check(detailsSchema(type), v).errors;
  const blur = (k) => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate());
  };
  const show = (k) => (touched[k] ? errors[k] : "");

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ amount: true, pincode: true, income: true });
    const first = Object.keys(errs).find((k) => errs[k]);
    if (first) return document.getElementById(`f-${first}`)?.focus();
    onSubmit({ amount, tenure, pincode, income });
  };

  const amountOk = amount >= type.min && amount <= type.max;
  const monthly = amountOk ? emi(amount, type.from, tenure * 12) : 0;
  const summary = [type.label, empInfo.label, amount ? formatShort(amount) : null, `${tenure} ${tenure > 1 ? "years" : "year"}`].filter(Boolean);

  return (
    <form onSubmit={submit} noValidate className="mx-auto max-w-3xl">
      <div className="text-center">
        <h1 className="step-anim text-3xl font-bold sm:text-4xl">A few details to find your best offers</h1>
        <p className="step-anim mx-auto mt-2 max-w-xl text-muted">Takes less than a minute. No documents needed right now.</p>
      </div>

      <div className="mt-8 grid gap-2.5">
        <FieldRow icon="IndianRupee" label="Enter amount you need" htmlFor="f-amount">
          <Money id="f-amount" placeholder={`e.g. ${inr.format(type.defaultAmount)}`} value={amount} onChange={setAmount} onBlur={() => blur("amount")} error={show("amount")} hint={`Any amount from ${formatShort(type.min)} to ${formatShort(type.max)} — or pick one below.`} />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {type.amounts.map((x) => (
              <button type="button" key={x} aria-pressed={amount === x} onClick={() => setAmount(x)} className="chip min-h-9 px-3.5 text-sm">{formatShort(x)}</button>
            ))}
          </div>
        </FieldRow>

        {/* Tenure: segmented, like the income-group tabs */}
        <div className="step-anim mt-3 mb-1">
          <p id="d-tenure" className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold"><Icon name="CalendarDays" size={15} className="text-brand-600" /> Repayment tenure</p>
          <div role="radiogroup" aria-labelledby="d-tenure" className="flex gap-1 rounded-[22px] bg-brand-50 p-1.5 ring-1 ring-brand-100">
            {type.tenures.map((y) => {
              const on = tenure === y;
              return (
                <button
                  type="button"
                  role="radio"
                  key={y}
                  aria-checked={on}
                  onClick={() => setTenure(y)}
                  className={`min-h-11 flex-1 rounded-2xl px-2 whitespace-nowrap text-sm font-semibold transition-[background-color,box-shadow,color] duration-300 ${on ? "bg-white text-brand-800 shadow-[0_10px_30px_-18px_rgb(36_16_82/0.6)]" : "text-muted hover:bg-white/60 hover:text-ink"}`}
                >
                  {y}<span className="max-sm:hidden"> {y > 1 ? "yrs" : "yr"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <FieldRow icon="MapPin" label="Current pincode" htmlFor="f-pincode">
            <div className={`flex items-center rounded-xl border bg-paper px-3.5 transition-colors focus-within:bg-white focus-within:ring-4 ${show("pincode") ? "border-red-600 focus-within:ring-red-100" : "border-line focus-within:border-brand-500 focus-within:ring-brand-100"}`}>
              <input
                id="f-pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="400001"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(digits(e.target.value).slice(0, 6))}
                onBlur={() => blur("pincode")}
                aria-invalid={!!show("pincode")}
                aria-describedby="f-pincode-help"
                className="min-h-12 w-full bg-transparent font-display text-lg font-bold tracking-[0.2em] tabular-nums outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60"
              />
            </div>
            <p id="f-pincode-help" role={show("pincode") ? "alert" : undefined} className={`mt-1.5 text-xs ${show("pincode") ? "text-red-700" : "text-muted"}`}>
              {show("pincode") || "Lenders serve specific locations."}
            </p>
          </FieldRow>
          <FieldRow icon="Wallet" label={empInfo.incomeLabel} htmlFor="f-income">
            <Money id="f-income" value={income} onChange={setIncome} onBlur={() => blur("income")} error={show("income")} hint="Include all regular income sources." />
          </FieldRow>
        </div>
      </div>

      {/* Summary + submit, the same dark bar as the employment step */}
      <div className="step-anim mt-6 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-[0_24px_50px_-26px_rgb(36_16_82/0.9)]">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-200"><Icon name="ClipboardCheck" size={13} /> Your search</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {summary.map((t) => (
                <li key={t} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium ring-1 ring-white/15">{t}</li>
              ))}
            </ul>
            {monthly > 0 && (
              <p className="mt-2.5 text-sm text-brand-200">
                Estimated EMI from <span className="font-display text-lg font-bold text-flame-400 tabular-nums">{formatINR(monthly)}</span>/month
                <span className="text-xs"> · at {type.from.toFixed(2)}% p.a., final rate depends on the lender</span>
              </p>
            )}
          </div>
          <button type="submit" className="btn-primary min-h-12 shrink-0 px-7 text-sm">
            View loan offers <Icon name="ArrowRight" size={16} />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <p className="step-anim flex items-start gap-2 text-sm text-muted">
          <Icon name="ShieldCheck" size={15} className="mt-0.5 shrink-0 text-success" />
          No impact on your credit score
        </p>
        <Tip step="details" className="" />
      </div>
    </form>
  );
}

/* ---------- Page ---------- */
export default function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const root = useRef(null);

  const typeId = params.get("type");
  const emp = params.get("emp");
  const type = typeId ? loanById(typeId) : null;
  const step = !type ? "type" : !emp ? "employment" : "details";
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)));
    setParams(next); // pushes history so the browser back button steps back
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".step-anim", { x: 40, autoAlpha: 0, duration: 0.7, stagger: 0.05, ease: "expo.out" });
        gsap.fromTo(".step-progress", { scaleX: (stepIndex) / STEPS.length }, { scaleX: (stepIndex + 1) / STEPS.length, duration: 0.8, ease: "power3.out" });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [step], revertOnUpdate: true }
  );

  const back = () => {
    if (step === "details") update({ emp: null });
    else if (step === "employment") update({ type: null });
    else navigate("/");
  };

  return (
    <div ref={root} className="min-h-[calc(100dvh-72px)] bg-gradient-to-b from-brand-50 to-paper pb-20">
      <div className="h-1 bg-brand-100">
        <div className="step-progress h-full origin-left bg-gradient-to-r from-brand-600 to-flame-500" style={{ transform: `scaleX(${(stepIndex + 1) / STEPS.length})` }} />
      </div>

      <div className="container-x pt-6 sm:pt-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button onClick={back} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-medium text-muted hover:text-ink">
            <Icon name="ArrowLeft" size={18} /> Back
          </button>
          {type && (
            <div className="no-scrollbar flex gap-1 overflow-x-auto" aria-label="Switch loan type">
              {LOAN_TYPES.map((t) => (
                <button key={t.id} onClick={() => update({ type: t.id, amount: null, tenure: null })} aria-pressed={t.id === type.id} className="chip min-h-9 shrink-0 px-3 text-xs">
                  <Icon name={t.icon} size={14} /> <span className="hidden sm:inline">{t.short}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-line bg-white shadow-[0_30px_60px_-45px_rgb(36_16_82/0.5)]">
          <div className="overflow-hidden rounded-t-[28px]"><Journey step={step} type={type} emp={emp} /></div>

          <div key={step + (type?.id ?? "")} className="p-6 sm:p-10">
            {step === "type" && (
              <>
                <TypeStep onPick={(id) => update({ type: id })} />
                <div className="mt-8"><Tip step="type" /></div>
              </>
            )}
            {step === "employment" && <EmploymentStep type={type} value={emp} onPick={(id) => update({ emp: id })} />}
            {step === "details" && (
              <>
              <DetailsStep
                type={type}
                emp={emp}
                initial={{
                  amount: Number(params.get("amount")) || 0,
                  tenure: Number(params.get("tenure")) || 0,
                  income: Number(params.get("income")) || 0,
                  pincode: params.get("pincode") || "",
                }}
                onSubmit={(d) => {
                  const q = new URLSearchParams({ type: type.id, emp, ...d });
                  navigate(`/offers?${q}`);
                }}
              />
              </>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          Already applied? <Link to="/login" className="font-semibold text-brand-700 underline-offset-4 hover:underline">Log in to track your application</Link>
        </p>
      </div>
    </div>
  );
}
