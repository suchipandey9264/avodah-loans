import { useMemo, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { contactLabel, useAuth } from "../lib/auth";
import { api, getToken } from "../lib/api";
import { clearActivity, removeSearch, toggleSaved, updateProfile, useActivity } from "../lib/activity";
import { EMPLOYMENT, LENDERS, empById, loanById } from "../lib/loans";
import { formatINR, formatShort } from "../lib/emi";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon } from "../components/ui";

const TABS = [
  { id: "overview", label: "Overview", icon: "LayoutDashboard" },
  { id: "applications", label: "Applications", icon: "FileText" },
  { id: "saved", label: "Saved offers", icon: "Heart" },
  { id: "searches", label: "Search history", icon: "History" },
  { id: "requests", label: "Requests", icon: "Activity" },
  { id: "employment", label: "Employment", icon: "Briefcase" },
  { id: "profile", label: "Personal details", icon: "UserRound" },
];

const STAGES = ["Submitted", "Advisor call", "Documents", "Sanction", "Disbursal"];
const BANKS = LENDERS.filter((l) => l.kind.includes("Bank")).map((l) => l.name).sort();
const BORROW_TYPES = ["home", "lap", "business", "car", "personal", "education"];
const EXPERIENCE = ["Less than 1 year", "1–2 years", "2–3 years", "3–5 years", "5–10 years", "10+ years"];

const rtf = new Intl.RelativeTimeFormat("en-IN", { numeric: "auto" });
function ago(ts) {
  const s = Math.round((ts - Date.now()) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(s, "second");
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
}
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const inr = new Intl.NumberFormat("en-IN");
const syncProfile = (p) => { if (getToken()) api.updateProfile(p).catch(() => {}); };

/** Monthly income lenders will use, from the employment details. */
function monthlyIncome(e = {}) {
  const n = (v) => Number(v) || 0;
  return n(e.monthlySalary) || n(e.monthlyPension) || n(e.annualIncome) / 12 || 0;
}
/** Rough home-loan eligibility: 50% FOIR minus existing EMIs, 8.5% for 20 years. */
function eligibleAmount(income, emis) {
  const room = income * 0.5 - (Number(emis) || 0);
  if (room <= 0) return 0;
  const r = 8.5 / 12 / 100, n = 240, f = Math.pow(1 + r, n);
  return (room * (f - 1)) / (r * f);
}

/* ---------- Small building blocks ---------- */

function Empty({ icon, title, text, to, cta }) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-200 bg-white p-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Icon name={icon} size={26} /></span>
      <p className="mt-4 font-display text-xl font-bold">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-muted">{text}</p>
      {to && <Link to={to} className="btn-primary mt-5">{cta}</Link>}
    </div>
  );
}

