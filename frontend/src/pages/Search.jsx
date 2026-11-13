import { useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EMPLOYMENT, LOAN_TYPES, loanById } from "../lib/loans";
import { formatShort } from "../lib/emi";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon, LoanIcon } from "../components/ui";

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

/* ---------- Left journey panel ---------- */
function Journey({ step, type, emp }) {
  const current = STEPS.findIndex((s) => s.id === step);
  return (
    <aside className="relative overflow-hidden rounded-[28px] bg-brand-900 p-6 text-white lg:sticky lg:top-24 lg:p-8">
      <div className="grain-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 size-64 rounded-full bg-flame-500/25 blur-3xl" />
      <div className="relative">
        {type ? (
          <div className="flex items-center gap-3">
            <LoanIcon name={type.icon} active className="size-12" size={24} />
            <div className="leading-tight">
              <p className="text-xs text-brand-200">You’re searching for</p>
              <p className="font-display text-xl font-bold">{type.label}</p>
            </div>
          </div>
        ) : (
          <p className="font-display text-2xl font-bold">Let’s find your loan.</p>
        )}

        <ol className="mt-8 hidden gap-0 lg:grid">
          {STEPS.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                {i < STEPS.length - 1 && <span className={`absolute top-9 left-[17px] h-[calc(100%-2.25rem)] w-0.5 ${done ? "bg-flame-400" : "bg-white/15"}`} />}
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? "bg-flame-400 text-ink" : active ? "bg-white text-brand-800 ring-4 ring-white/20" : "bg-white/10 text-brand-200"}`}>
                  {done ? <Icon name="Check" size={16} strokeWidth={3} /> : i + 1}
                </span>
                <span className="pt-1.5">
                  <span className={`block font-semibold ${active ? "text-white" : done ? "text-brand-100" : "text-brand-300"}`}>{s.label}</span>
                  {s.id === "employment" && emp && <span className="text-sm text-brand-200">{EMPLOYMENT.find((e) => e.id === emp)?.label}</span>}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 hidden rounded-2xl bg-white/5 p-4 text-sm text-brand-100 ring-1 ring-white/10 lg:block">
          <p className="mb-1 flex items-center gap-2 font-semibold text-white"><Icon name="Info" size={16} className="text-flame-400" /> Good to know</p>
          {TIPS[step]}
        </div>
        <p className="mt-6 hidden items-center gap-2 text-xs text-brand-200 lg:flex">
          <Icon name="Lock" size={14} /> 256-bit encryption · No impact on credit score
        </p>
      </div>
    </aside>
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
  const refs = useRef({});

  // Arrow keys move through all six options, like a native radio group.
  const onKey = (e, id) => {
    const i = EMPLOYMENT.findIndex((x) => x.id === id);
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = EMPLOYMENT[(i + step + EMPLOYMENT.length) % EMPLOYMENT.length];
    setPicked(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div>
      <h1 className="step-anim text-3xl font-bold sm:text-4xl">How are you employed?</h1>
      <p className="step-anim mt-2 max-w-xl text-muted">Pick your main source of income. Lenders treat each profile differently for a {type.label.toLowerCase()}, so this keeps your offers realistic.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2" role="radiogroup" aria-label="Employment type">
        {EMP_GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`eg-${g.id}`} className="step-anim">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-900 text-white"><Icon name={g.icon} size={18} /></span>
              <div className="leading-tight">
                <h2 id={`eg-${g.id}`} className="font-sans text-base font-bold tracking-normal">{g.title}</h2>
                <p className="text-xs text-muted">{g.sub}</p>
              </div>
            </div>

            <div className="grid gap-2">
              {EMPLOYMENT.filter((e) => e.group === g.id).map((e) => {
                const on = picked === e.id;
                return (
                  <div
                    key={e.id}
                    className={`overflow-hidden rounded-2xl border-2 transition-[border-color,box-shadow,background-color] duration-300 ${
                      on ? "border-brand-700 bg-white shadow-[0_18px_40px_-24px_rgb(70_32_141/0.7)]" : "border-line bg-white hover:border-brand-300"
                    }`}
                  >
                    <button
                      ref={(el) => (refs.current[e.id] = el)}
                      role="radio"
                      aria-checked={on}
                      tabIndex={on || (!picked && e.id === EMPLOYMENT[0].id) ? 0 : -1}
                      onClick={() => setPicked(e.id)}
                      onKeyDown={(ev) => onKey(ev, e.id)}
                      onDoubleClick={() => onPick(e.id)}
                      className="flex w-full items-center gap-3.5 p-4 text-left"
                    >
                      <span className={`grid size-12 shrink-0 place-items-center rounded-xl transition-colors duration-300 ${on ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700"}`}>
                        <Icon name={e.icon} size={22} />
                      </span>
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block font-semibold">{e.label}</span>
                        <span className="mt-0.5 block text-sm text-muted">{e.desc}</span>
                      </span>
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-brand-700" : "border-line"}`}>
                        <span className={`size-3 rounded-full bg-brand-700 transition-transform duration-300 ease-out-expo ${on ? "scale-100" : "scale-0"}`} />
                      </span>
                    </button>

                    <div className={`grid transition-[grid-template-rows] duration-400 ease-out-expo ${on ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                      <div className="overflow-hidden" inert={!on}>
                        <div className="mx-4 mb-4 rounded-xl bg-brand-50 p-4">
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-800"><Icon name="FileText" size={14} /> Keep these handy for your application</p>
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {e.docs.map((d) => (
                              <li key={d} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium ring-1 ring-brand-100">
                                <Icon name="Check" size={12} className="text-success" />{d}
                              </li>
                            ))}
                          </ul>
                          <button type="button" onClick={() => onPick(e.id)} className="btn-primary mt-4 min-h-11 w-full text-sm">
                            Continue <Icon name="ArrowRight" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="step-anim mt-6 flex items-start gap-2 text-sm text-muted">
        <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-brand-600" />
        More than one source? Choose the one that brings in the most — you can add the rest to your dashboard later.
      </p>
    </div>
  );
}

/* ---------- Step 3: details ---------- */
function Money({ id, label, value, onChange, error, hint, onBlur, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="font-medium">{label}</label>
      <div className={`mt-2 flex items-center rounded-2xl border bg-white px-4 transition-colors focus-within:ring-4 ${error ? "border-red-600 focus-within:ring-red-100" : "border-line focus-within:border-brand-500 focus-within:ring-brand-100"}`}>
        <span className="font-display text-xl font-bold text-muted">₹</span>
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
          className="min-h-14 w-full bg-transparent px-2 font-display text-xl font-bold tabular-nums caret-flame-500 outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted/70"
        />
        {value > 0 && <span className="shrink-0 rounded-lg bg-brand-50 px-2 py-1 text-sm font-semibold text-brand-700">{formatShort(value)}</span>}
      </div>
      <p id={`${id}-help`} role={error ? "alert" : undefined} className={`mt-1.5 text-sm ${error ? "text-red-700" : "text-muted"}`}>{error || hint}</p>
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

  const validate = (v = { amount, pincode, income }) => ({
    amount: !v.amount ? "Enter the loan amount you need." : v.amount < type.min || v.amount > type.max ? `Enter an amount between ${formatShort(type.min)} and ${formatShort(type.max)}.` : "",
    pincode: /^[1-9]\d{5}$/.test(v.pincode) ? "" : "Enter your 6-digit residential pincode.",
    income: v.income >= 100000 ? "" : "Enter your annual income (minimum ₹1,00,000).",
  });
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

  return (
    <form onSubmit={submit} noValidate>
      <p className="step-anim text-sm font-semibold tracking-widest text-brand-600 uppercase">Step 3 of 3</p>
      <h1 className="step-anim mt-2 text-3xl font-bold sm:text-4xl">A few details to find your best offers</h1>
      <p className="step-anim mt-2 text-muted">Takes less than a minute. No documents needed right now.</p>

      <div className="mt-8 grid gap-7">
        <div className="step-anim">
          <Money id="f-amount" label="Enter amount you need" placeholder={`e.g. ${inr.format(type.defaultAmount)}`} value={amount} onChange={setAmount} onBlur={() => blur("amount")} error={show("amount")} hint={`Any amount from ${formatShort(type.min)} to ${formatShort(type.max)} — or pick one below.`} />
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {type.amounts.map((a) => (
              <button type="button" key={a} aria-pressed={amount === a} onClick={() => setAmount(a)} className="chip shrink-0">{formatShort(a)}</button>
            ))}
          </div>
        </div>

        <fieldset className="step-anim">
          <legend className="font-medium">Repayment tenure</legend>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Tenure in years">
            {type.tenures.map((y) => (
              <button type="button" role="radio" key={y} aria-checked={tenure === y} onClick={() => setTenure(y)} className="chip min-w-20 justify-center">
                {y} {y > 1 ? "yrs" : "yr"}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="step-anim grid gap-7 sm:grid-cols-[0.7fr_1.3fr]">
          <div>
            <label htmlFor="f-pincode" className="font-medium">Current pincode</label>
            <div className={`mt-2 flex items-center rounded-2xl border bg-white px-4 focus-within:ring-4 ${show("pincode") ? "border-red-600 focus-within:ring-red-100" : "border-line focus-within:border-brand-500 focus-within:ring-brand-100"}`}>
              <Icon name="MapPin" size={18} className="text-muted" />
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
                className="min-h-14 w-full bg-transparent px-2 font-display text-xl font-bold tracking-[0.2em] tabular-nums outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/60"
              />
            </div>
            <p id="f-pincode-help" role={show("pincode") ? "alert" : undefined} className={`mt-1.5 text-sm ${show("pincode") ? "text-red-700" : "text-muted"}`}>
              {show("pincode") || "Lenders serve specific locations."}
            </p>
          </div>
          <Money id="f-income" label={empInfo.incomeLabel} value={income} onChange={setIncome} onBlur={() => blur("income")} error={show("income")} hint="Include all regular income sources." />
        </div>
      </div>

      <div className="step-anim mt-10 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary min-h-14 px-8 text-base">
          View loan offers <Icon name="ArrowRight" size={18} />
        </button>
        <p className="flex items-center gap-2 text-sm text-muted"><Icon name="ShieldCheck" size={16} className="text-success" /> No impact on your credit score</p>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:gap-10">
          <Journey step={step} type={type} emp={emp} />

          <div key={step + (type?.id ?? "")} className="rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_60px_-45px_rgb(36_16_82/0.5)] sm:p-10">
            {step === "type" && <TypeStep onPick={(id) => update({ type: id })} />}
            {step === "employment" && <EmploymentStep type={type} value={emp} onPick={(id) => update({ emp: id })} />}
            {step === "details" && (
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
