import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { EMPLOYMENT, getOffers, loanById } from "../lib/loans";
import { emi as emiFn, formatINR, formatShort } from "../lib/emi";
import { useAuth } from "../lib/auth";
import { addApplication, logCompare, logSearch, toggleSaved, useActivity } from "../lib/activity";
import { gsap, useGSAP, MOTION_OK, prefersReducedMotion } from "../lib/motion";
import Dialog from "../components/Dialog";
import FilterSheet, { FilterPanel, applyFilters, filterCount, NO_FILTERS } from "../components/FilterSheet";
import { Icon } from "../components/ui";

const SORTS = [
  { id: "rate", label: "Rate of interest" },
  { id: "emi", label: "Lowest EMI" },
  { id: "amount", label: "Highest loan amount" },
];

/* ---------- Matching animation ---------- */
function Matching({ count, logos, onDone }) {
  const root = useRef(null);
  useGSAP(
    () => {
      const fast = prefersReducedMotion();
      const tl = gsap.timeline({ onComplete: onDone });
      tl.to(".match-bar", { scaleX: 1, duration: fast ? 0.3 : 2.2, ease: "power1.inOut" });
      if (!fast) {
        tl.from(".match-step", { x: -20, autoAlpha: 0, stagger: 0.55, duration: 0.4, ease: "power3.out" }, 0);
        gsap.to(".match-orbit", { rotate: 360, duration: 8, ease: "none", repeat: -1 });
        gsap.to(".match-orbit img", { rotate: -360, duration: 8, ease: "none", repeat: -1 });
        gsap.from(".match-core", { scale: 0.6, autoAlpha: 0, duration: 0.8, ease: "back.out(2)" });
      }
    },
    { scope: root }
  );

  return (
    <div ref={root} role="status" aria-live="polite" className="flex min-h-[70dvh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative size-60">
        <div className="match-orbit absolute inset-0 rounded-full border-2 border-dashed border-brand-200">
          {logos.slice(0, 8).map((l, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <img key={l} src={`/bank-logos/${l}.png`} alt="" className="absolute size-11 rounded-full border border-line bg-white object-contain p-1.5 shadow" style={{ left: `calc(50% + ${Math.cos(a) * 120}px - 22px)`, top: `calc(50% + ${Math.sin(a) * 120}px - 22px)` }} />;
          })}
        </div>
        <div className="match-core absolute inset-12 grid place-items-center rounded-full bg-brand-700 text-white shadow-[0_0_0_12px_rgb(70_32_141/0.12)]">
          <Icon name="Search" size={44} />
        </div>
      </div>
      <h1 className="mt-10 text-2xl font-bold sm:text-3xl">Finding the best offers for you…</h1>
      <div className="mt-6 h-2 w-full max-w-sm overflow-hidden rounded-full bg-brand-100">
        <div className="match-bar h-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-brand-600 to-flame-500" />
      </div>
      <ul className="mt-6 grid gap-2 text-left text-sm text-muted">
        {[`Checking ${count} lenders`, "Matching your profile & pincode", "Calculating EMIs and eligibility"].map((s) => (
          <li key={s} className="match-step flex items-center gap-2"><Icon name="CircleCheck" size={16} className="text-success" />{s}</li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Offer card (one lender per row) ---------- */
function Stat({ label, children, note, accent }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 font-display text-lg font-bold tabular-nums sm:text-xl ${accent ? "text-brand-700" : ""}`}>{children}</dd>
      {note && <dd className="text-[11px] text-amber-800">{note}</dd>}
    </div>
  );
}

function OfferCard({ o, best, saved, onSave, compared, onCompare, compareDisabled, onApply }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`offer-card relative rounded-3xl border bg-white transition-[box-shadow,border-color] hover:shadow-[0_24px_50px_-30px_rgb(36_16_82/0.45)] ${best ? "border-flame-400" : "border-line hover:border-brand-200"}`}>
      {best && (
        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-flame-400 px-3 py-1 text-xs font-bold text-ink">
          <Icon name="Star" size={12} fill="currentColor" /> Lowest rate
        </span>
      )}

      <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_auto] md:items-center md:gap-6">
        {/* Lender */}
        <div className="flex items-start gap-3">
          <Link to={`/lenders/${o.id}`} tabIndex={-1} aria-hidden="true" className="grid h-14 w-20 shrink-0 place-items-center rounded-xl bg-white p-1.5 ring-1 ring-line">
            <img src={`/bank-logos/${o.logo}.png`} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
          </Link>
          <div className="min-w-0 leading-tight">
            <h3 className="font-sans text-base font-bold tracking-normal">
              <Link to={`/lenders/${o.id}`} className="hover:text-brand-700 hover:underline">{o.name}</Link>
            </h3>
            {o.fullName && o.fullName !== o.name && <p className="mt-0.5 text-xs text-muted">{o.fullName}</p>}
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-paper px-1.5 py-0.5 text-[11px] font-semibold text-muted ring-1 ring-line">{o.kind}</span>
              {o.eligible ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-semibold text-success ring-1 ring-green-200"><Icon name="CircleCheck" size={12} /> High approval chance</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200"><Icon name="TriangleAlert" size={12} /> EMI above 50% of income</span>
              )}
            </p>
          </div>
        </div>

        {/* Numbers */}
        <dl className="grid grid-cols-3 gap-3 rounded-2xl bg-brand-50/60 p-4 md:bg-transparent md:p-0">
          <Stat label="Loan amount" note={o.cappedAmount && "Max for this lender"}>{formatShort(o.loanAmount)}</Stat>
          <Stat label="ROI from" accent>{o.rate.toFixed(2)}%</Stat>
          <Stat label="Monthly EMI">{formatINR(o.emi)}</Stat>
        </dl>

        {/* Actions */}
        <div className="flex items-center gap-2 md:flex-col md:items-stretch">
          <button onClick={() => onApply(o)} className="btn-primary min-h-11 flex-1 px-6 text-sm md:flex-none">Apply Now</button>
          <button onClick={() => onSave(o)} aria-pressed={saved} aria-label={saved ? `Remove ${o.name} from saved offers` : `Save ${o.name} offer`} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors ${saved ? "bg-flame-50 text-flame-600" : "text-muted ring-1 ring-line hover:bg-brand-50 hover:text-brand-700"}`}>
            <Icon name="Heart" size={16} fill={saved ? "currentColor" : "none"} /> <span className="hidden md:inline">{saved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      <div className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden" inert={!open}>
          <div id={`d-${o.id}`} className="mx-5 border-t border-line pt-4 pb-1 sm:mx-6">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[["Processing fee", o.fee], ["Max loan amount", formatShort(o.maxAmount)], ["Max tenure", `${o.maxTenure} years`], ["Total interest", formatShort(o.emi * o.tenureMonths - o.loanAmount)]].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Key features">
              {o.features.map((f) => <li key={f} className="inline-flex items-center gap-1 rounded-lg bg-paper px-2.5 py-1 text-xs font-medium ring-1 ring-line"><Icon name="Check" size={12} className="text-success" />{f}</li>)}
            </ul>
            <Link to={`/lenders/${o.id}`} className="mt-2 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-700">
              View full {o.name} page <Icon name="ArrowRight" size={14} />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-1.5 sm:px-4">
        <label className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium ${compareDisabled && !compared ? "opacity-50" : "cursor-pointer"}`}>
          <input type="checkbox" checked={compared} disabled={compareDisabled && !compared} onChange={() => onCompare(o.id)} className="size-5 rounded accent-brand-700" />
          Add to compare
        </label>
        <span className="hidden text-xs text-muted sm:block">Processing fee {o.fee}</span>
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={`d-${o.id}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-brand-700">
          {open ? "Hide" : "Show"} details <Icon name="ChevronDown" size={16} className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
    </li>
  );
}

/* ---------- Page ---------- */
export default function Offers() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const activity = useActivity();

  const type = loanById(params.get("type"));
  const emp = params.get("emp");
  const amount = Number(params.get("amount"));
  const tenure = Number(params.get("tenure"));
  const annualIncome = Number(params.get("income"));
  const pincode = params.get("pincode");
  const valid = params.get("type") && emp && amount && tenure && annualIncome && pincode;

  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("rate");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [compare, setCompare] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [applied, setApplied] = useState(null);
  const [toast, setToast] = useState("");
  const listRef = useRef(null);

  const all = useMemo(
    () => (valid ? getOffers({ type: type.id, amount, tenure, annualIncome }, emiFn).map((o) => ({ ...o, tenureMonths: tenure * 12 })) : []),
    [valid, type.id, amount, tenure, annualIncome]
  );
  const minRate = Math.min(...all.map((o) => o.rate));

  const offers = useMemo(() => {
    const list = applyFilters(all, filters).filter((o) => !onlyEligible || o.eligible);
    const by = { rate: (a, b) => a.rate - b.rate, emi: (a, b) => a.emi - b.emi, amount: (a, b) => b.maxAmount - a.maxAmount || a.rate - b.rate };
    return [...list].sort(by[sort]);
  }, [all, filters, onlyEligible, sort]);

  // Record the search for the dashboard once results are shown.
  useEffect(() => {
    if (!valid || loading) return;
    logSearch({ query: location.search, type: type.id, emp, amount, tenure, income: annualIncome, pincode, count: all.length, bestRate: minRate });
  }, [valid, loading, location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useGSAP(
    () => {
      if (loading) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".offer-card", { y: 30, autoAlpha: 0, duration: 0.6, stagger: 0.05, ease: "power3.out", clearProps: "all" });
      });
      return () => mm.revert();
    },
    { scope: listRef, dependencies: [loading, sort, JSON.stringify(filters), onlyEligible], revertOnUpdate: true }
  );

  if (!valid) return <Navigate to="/search" replace />;

  const empLabel = EMPLOYMENT.find((e) => e.id === emp)?.label;
  const editHref = `/search?${new URLSearchParams({ type: type.id, emp, amount, tenure, income: annualIncome, pincode })}`;
  const toggleCompare = (id) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));
  const clearAll = () => { setFilters(NO_FILTERS); setOnlyEligible(false); setSort("rate"); };
  const compared = all.filter((o) => compare.includes(o.id));
  const nFilters = filterCount(filters);
  const savedKey = (o) => `${type.id}:${o.id}`;

  const snapshot = (o) => ({ key: savedKey(o), lenderId: o.id, name: o.name, logo: o.logo, kind: o.kind, type: type.id, rate: o.rate, emi: o.emi, amount: o.loanAmount, tenure, query: location.search });

  const save = (o) => {
    const added = toggleSaved(snapshot(o));
    setToast(added ? `${o.name} saved to your dashboard` : `${o.name} removed from saved`);
  };

  const apply = (o) => {
    if (!user) return navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    const ref = "AV" + Date.now().toString().slice(-7);
    addApplication({ ...snapshot(o), ref, emp, pincode, status: "submitted" });
    setApplied({ ...o, ref });
  };

  const openCompare = () => {
    logCompare(compared.map((o) => o.name), type.id);
    setCompareOpen(true);
  };

  if (loading) return <Matching count={all.length} logos={all.map((o) => o.logo)} onDone={() => setLoading(false)} />;

  return (
    <div className="min-h-dvh bg-paper pb-32">
      {/* Summary bar */}
      <div className="sticky top-[72px] z-30 border-b border-line bg-brand-50/95 backdrop-blur">
        <div className="container-x flex items-center justify-between gap-4 py-3">
          <dl className="no-scrollbar flex gap-6 overflow-x-auto text-sm">
            <div className="shrink-0"><dt className="text-xs text-muted">You need a loan of</dt><dd className="font-display text-lg font-bold">{formatShort(amount)}</dd></div>
            <div className="shrink-0 border-l border-brand-200 pl-6"><dt className="text-xs text-muted">Tenure</dt><dd className="font-display text-lg font-bold">{tenure} yrs</dd></div>
            <div className="hidden shrink-0 border-l border-brand-200 pl-6 sm:block"><dt className="text-xs text-muted">Loan type</dt><dd className="font-semibold">{type.label}</dd></div>
            <div className="hidden shrink-0 border-l border-brand-200 pl-6 md:block"><dt className="text-xs text-muted">Profile</dt><dd className="font-semibold">{empLabel}</dd></div>
            <div className="hidden shrink-0 border-l border-brand-200 pl-6 lg:block"><dt className="text-xs text-muted">Pincode</dt><dd className="font-semibold tabular-nums">{pincode}</dd></div>
          </dl>
          <Link to={editHref} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 font-semibold text-brand-700 hover:bg-white">
            <Icon name="Pencil" size={16} /> Edit
          </Link>
        </div>
      </div>

      <div className="container-x grid gap-8 pt-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Desktop filters — applied live */}
        <aside aria-label="Filters" className="hidden lg:block">
          <div data-lenis-prevent className="sticky top-[160px] max-h-[calc(100dvh-180px)] overflow-y-auto overscroll-contain rounded-3xl border border-line bg-white px-5">
            <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between border-b border-line bg-white px-5 py-3">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Icon name="SlidersHorizontal" size={18} className="text-brand-700" /> Filters</h2>
              <span className="text-xs text-muted tabular-nums">{offers.length} of {all.length} offers</span>
            </div>
            <FilterPanel offers={all} value={filters} onChange={setFilters} />
          </div>
        </aside>

        <div className="min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setSheetOpen(true)} aria-haspopup="dialog" className={`chip lg:hidden ${nFilters ? "border-brand-700 text-brand-700" : ""}`}>
            <Icon name="SlidersHorizontal" size={16} /> Filters
            {nFilters > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand-700 text-[10px] font-bold text-white">{nFilters}</span>}
          </button>
          <label className="chip relative pr-9">
            <Icon name="ArrowUpDown" size={16} />
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none bg-transparent font-medium outline-none">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <Icon name="ChevronDown" size={16} className="pointer-events-none absolute right-3" />
          </label>
          <button aria-pressed={onlyEligible} onClick={() => setOnlyEligible((v) => !v)} className="chip">
            <Icon name="CircleCheck" size={16} /> Likely eligible
          </button>
          <button onClick={clearAll} className="ml-auto min-h-10 px-2 text-sm font-semibold text-brand-700 sm:border-l sm:border-line sm:pl-4">Clear All</button>
        </div>

        {nFilters > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Active filters">
            {filters.maxRate < 16 && (
              <li><button onClick={() => setFilters((f) => ({ ...f, maxRate: 16 }))} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-brand-100 px-3 text-xs font-semibold text-brand-800">Rate ≤ {filters.maxRate}% <Icon name="X" size={12} /><span className="sr-only">remove</span></button></li>
            )}
            {filters.kinds.map((k) => (
              <li key={k}><button onClick={() => setFilters((f) => ({ ...f, kinds: f.kinds.filter((x) => x !== k) }))} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-brand-100 px-3 text-xs font-semibold text-brand-800">{k} <Icon name="X" size={12} /><span className="sr-only">remove</span></button></li>
            ))}
            {filters.lenders.map((id) => (
              <li key={id}><button onClick={() => setFilters((f) => ({ ...f, lenders: f.lenders.filter((x) => x !== id) }))} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-brand-100 px-3 text-xs font-semibold text-brand-800">{all.find((o) => o.id === id)?.name} <Icon name="X" size={12} /><span className="sr-only">remove</span></button></li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {offers.length} {type.label} Offers
            <span className="mt-1 block h-1 w-12 rounded-full bg-flame-400" />
          </h1>
          <p className="text-xs text-muted">Indicative rates · final rate subject to lender assessment</p>
        </div>

        {offers.length ? (
          <ul ref={listRef} className="mt-6 grid gap-5">
            {offers.map((o) => (
              <OfferCard
                key={o.id}
                o={o}
                best={o.rate === minRate}
                saved={activity.saved.some((s) => s.key === savedKey(o))}
                onSave={save}
                compared={compare.includes(o.id)}
                compareDisabled={compare.length >= 3}
                onCompare={toggleCompare}
                onApply={apply}
              />
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-brand-200 bg-white p-10 text-center">
            <p className="font-display text-xl font-bold">No offers match these filters</p>
            <p className="mt-1 text-muted">Try removing a filter, or lower the loan amount.</p>
            <button onClick={clearAll} className="btn-primary mt-5">Clear filters</button>
          </div>
        )}
        </div>
      </div>

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} offers={all} value={filters} onApply={(f) => { setFilters(f); setSheetOpen(false); }} />

      {/* Compare tray */}
      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 shadow-[0_-20px_40px_-20px_rgb(36_16_82/0.3)] backdrop-blur">
          <div className="container-x flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-2">
              {compared.map((o) => (
                <button key={o.id} onClick={() => toggleCompare(o.id)} className="group relative" aria-label={`Remove ${o.name} from compare`}>
                  <img src={`/bank-logos/${o.logo}.png`} alt="" className="h-11 w-16 rounded-lg border border-line bg-white object-contain p-1" />
                  <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-ink text-white"><Icon name="X" size={12} /></span>
                </button>
              ))}
              <span className="hidden text-sm text-muted sm:block">{compare.length}/3 selected</span>
            </div>
            <button disabled={compare.length < 2} onClick={openCompare} className="btn-primary min-h-11 text-sm">
              Compare {compare.length > 1 ? `(${compare.length})` : "— pick 2+"}
            </button>
          </div>
        </div>
      )}

      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} labelledBy="cmp-title" wide>
        <div className="max-h-[85dvh] overflow-auto p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 id="cmp-title" className="text-2xl font-bold">Compare offers</h2>
            <button onClick={() => setCompareOpen(false)} className="grid size-11 place-items-center rounded-xl hover:bg-brand-50" aria-label="Close comparison"><Icon name="X" size={20} /></button>
          </div>
          <table className="mt-6 w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className="w-40 pb-4 font-medium text-muted">Lender</th>
                {compared.map((o) => (
                  <th key={o.id} scope="col" className="pb-4">
                    <img src={`/bank-logos/${o.logo}.png`} alt="" className="h-10 w-20 object-contain" />
                    <span className="mt-1 block font-semibold">{o.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[
                ["Interest rate", (o) => `${o.rate.toFixed(2)}%`, (o) => o.rate === Math.min(...compared.map((c) => c.rate))],
                ["Monthly EMI", (o) => formatINR(o.emi), (o) => o.emi === Math.min(...compared.map((c) => c.emi))],
                ["Total interest", (o) => formatShort(o.emi * o.tenureMonths - o.loanAmount)],
                ["Loan amount", (o) => formatShort(o.loanAmount)],
                ["Max loan amount", (o) => formatShort(o.maxAmount)],
                ["Lender type", (o) => o.kind],
                ["Processing fee", (o) => o.fee],
                ["Eligibility", (o) => (o.eligible ? "High approval chance" : "EMI above 50% of income")],
              ].map(([label, get, isBest]) => (
                <tr key={label}>
                  <th scope="row" className="py-3 font-medium text-muted">{label}</th>
                  {compared.map((o) => (
                    <td key={o.id} className={`py-3 font-semibold tabular-nums ${isBest?.(o) ? "text-success" : ""}`}>
                      {get(o)} {isBest?.(o) && <span className="ml-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold uppercase">Best</span>}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {compared.map((o) => (
                  <td key={o.id} className="pt-4"><button onClick={() => { setCompareOpen(false); apply(o); }} className="btn-primary min-h-11 px-4 text-sm">Apply</button></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Dialog>

      <Dialog open={!!applied} onClose={() => setApplied(null)} labelledBy="ok-title">
        {applied && (
          <div className="p-8 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-success"><Icon name="Check" size={32} strokeWidth={2.5} /></span>
            <h2 id="ok-title" className="mt-5 text-2xl font-bold">Application started!</h2>
            <p className="mt-2 text-muted">
              Your {type.label.toLowerCase()} request with <strong className="text-ink">{applied.name}</strong> is in. A loan advisor will call you to complete the documents.
            </p>
            <p className="mt-4 rounded-xl bg-brand-50 px-4 py-2 text-sm">Reference ID: <span className="font-bold tabular-nums">{applied.ref}</span></p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button onClick={() => setApplied(null)} className="btn-ghost border-line">Keep browsing</button>
              <Link to="/dashboard?tab=applications" className="btn-primary">Track it</Link>
            </div>
          </div>
        )}
      </Dialog>

      <div role="status" aria-live="polite" className={`fixed left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-xl transition-[opacity,transform] duration-300 ${compare.length ? "bottom-24" : "bottom-6"} ${toast ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}>
        {toast}
      </div>
    </div>
  );
}