function SectionTitle({ title, sub, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Text({ label, name, defaultValue, hint, className = "", ...rest }) {
  return (
    <label className={`grid content-start gap-1.5 text-sm font-medium ${className}`}>
      {label}
      <input name={name} defaultValue={defaultValue ?? ""} className="field" {...rest} />
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

function Select({ label, name, defaultValue, options, className = "" }) {
  return (
    <label className={`grid content-start gap-1.5 text-sm font-medium ${className}`}>
      {label}
      <span className="relative">
        <select name={name} defaultValue={defaultValue ?? ""} className="field appearance-none pr-10">
          <option value="">Select</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Icon name="ChevronDown" size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted" />
      </span>
    </label>
  );
}

/** ₹ amount input with Indian digit grouping. */
function Rupees({ label, name, defaultValue, hint, onValue, className = "" }) {
  const [v, setV] = useState(Number(defaultValue) || 0);
  return (
    <label className={`grid content-start gap-1.5 text-sm font-medium ${className}`}>
      {label}
      <span className="flex items-center rounded-xl border border-line bg-white px-4 transition-colors focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
        <span className="font-semibold text-muted">₹</span>
        <input
          inputMode="numeric"
          value={v ? inr.format(v) : ""}
          onChange={(e) => { const n = Number(e.target.value.replace(/\D/g, "").slice(0, 11)); setV(n); onValue?.(n); }}
          className="min-h-12 w-full bg-transparent px-2 text-base tabular-nums outline-none"
        />
        <input type="hidden" name={name} value={v || ""} />
        {v >= 1e5 && <span className="shrink-0 text-xs font-semibold text-brand-700">{formatShort(v)}</span>}
      </span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

function Fieldset({ icon, title, sub, children }) {
  return (
    <fieldset className="dash-anim rounded-3xl border border-line bg-white p-5 sm:p-7">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={icon} size={20} /></span>
        <div>
          <p className="font-display text-lg font-bold">{title}</p>
          {sub && <p className="text-sm text-muted">{sub}</p>}
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function ApplicationCard({ a }) {
  const t = loanById(a.type);
  const stage = 1; // submitted is complete; advisor call is next
  return (
    <li className="dash-anim rounded-3xl border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link to={`/lenders/${a.lenderId}`} className="flex items-center gap-3">
          <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-white p-1 ring-1 ring-line"><img src={`/bank-logos/${a.logo}.png`} alt="" className="max-h-full max-w-full object-contain" /></span>
          <span className="leading-tight">
            <span className="block font-bold hover:text-brand-700">{a.name}</span>
            <span className="text-sm text-muted">{t.label} · applied {ago(a.ts)}</span>
          </span>
        </Link>
        <span className="rounded-lg bg-brand-50 px-3 py-1 text-xs">Ref <strong className="tabular-nums">{a.ref}</strong></span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div><dt className="text-xs text-muted">Amount</dt><dd className="font-semibold tabular-nums">{formatShort(a.amount)}</dd></div>
        <div><dt className="text-xs text-muted">Rate from</dt><dd className="font-semibold tabular-nums">{a.rate.toFixed(2)}%</dd></div>
        <div><dt className="text-xs text-muted">EMI · {a.tenure} yrs</dt><dd className="font-semibold tabular-nums">{formatINR(a.emi)}</dd></div>
      </dl>
      <ol className="mt-5 grid grid-cols-5 gap-1" aria-label="Application progress">
        {STAGES.map((s, i) => {
          const done = i < stage;
          const current = i === stage;
          return (
            <li key={s} className="text-center" aria-current={current ? "step" : undefined}>
              <span className={`block h-1.5 rounded-full ${done ? "bg-success" : current ? "bg-brand-500" : "bg-line"}`} />
              <span className={`mt-2 block text-[11px] leading-tight sm:text-xs ${done ? "font-semibold text-success" : current ? "font-semibold text-ink" : "text-muted"}`}>
                {done && <Icon name="Check" size={11} strokeWidth={3} className="mr-0.5 inline" />}{s}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800 ring-1 ring-brand-100"><Icon name="PhoneCall" size={16} /> Next: a loan advisor will call you to collect documents.</p>
    </li>
  );
}

/* ---------- Employment tab ---------- */

function EmploymentForm({ profile, onSaved }) {
  const [emp, setEmp] = useState(profile.emp || "");
  const e = profile.employment ?? {};
  const [income, setIncome] = useState(monthlyIncome(e));
  const [emis, setEmis] = useState(Number(e.existingEmi) || 0);
  const info = empById(emp);
  const group = info?.group;
  const est = eligibleAmount(income, emis);

  const save = (ev) => {
    ev.preventDefault();
    const data = Object.fromEntries([...new FormData(ev.currentTarget)].map(([k, v]) => [k, String(v).trim()]).filter(([, v]) => v !== ""));
    const patch = { emp, employment: { ...data, updatedAt: Date.now() } };
    updateProfile(patch);
    syncProfile(patch);
    onSaved("Employment details saved");
  };

  return (
    <form onSubmit={save} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
      <div className="grid gap-5">
        <fieldset className="dash-anim rounded-3xl border border-line bg-white p-5 sm:p-7">
          <legend className="sr-only">Employment type</legend>
          <p className="font-display text-lg font-bold">How are you employed?</p>
          <p className="text-sm text-muted">Lenders ask different questions for each profile.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Employment type">
            {EMPLOYMENT.map((x) => {
              const on = emp === x.id;
              return (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setEmp(x.id)}
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors ${on ? "border-brand-700 bg-brand-50" : "border-line hover:border-brand-300"}`}
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${on ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700"}`}><Icon name={x.icon} size={20} /></span>
                  <span className="text-sm leading-tight font-semibold">{x.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {(emp === "salaried" || emp === "govt") && (
          <Fieldset key={emp} icon={emp === "govt" ? "Landmark" : "Building"} title={emp === "govt" ? "Your government / PSU job" : "Your job"} sub="Exactly as on your salary slip.">
            <Text label={emp === "govt" ? "Department / organisation" : "Company name"} name="company" defaultValue={e.company} autoComplete="organization" className="sm:col-span-2" />
            {emp === "salaried" && <Select label="Company type" name="companyType" defaultValue={e.companyType} options={["Private limited", "Public limited", "MNC", "Partnership / LLP", "Proprietorship", "Startup"]} />}
            {emp === "govt" && <Select label="Sector" name="sector" defaultValue={e.sector} options={["Central government", "State government", "Defence / police", "PSU", "Public sector bank", "Local body"]} />}
            <Text label="Designation" name="designation" defaultValue={e.designation} autoComplete="organization-title" />
            <Rupees label="Net monthly salary (in hand)" name="monthlySalary" defaultValue={e.monthlySalary} onValue={setIncome} />
            <Select label="Salary received via" name="salaryMode" defaultValue={e.salaryMode} options={["Bank transfer", "Cheque", "Cash"]} />
            <Select label="Salary account bank" name="salaryBank" defaultValue={e.salaryBank} options={[...BANKS, "Other bank"]} />
            <Select label="Total work experience" name="experience" defaultValue={e.experience} options={EXPERIENCE} />
            <Select label="Years in current job" name="currentJobYears" defaultValue={e.currentJobYears} options={EXPERIENCE} />
            <Text label="Office pincode" name="officePincode" defaultValue={e.officePincode} inputMode="numeric" maxLength={6} pattern="[1-9][0-9]{5}" title="6-digit pincode" />
            <Text label="Official email" name="officialEmail" type="email" defaultValue={e.officialEmail} hint="Some lenders verify employment with it." className="sm:col-span-2" />
          </Fieldset>
        )}

        {emp === "business" && (
          <Fieldset key={emp} icon="Store" title="Your business" sub="As per your latest ITR and GST records.">
            <Text label="Business name" name="businessName" defaultValue={e.businessName} autoComplete="organization" className="sm:col-span-2" />
            <Select label="Nature of business" name="nature" defaultValue={e.nature} options={["Trader", "Manufacturer", "Retailer", "Wholesaler", "Service provider", "Other"]} />
            <Select label="Business constitution" name="constitution" defaultValue={e.constitution} options={["Proprietorship", "Partnership", "LLP", "Private limited", "Public limited"]} />
            <Select label="Years in business" name="businessYears" defaultValue={e.businessYears} options={EXPERIENCE} />
            <Select label="GST registered?" name="gst" defaultValue={e.gst} options={["Yes", "No"]} />
            <Rupees label="Annual turnover" name="turnover" defaultValue={e.turnover} />
            <Rupees label="Annual income as per ITR" name="annualIncome" defaultValue={e.annualIncome} onValue={(n) => setIncome(n / 12)} />
            <Select label="ITR filed for" name="itrYears" defaultValue={e.itrYears} options={["Less than 2 years", "2 years", "3+ years"]} />
            <Text label="Business pincode" name="officePincode" defaultValue={e.officePincode} inputMode="numeric" maxLength={6} pattern="[1-9][0-9]{5}" title="6-digit pincode" />
          </Fieldset>
        )}

        {emp === "professional" && (
          <Fieldset key={emp} icon="Stethoscope" title="Your practice" sub="Doctors, CAs, architects and other registered professionals.">
            <Select label="Profession" name="profession" defaultValue={e.profession} options={["Doctor", "Chartered accountant", "Company secretary", "Architect", "Lawyer", "Engineer / consultant", "Other"]} />
            <Text label="Practice / firm name" name="practiceName" defaultValue={e.practiceName} autoComplete="organization" />
            <Text label="Registration number" name="registration" defaultValue={e.registration} hint="Medical council, ICAI, COA, Bar council…" />
            <Select label="Years of practice" name="businessYears" defaultValue={e.businessYears} options={EXPERIENCE} />
            <Rupees label="Annual income as per ITR" name="annualIncome" defaultValue={e.annualIncome} onValue={(n) => setIncome(n / 12)} />
            <Text label="Practice pincode" name="officePincode" defaultValue={e.officePincode} inputMode="numeric" maxLength={6} pattern="[1-9][0-9]{5}" title="6-digit pincode" />
          </Fieldset>
        )}

        {emp === "freelancer" && (
          <Fieldset key={emp} icon="Laptop" title="Your freelance work" sub="Lenders look for steady income over the last 2 years.">
            <Text label="Type of work" name="workType" defaultValue={e.workType} placeholder="Design, development, delivery partner…" className="sm:col-span-2" />
            <Text label="Main clients or platforms" name="clients" defaultValue={e.clients} className="sm:col-span-2" />
            <Select label="Years freelancing" name="businessYears" defaultValue={e.businessYears} options={EXPERIENCE} />
            <Rupees label="Annual income as per ITR" name="annualIncome" defaultValue={e.annualIncome} onValue={(n) => setIncome(n / 12)} />
          </Fieldset>
        )}

        {emp === "retired" && (
          <Fieldset key={emp} icon="Wallet" title="Your pension" sub="Pensioners usually qualify for shorter tenures.">
            <Text label="Former employer" name="company" defaultValue={e.company} autoComplete="organization" className="sm:col-span-2" />
            <Rupees label="Monthly pension" name="monthlyPension" defaultValue={e.monthlyPension} onValue={setIncome} />
            <Select label="Pension received via" name="salaryMode" defaultValue={e.salaryMode} options={["Bank transfer", "Cheque"]} />
            <Select label="Pension account bank" name="salaryBank" defaultValue={e.salaryBank} options={[...BANKS, "Other bank"]} />
          </Fieldset>
        )}

        {group && (
          <Fieldset icon="CreditCard" title="Existing loans & credit cards" sub="Lenders count current EMIs against your income.">
            <Rupees label="Total EMIs you pay each month" name="existingEmi" defaultValue={e.existingEmi} onValue={setEmis} hint="Enter 0 if you have no running loans." />
            <Select label="Credit cards you hold" name="creditCards" defaultValue={e.creditCards} options={["None", "1", "2", "3", "4+"]} />
            <Select label="Any missed EMI in the last 2 years?" name="defaults" defaultValue={e.defaults} options={["No", "Yes"]} className="sm:col-span-2" />
          </Fieldset>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button disabled={!emp} className="btn-primary">Save employment details</button>
          {!emp && <span className="text-sm text-muted">Pick an employment type to continue.</span>}
        </div>
      </div>

      {/* Live summary */}
      <aside className="dash-anim relative overflow-hidden rounded-3xl bg-brand-900 p-6 text-white xl:sticky xl:top-24">
        <div className="grain-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative">
          <p className="font-display text-lg font-bold">What lenders will see</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-brand-200">Profile</dt><dd className="text-right font-semibold">{info?.label ?? "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-brand-200">Monthly income</dt><dd className="font-semibold tabular-nums">{income ? formatINR(income) : "—"}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-brand-200">Existing EMIs</dt><dd className="font-semibold tabular-nums">{formatINR(emis)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-brand-200">EMI room (50% rule)</dt><dd className="font-semibold tabular-nums">{income ? formatINR(Math.max(0, income * 0.5 - emis)) : "—"}</dd></div>
          </dl>
          <div className="mt-5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <p className="text-sm text-brand-100">You could borrow up to</p>
            <p className="mt-1 font-display text-3xl font-bold text-white tabular-nums">{est ? formatShort(est) : "—"}</p>
            <p className="mt-1 text-xs text-brand-200">Home loan estimate at 8.5% for 20 years. Final amount depends on the lender.</p>
          </div>
        </div>
      </aside>
    </form>
  );
}

/* ---------- Page ---------- */

export default function Dashboard() {
  const { user, logout } = useAuth();
  const a = useActivity();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "overview";
  const root = useRef(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [toast, setToast] = useState("");

  const feed = useMemo(() => {
    const ev = [
      ...a.searches.map((s) => ({ ts: s.ts, icon: "Search", text: `Searched ${loanById(s.type).label.toLowerCase()} of ${formatShort(s.amount)}`, to: `/offers${s.query}` })),
      ...a.saved.map((s) => ({ ts: s.ts, icon: "Heart", text: `Saved ${s.name} · ${s.rate.toFixed(2)}%`, to: `/lenders/${s.lenderId}` })),
      ...a.applications.map((s) => ({ ts: s.ts, icon: "FileText", text: `Applied to ${s.name} for ${loanById(s.type).label.toLowerCase()}`, to: "/dashboard?tab=applications" })),
      ...a.compares.map((s) => ({ ts: s.ts, icon: "Scale", text: `Compared ${s.names.join(", ")}` })),
      ...a.credit.map((s) => ({ ts: s.ts, icon: "Gauge", text: "Requested free credit report" })),
      ...a.callbacks.map((s) => ({ ts: s.ts, icon: "PhoneCall", text: "Requested an advisor callback" })),
    ];
    return ev.sort((x, y) => y.ts - x.ts);
  }, [a]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".dash-anim", { y: 20, autoAlpha: 0, duration: 0.6, stagger: 0.04, ease: "expo.out", clearProps: "all" });
      });
      return () => mm.revert();
    },
    { scope: root, dependencies: [tab], revertOnUpdate: true }
  );

  if (!user) return <Navigate to={`/login?next=${encodeURIComponent("/dashboard")}`} replace />;

  const p = a.profile;
  const fullName = p.name || user.name || "";
  const initials = fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const emp = empById(p.emp);
  const e = p.employment ?? {};
  const income = monthlyIncome(e);
  const bestRate = a.searches.length ? Math.min(...a.searches.map((s) => s.bestRate)) : null;
  const last = a.searches[0];
  const emis = Number(e.existingEmi) || 0;
  const room = Math.max(0, income * 0.5 - emis);
  const capacity = BORROW_TYPES.map((id) => {
    const t = loanById(id);
    const n = t.defaultTenure * 12, r = t.from / 1200, f = Math.pow(1 + r, n);
    return { t, amount: Math.min((room * (f - 1)) / (r * f), t.max) };
  });
  const maxCap = Math.max(0, ...capacity.map((c) => c.amount));
  const homeCap = capacity[0].amount;

  const next =
    !p.emp || !income
      ? { icon: "Briefcase", title: "Add your employment details", text: "Unlock your borrowing estimate and offers that fit your profile — takes about a minute.", cta: "Add details", onClick: () => go("employment") }
      : !a.searches.length
        ? { icon: "Search", title: "Run your first loan search", text: `You could borrow up to ${formatShort(homeCap)} for a home loan. See which lenders agree.`, cta: "Search loans", to: `/search?type=home&emp=${p.emp}` }
        : a.saved.length && !a.applications.length
          ? { icon: "FileText", title: `Ready to apply to ${a.saved[0].name}?`, text: `${loanById(a.saved[0].type).label} at ${a.saved[0].rate.toFixed(2)}% · EMI ${formatINR(a.saved[0].emi)} — your top saved offer.`, cta: "View offer", to: `/offers${a.saved[0].query}` }
          : !a.applications.length && last
            ? { icon: "RotateCcw", title: "Pick up where you left off", text: `${loanById(last.type).label} · ${formatShort(last.amount)} for ${last.tenure} yrs — ${last.count} offers, best ${last.bestRate.toFixed(2)}%.`, cta: "View offers", to: `/offers${last.query}` }
            : !a.credit.length
              ? { icon: "Gauge", title: "Check your credit score — free", text: "A score of 750+ usually unlocks the lowest rates. No impact on your score.", cta: "Check score", to: "/credit-score" }
              : { icon: "Headphones", title: "Talk to a loan advisor", text: "Get help comparing offers and preparing your documents.", cta: "Request a callback", to: "/support" };

  const checks = [fullName, p.phone || user.phone, p.email || user.email, p.dob, p.city, p.pincode, p.emp, income];
  const complete = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const first = fullName.split(" ")[0];

  const go = (id) => setParams(id === "overview" ? {} : { tab: id });
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  return (
    <div ref={root} className="min-h-dvh bg-gradient-to-b from-brand-50 to-paper pb-24">
      <div className="container-x pt-8 sm:pt-10">
        {/* Header */}
        <header className="dash-anim relative overflow-hidden rounded-[28px] border border-line bg-white p-5 shadow-[0_24px_50px_-36px_rgb(36_16_82/0.4)] sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-brand-100/70 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-6">
            {/* Identity */}
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 font-display text-2xl font-bold text-white shadow-[0_14px_28px_-14px_rgb(70_32_141/0.9)]">
                {initials || <Icon name="UserRound" size={28} />}
              </span>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold sm:text-4xl">Hi {first || "there"}</h1>
                <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted" aria-label="Account details">
                  <li className="inline-flex items-center gap-1.5 [overflow-wrap:anywhere]"><Icon name={user.phone ? "Phone" : "Mail"} size={14} className="shrink-0 text-brand-500" />{contactLabel(user)}</li>
                  {emp && <li className="inline-flex items-center gap-1.5"><Icon name={emp.icon} size={14} className="text-brand-500" />{emp.label}</li>}
                  {user.since && <li className="inline-flex items-center gap-1.5"><Icon name="CalendarDays" size={14} className="text-brand-500" />Member since {dateFmt.format(user.since)}</li>}
                </ul>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-4 sm:w-auto">
              {/* Completion ring */}
              <div className="flex items-center gap-3">
                <span className="relative grid size-16 shrink-0 place-items-center" role="progressbar" aria-valuenow={complete} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
                  <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle cx="32" cy="32" r="27" fill="none" strokeWidth="6" className="stroke-brand-100" />
                    <circle
                      cx="32" cy="32" r="27" fill="none" strokeWidth="6" strokeLinecap="round"
                      className="stroke-brand-600 transition-[stroke-dashoffset] duration-1000 ease-out-expo"
                      strokeDasharray={2 * Math.PI * 27}
                      strokeDashoffset={2 * Math.PI * 27 * (1 - complete / 100)}
                    />
                  </svg>
                  {complete === 100
                    ? <Icon name="Check" size={22} strokeWidth={3} className="text-brand-700" />
                    : <span className="font-display text-sm font-bold tabular-nums">{complete}%</span>}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{complete === 100 ? "Profile complete" : "Profile"}</p>
                  {complete < 100 ? (
                    <button onClick={() => go(p.emp && income ? "profile" : "employment")} className="mt-0.5 inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                      Finish profile <Icon name="ArrowRight" size={14} />
                    </button>
                  ) : (
                    <p className="mt-0.5 text-xs text-muted">Ready for faster applications</p>
                  )}
                </div>
              </div>

              <span aria-hidden="true" className="hidden h-12 w-px bg-line sm:block" />

              <div className="flex flex-1 gap-2 sm:flex-none">
                <Link to="/search" className="btn-primary min-h-11 flex-1 px-5 text-sm sm:flex-none"><Icon name="Search" size={16} /> New search</Link>
                <Link to="/credit-score" className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 transition-colors hover:bg-brand-50 sm:flex-none"><Icon name="Gauge" size={16} /> Credit score</Link>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[230px_1fr]">
          {/* Nav */}
          <nav aria-label="Dashboard sections" className="lg:sticky lg:top-24 lg:self-start">
            <ul className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1.5 lg:grid">
              {TABS.map((t) => {
                const count = { applications: a.applications.length, saved: a.saved.length, searches: a.searches.length }[t.id];
                const dot = t.id === "employment" && !p.emp;
                return (
                  <li key={t.id} className="shrink-0">
                    <button onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition-colors ${tab === t.id ? "bg-brand-700 text-white" : "hover:bg-brand-50"}`}>
                      <Icon name={t.icon} size={18} />
                      <span className="flex-1 whitespace-nowrap">{t.label}</span>
                      {count > 0 && <span className={`rounded-full px-2 text-xs tabular-nums ${tab === t.id ? "bg-white/20" : "bg-brand-50 text-brand-700"}`}>{count}</span>}
                      {dot && <span className="size-2.5 rounded-full bg-brand-600 ring-4 ring-brand-100" aria-label="needs details" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button onClick={logout} className="mt-3 hidden min-h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-medium text-muted hover:bg-white hover:text-ink lg:flex">
              <Icon name="LogOut" size={18} /> Log out
            </button>
          </nav>

          <div className="min-w-0">
            {tab === "overview" && (
              <div className="grid gap-6">
                {/* Next best step — changes with what the user has done so far */}
                <div className="dash-anim relative flex flex-wrap items-center gap-4 overflow-hidden rounded-3xl border border-brand-200 bg-white p-5 sm:flex-nowrap sm:p-6">
                  <span aria-hidden="true" className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-brand-100 blur-2xl" />
                  <span className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-[0_12px_24px_-12px_rgb(70_32_141/0.8)]">
                    <Icon name={next.icon} size={24} />
                  </span>
                  <div className="relative min-w-0 flex-1 leading-tight">
                    <p className="text-xs font-semibold text-brand-600">Your next step</p>
                    <p className="mt-1 font-display text-xl font-bold">{next.title}</p>
                    <p className="mt-1 text-sm text-muted">{next.text}</p>
                  </div>
                  {next.to ? (
                    <Link to={next.to} className="btn-primary relative min-h-11 w-full shrink-0 text-sm sm:w-auto">{next.cta} <Icon name="ArrowRight" size={16} /></Link>
                  ) : (
                    <button onClick={next.onClick} className="btn-primary relative min-h-11 w-full shrink-0 text-sm sm:w-auto">{next.cta} <Icon name="ArrowRight" size={16} /></button>
                  )}
                </div>

                {/* Stats strip */}
                <dl className="dash-anim grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-4">
                  {[
                    ["FileText", "Applications", a.applications.length, "applications"],
                    ["Heart", "Saved offers", a.saved.length, "saved"],
                    ["History", "Searches", a.searches.length, "searches"],
                    ["Percent", "Best rate seen", bestRate ? `${bestRate.toFixed(2)}%` : "—", null],
                  ].map(([icon, label, value, to]) => (
                    <div key={label} className="bg-white p-5">
                      <dt className="flex items-center gap-1.5 text-sm text-muted"><Icon name={icon} size={15} className="text-brand-500" />{label}</dt>
                      <dd className="mt-1 font-display text-3xl font-bold tabular-nums">
                        {to ? <button onClick={() => go(to)} className="rounded-lg hover:text-brand-700">{value}</button> : value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* What you could borrow */}
                <section className="dash-anim rounded-3xl border border-line bg-white p-5 sm:p-7" aria-labelledby="borrow-title">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 id="borrow-title" className="text-xl font-bold">What you could borrow</h2>
                      <p className="mt-1 text-sm text-muted">Estimated from your income, keeping all EMIs within 50% of it — the rule most lenders use.</p>
                    </div>
                    <button onClick={() => go("employment")} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"><Icon name="Pencil" size={14} /> {income ? "Update income" : "Add income"}</button>
                  </div>

                  {income ? (
                    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      {/* Income split */}
                      <div>
                        <p className="text-sm text-muted">Monthly income</p>
                        <p className="font-display text-4xl font-bold tabular-nums">{formatINR(income)}</p>
                        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-brand-100" role="img" aria-label={`Existing EMIs ${formatINR(emis)}, free EMI room ${formatINR(room)}, rest of income ${formatINR(income - emis - room)}`}>
                          <span className="h-full bg-brand-900 transition-[width] duration-700" style={{ width: `${Math.min(100, (emis / income) * 100)}%` }} />
                          <span className="h-full bg-brand-500 transition-[width] duration-700" style={{ width: `${(room / income) * 100}%` }} />
                        </div>
                        <dl className="mt-4 grid gap-2.5 text-sm">
                          {[
                            ["bg-brand-900", "Existing EMIs", emis],
                            ["bg-brand-500", "Free for a new EMI", room],
                            ["bg-brand-100", "Kept for living costs", Math.max(0, income - emis - room)],
                          ].map(([dot, label, v]) => (
                            <div key={label} className="flex items-center gap-2.5">
                              <span className={`size-3 shrink-0 rounded-sm ${dot}`} />
                              <dt className="flex-1 text-muted">{label}</dt>
                              <dd className="font-semibold tabular-nums">{formatINR(v)}</dd>
                            </div>
                          ))}
                        </dl>
                        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                          <div><dt className="text-xs text-muted">Profile</dt><dd className="font-semibold">{emp?.label ?? "—"}</dd></div>
                          <div><dt className="text-xs text-muted">{e.businessName || e.practiceName ? "Business" : "Employer"}</dt><dd className="font-semibold">{e.company || e.businessName || e.practiceName || "—"}</dd></div>
                        </dl>
                      </div>

                      {/* Per-loan estimates */}
                      <ul className="grid content-start gap-1">
                        {capacity.map(({ t, amount }) => (
                          <li key={t.id}>
                            <Link
                              to={`/search?${new URLSearchParams({ type: t.id, ...(p.emp && { emp: p.emp }), ...(amount >= t.min && { amount: String(Math.round(amount / 1e4) * 1e4) }) })}`}
                              className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-2xl p-3 transition-colors hover:bg-brand-50"
                            >
                              <span className="row-span-2 grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white"><Icon name={t.icon} size={18} /></span>
                              <span className="text-sm font-semibold">{t.label} <span className="font-normal text-muted">· from {t.from}% · {t.defaultTenure} yrs</span></span>
                              <span className="row-span-2 text-right font-display text-lg font-bold tabular-nums">{amount >= t.min ? formatShort(amount) : "—"}</span>
                              <span className="h-1.5 overflow-hidden rounded-full bg-brand-100">
                                <span className="block h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-700 transition-[width] duration-700" style={{ width: `${maxCap ? (amount / maxCap) * 100 : 0}%` }} />
                              </span>
                            </Link>
                          </li>
                        ))}
                        <li className="px-3 pt-2 text-xs text-muted">Tap a loan to search with this amount pre-filled. Final amounts depend on the lender and your credit score.</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-6 grid items-center gap-6 rounded-2xl bg-brand-50 p-6 sm:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-display text-lg font-bold">See your borrowing power in seconds</p>
                        <p className="mt-1 text-sm text-muted">Add your employment and income once — we’ll estimate how much you can borrow for every loan type.</p>
                      </div>
                      <button onClick={() => go("employment")} className="btn-primary min-h-11 text-sm">Add employment details</button>
                    </div>
                  )}
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
                  <section className="dash-anim rounded-3xl border border-line bg-white p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">Latest application</h2>
                      {a.applications.length > 1 && <button onClick={() => go("applications")} className="text-sm font-semibold text-brand-700">View all</button>}
                    </div>
                    {a.applications[0] ? (
                      <ul className="mt-4"><ApplicationCard a={a.applications[0]} /></ul>
                    ) : (
                      <p className="mt-3 text-muted">No applications yet. Tap <strong>Apply Now</strong> on any offer to start one.</p>
                    )}
                  </section>

                  <section className="dash-anim rounded-3xl border border-line bg-white p-5 sm:p-6">
                    <h2 className="text-xl font-bold">Recent activity</h2>
                    {feed.length ? (
                      <ol className="relative mt-4 grid gap-4 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-line">
                        {feed.slice(0, 7).map((ev, i) => {
                          const inner = (
                            <>
                              <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 ring-4 ring-white"><Icon name={ev.icon} size={16} /></span>
                              <span className="min-w-0 leading-tight">
                                <span className="block text-sm font-medium">{ev.text}</span>
                                <span className="text-xs text-muted">{ago(ev.ts)}</span>
                              </span>
                            </>
                          );
                          return <li key={i}>{ev.to ? <Link to={ev.to} className="flex items-center gap-3 hover:text-brand-700">{inner}</Link> : <div className="flex items-center gap-3">{inner}</div>}</li>;
                        })}
                      </ol>
                    ) : (
                      <p className="mt-3 text-muted">Your activity will appear here.</p>
                    )}
                  </section>
                </div>

                {/* Quick actions */}
                <nav aria-label="Quick actions" className="dash-anim grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Calculator", "EMI calculator", "/emi-calculator"],
                    ["Gauge", "Free credit score", "/credit-score"],
                    ["Landmark", "All lenders", "/lenders"],
                    ["Headphones", "Talk to an advisor", "/support"],
                  ].map(([icon, label, to]) => (
                    <Link key={to} to={to} className="group flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 text-sm font-semibold ring-1 ring-line transition-colors hover:ring-brand-300">
                      <Icon name={icon} size={18} className="text-brand-700" />
                      <span className="flex-1">{label}</span>
                      <Icon name="ArrowUpRight" size={16} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-700" />
                    </Link>
                  ))}
                </nav>
              </div>
            )}

            {tab === "applications" && (
              <div>
                <SectionTitle title="Applications" sub="Track every loan you’ve applied for." />
                {a.applications.length ? (
                  <ul className="mt-5 grid gap-4">{a.applications.map((x) => <ApplicationCard key={x.ref} a={x} />)}</ul>
                ) : (
                  <div className="mt-5"><Empty icon="FileText" title="No applications yet" text="Find an offer you like and tap Apply Now — you can track it here." to="/search" cta="Search Loan" /></div>
                )}
              </div>
            )}

            {tab === "saved" && (
              <div>
                <SectionTitle title="Saved offers" sub="Your shortlist across every search." />
                {a.saved.length ? (
                  <ul className="mt-5 grid gap-3">
                    {a.saved.map((s) => (
                      <li key={s.key} className="dash-anim grid gap-4 rounded-3xl border border-line bg-white p-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto] md:items-center">
                        <Link to={`/lenders/${s.lenderId}`} className="flex items-center gap-3">
                          <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-white p-1 ring-1 ring-line"><img src={`/bank-logos/${s.logo}.png`} alt="" className="max-h-full max-w-full object-contain" /></span>
                          <span className="leading-tight"><span className="block font-bold">{s.name}</span><span className="text-sm text-muted">{loanById(s.type).label} · saved {ago(s.ts)}</span></span>
                        </Link>
                        <dl className="grid grid-cols-3 gap-2 text-sm">
                          <div><dt className="text-xs text-muted">Amount</dt><dd className="font-semibold tabular-nums">{formatShort(s.amount)}</dd></div>
                          <div><dt className="text-xs text-muted">Rate</dt><dd className="font-semibold text-brand-700 tabular-nums">{s.rate.toFixed(2)}%</dd></div>
                          <div><dt className="text-xs text-muted">EMI</dt><dd className="font-semibold tabular-nums">{formatINR(s.emi)}</dd></div>
                        </dl>
                        <div className="flex items-center gap-2">
                          <Link to={`/offers${s.query}`} className="btn-primary min-h-10 flex-1 px-4 text-sm md:flex-none">View offer</Link>
                          <button onClick={() => toggleSaved(s)} className="grid size-10 place-items-center rounded-full text-brand-600 hover:bg-brand-50" aria-label={`Remove ${s.name} from saved`}>
                            <Icon name="Heart" size={18} fill="currentColor" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-5"><Empty icon="Heart" title="Nothing saved yet" text="Tap Save on any offer to shortlist it here." to="/search" cta="Browse offers" /></div>
                )}
              </div>
            )}

            {tab === "searches" && (
              <div>
                <SectionTitle title="Search history" sub="Run any past search again in one tap." />
                {a.searches.length ? (
                  <ul className="mt-5 grid gap-3">
                    {a.searches.map((s) => {
                      const t = loanById(s.type);
                      return (
                        <li key={s.query} className="dash-anim flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-white p-4">
                          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name={t.icon} size={20} /></span>
                          <div className="min-w-0 flex-1 leading-tight">
                            <p className="font-semibold">{t.label} · {formatShort(s.amount)} · {s.tenure} yrs</p>
                            <p className="text-sm text-muted">{empById(s.emp)?.label} · {s.pincode} · {s.count} offers · best {s.bestRate.toFixed(2)}% · {ago(s.ts)}</p>
                          </div>
                          <div className="flex gap-1">
                            <Link to={`/offers${s.query}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"><Icon name="RotateCcw" size={16} /> Run again</Link>
                            <button onClick={() => removeSearch(s.query)} className="grid size-10 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-red-700" aria-label="Delete this search"><Icon name="Trash2" size={16} /></button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="mt-5"><Empty icon="History" title="No searches yet" text="Every loan search you run is saved here so you can come back to it." to="/search" cta="Search Loan" /></div>
                )}
              </div>
            )}

            {tab === "requests" && (
              <div className="grid gap-6">
                <SectionTitle title="Requests" sub="Credit reports, callbacks and comparisons." />
                {[
                  ["Gauge", "Credit report requests", a.credit, (r) => `Free credit report for ${r.name}`, "/credit-score", "Get free credit report"],
                  ["PhoneCall", "Advisor callbacks", a.callbacks, (r) => `Callback for ${r.name}`, "/support", "Request a callback"],
                  ["Scale", "Comparisons", a.compares, (r) => `${loanById(r.type).label}: ${r.names.join(" vs ")}`, null, null],
                ].map(([icon, title, list, text, to, cta]) => (
                  <section key={title} className="dash-anim rounded-3xl border border-line bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-lg font-bold"><Icon name={icon} size={20} className="text-brand-700" />{title}</h3>
                      {to && <Link to={to} className="text-sm font-semibold text-brand-700">{cta}</Link>}
                    </div>
                    {list.length ? (
                      <ul className="mt-3 divide-y divide-line">
                        {list.map((r) => (
                          <li key={r.ts} className="flex items-center justify-between gap-3 py-3 text-sm">
                            <span>{text(r)}</span>
                            <span className="shrink-0 text-muted">{ago(r.ts)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-muted">None yet.</p>
                    )}
                  </section>
                ))}
              </div>
            )}

            {tab === "employment" && (
              <div className="grid gap-5">
                <SectionTitle title="Employment details" sub="The same details banks ask for — fill them once, use them for every application." />
                <EmploymentForm key={JSON.stringify(p.employment ?? {}) + (p.emp ?? "")} profile={p} onSaved={flash} />
              </div>
            )}

            {tab === "profile" && (
              <div className="grid gap-5">
                <SectionTitle title="Personal details" sub="Used to pre-fill applications. Never shared without your consent." />
                <form
                  key={JSON.stringify(p)}
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    const f = Object.fromEntries([...new FormData(ev.currentTarget)].map(([k, v]) => [k, String(v).trim()]));
                    if (f.pan) f.pan = f.pan.toUpperCase();
                    updateProfile(f);
                    syncProfile(f);
                    flash("Personal details saved");
                  }}
                  className="grid gap-5"
                >
                  <Fieldset icon="UserRound" title="About you" sub="As on your PAN card.">
                    <Text label="Full name" name="name" defaultValue={fullName} autoComplete="name" required className="sm:col-span-2" />
                    <Text label="Date of birth" name="dob" type="date" defaultValue={p.dob} autoComplete="bday" max={new Date().toISOString().slice(0, 10)} />
                    <Select label="Gender" name="gender" defaultValue={p.gender} options={["Female", "Male", "Other", "Prefer not to say"]} />
                    <Select label="Marital status" name="marital" defaultValue={p.marital} options={["Single", "Married", "Divorced", "Widowed"]} />
                    <Text label="PAN" name="pan" defaultValue={p.pan} autoCapitalize="characters" maxLength={10} pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" title="10-character PAN, like ABCDE1234F" placeholder="ABCDE1234F" hint="Optional — speeds up credit checks." />
                  </Fieldset>

                  <Fieldset icon="Phone" title="Contact" sub="Where lenders and advisors reach you.">
                    {user.phone ? (
                      <Text label="Mobile (verified)" defaultValue={`+91 ${user.phone}`} readOnly className="[&_input]:bg-paper [&_input]:text-muted" />
                    ) : (
                      <Text label="Mobile number" name="phone" type="tel" inputMode="numeric" defaultValue={p.phone} maxLength={10} pattern="[6-9][0-9]{9}" title="10-digit mobile number" autoComplete="tel-national" />
                    )}
                    {user.email ? (
                      <Text label="Email (verified)" defaultValue={user.email} readOnly className="[&_input]:bg-paper [&_input]:text-muted" />
                    ) : (
                      <Text label="Email" name="email" type="email" defaultValue={p.email} autoComplete="email" />
                    )}
                    <Select label="Get updates on WhatsApp" name="whatsappPref" defaultValue={p.whatsappPref ?? (p.whatsapp === false ? "No" : "Yes")} options={["Yes", "No"]} />
                  </Fieldset>

                  <Fieldset icon="House" title="Where you live" sub="Lenders serve specific cities and pincodes.">
                    <Text label="Current address" name="address" defaultValue={p.address} autoComplete="street-address" className="sm:col-span-2" />
                    <Text label="City" name="city" defaultValue={p.city} autoComplete="address-level2" />
                    <Text label="Pincode" name="pincode" defaultValue={p.pincode} inputMode="numeric" maxLength={6} pattern="[1-9][0-9]{5}" title="6-digit pincode" autoComplete="postal-code" />
                    <Select label="Residence type" name="residence" defaultValue={p.residence} options={["Owned by self / spouse", "Owned by parents", "Rented", "Company provided", "PG / hostel"]} />
                    <Select label="Living here for" name="residenceYears" defaultValue={p.residenceYears} options={["Less than 1 year", "1–3 years", "3–5 years", "5+ years"]} />
                  </Fieldset>

                  <div><button className="btn-primary">Save personal details</button></div>
                </form>

                <div className="dash-anim rounded-3xl border border-red-200 bg-white p-6">
                  <h3 className="font-bold">Privacy</h3>
                  <p className="mt-1 text-sm text-muted">Clear your searches, saved offers and activity from this device. Applications already submitted to lenders aren’t affected.</p>
                  {confirmClear ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">Clear all activity?</span>
                      <button onClick={() => { clearActivity(); setConfirmClear(false); }} className="inline-flex min-h-10 items-center rounded-xl bg-red-700 px-4 text-sm font-semibold text-white">Yes, clear</button>
                      <button onClick={() => setConfirmClear(false)} className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm font-semibold">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmClear(true)} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50"><Icon name="Trash2" size={16} /> Clear activity</button>
                  )}
                </div>
                <button onClick={logout} className="inline-flex min-h-11 items-center gap-2 justify-self-start rounded-xl px-2 font-medium text-muted hover:text-ink lg:hidden"><Icon name="LogOut" size={18} /> Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div role="status" aria-live="polite" className={`fixed bottom-6 left-1/2 z-50 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-xl transition-[opacity,transform] duration-300 ${toast ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>
        <Icon name="CircleCheck" size={16} className="text-green-400" /> {toast}
      </div>
    </div>
  );
}
