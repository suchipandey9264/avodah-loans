import { useDeferredValue, useMemo, useState } from "react";
import { LENDER_KINDS } from "../lib/loans";
import Dialog from "./Dialog";
import { Icon } from "./ui";

export const RATE_STOPS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16]; // 16 = any rate
const QUICK_RATES = [16, 8, 9, 10, 12];
export const NO_FILTERS = { maxRate: 16, kinds: [], lenders: [] };

export const applyFilters = (offers, f) =>
  offers.filter((o) => (f.maxRate >= 16 || o.rate <= f.maxRate) && (!f.kinds.length || f.kinds.includes(o.kind)) && (!f.lenders.length || f.lenders.includes(o.id)));

export const filterCount = (f) => (f.maxRate < 16 ? 1 : 0) + f.kinds.length + f.lenders.length;

function Section({ title, active, onClear, children }) {
  return (
    <section className="border-b border-line py-5 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-sans text-sm font-bold tracking-normal">{title}</h3>
        {active && <button type="button" onClick={onClear} className="min-h-8 rounded-lg px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50">Clear</button>}
      </div>
      {children}
    </section>
  );
}

/** Checkbox row. Children wrap freely so long lender names are never cut off. */
function CheckRow({ checked, onChange, children, aside }) {
  return (
    <label className={`group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${checked ? "bg-brand-50" : "hover:bg-paper"}`}>
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="grid size-5 shrink-0 place-items-center rounded-md border-2 border-line bg-white text-white transition-colors group-hover:border-brand-300 peer-checked:border-brand-700 peer-checked:bg-brand-700 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100">
        {checked && <Icon name="Check" size={12} strokeWidth={3.5} />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
      {aside}
    </label>
  );
}

/** The filter controls. Used live in the desktop sidebar and inside the mobile sheet. */
export function FilterPanel({ offers, value, onChange }) {
  const [q, setQ] = useState("");
  const query = useDeferredValue(q.trim().toLowerCase());

  const lenders = useMemo(
    () => [...new Map(offers.map((o) => [o.id, o])).values()].sort((a, b) => a.name.localeCompare(b.name)),
    [offers]
  );
  const kindCounts = useMemo(() => Object.fromEntries(LENDER_KINDS.map((k) => [k.id, offers.filter((o) => o.kind === k.id).length])), [offers]);
  const rateCounts = useMemo(() => Object.fromEntries(QUICK_RATES.map((r) => [r, r >= 16 ? offers.length : offers.filter((o) => o.rate <= r).length])), [offers]);
  const shown = useMemo(
    () => (query ? lenders.filter((l) => l.name.toLowerCase().includes(query) || l.fullName?.toLowerCase().includes(query)) : lenders),
    [lenders, query]
  );

  const set = (patch) => onChange({ ...value, ...patch });
  const toggle = (k, v) => set({ [k]: value[k].includes(v) ? value[k].filter((x) => x !== v) : [...value[k], v] });
  const idx = RATE_STOPS.indexOf(value.maxRate);
  const allShownOn = shown.length > 0 && shown.every((l) => value.lenders.includes(l.id));

  return (
    <div>
      <Section title="Rate of interest" active={value.maxRate < 16} onClear={() => set({ maxRate: 16 })}>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Maximum rate of interest">
          {QUICK_RATES.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={value.maxRate === r}
              onClick={() => set({ maxRate: r })}
              disabled={!rateCounts[r]}
              className="chip min-h-9 gap-1 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              {r >= 16 ? "Any rate" : `Up to ${r}%`}
              <span className="tabular-nums opacity-70">{rateCounts[r]}</span>
            </button>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={RATE_STOPS.length - 1}
          step={1}
          value={idx}
          onChange={(e) => set({ maxRate: RATE_STOPS[Number(e.target.value)] })}
          aria-label="Fine-tune maximum rate"
          aria-valuetext={value.maxRate >= 16 ? "Any rate" : `Up to ${value.maxRate}%`}
          className="emi-range mt-5 w-full"
          style={{ "--pct": `${(idx / (RATE_STOPS.length - 1)) * 100}%` }}
        />
        <div className="mt-2 flex justify-between text-[11px] text-muted tabular-nums" aria-hidden="true">
          <span>7%</span><span>10%</span><span>13%</span><span>Any</span>
        </div>
      </Section>

      <Section title="Lender type" active={value.kinds.length > 0} onClear={() => set({ kinds: [] })}>
        <div className="grid gap-0.5">
          {LENDER_KINDS.map((k) => (
            <CheckRow key={k.id} checked={value.kinds.includes(k.id)} onChange={() => toggle("kinds", k.id)} aside={<span className="text-xs text-muted tabular-nums">{kindCounts[k.id]}</span>}>
              <span className="block text-sm font-semibold">{k.id}</span>
              <span className="block text-xs text-muted">{k.long}</span>
            </CheckRow>
          ))}
        </div>
      </Section>

      <Section title={`Lenders${value.lenders.length ? ` · ${value.lenders.length} selected` : ""}`} active={value.lenders.length > 0} onClear={() => set({ lenders: [] })}>
        <div className="relative">
          <Icon name="Search" size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by bank or NBFC name" aria-label="Search lenders" className="field min-h-11 pl-9 text-sm" />
        </div>
        {shown.length > 0 && (
          <button
            type="button"
            onClick={() => set({ lenders: allShownOn ? value.lenders.filter((id) => !shown.some((l) => l.id === id)) : [...new Set([...value.lenders, ...shown.map((l) => l.id)])] })}
            className="mt-2 min-h-9 rounded-lg px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50"
          >
            {allShownOn ? "Unselect" : "Select"} all {query ? `${shown.length} matching` : shown.length}
          </button>
        )}
        <ul className="mt-1 grid gap-0.5">
          {shown.map((l) => (
            <li key={l.id}>
              <CheckRow
                checked={value.lenders.includes(l.id)}
                onChange={() => toggle("lenders", l.id)}
                aside={<span className="shrink-0 rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700 tabular-nums">{l.rate.toFixed(2)}%</span>}
              >
                <span className="flex items-center gap-2.5">
                  <img src={`/bank-logos/${l.logo}.png`} alt="" loading="lazy" className="h-7 w-10 shrink-0 rounded bg-white object-contain" />
                  <span className="min-w-0 leading-tight">
                    <span className="block text-sm font-semibold">{l.name}</span>
                    {l.fullName && l.fullName !== l.name && <span className="mt-0.5 block text-[11px] text-muted">{l.fullName}</span>}
                  </span>
                </span>
              </CheckRow>
            </li>
          ))}
        </ul>
        {!shown.length && <p className="p-3 text-sm text-muted">No lender matches “{q}”.</p>}
      </Section>
    </div>
  );
}

/** Mobile / tablet bottom sheet: edits a draft, applied on confirm. */
export default function FilterSheet({ open, onClose, offers, value, onApply }) {
  const [draft, setDraft] = useState(value);

  // Reset the draft each time the sheet opens.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setDraft(value);
  }

  const result = useMemo(() => applyFilters(offers, draft).length, [offers, draft]);

  return (
    <Dialog open={open} onClose={onClose} labelledBy="filters-title" variant="sheet">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id="filters-title" className="text-xl font-bold">Filters</h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setDraft(NO_FILTERS)} disabled={!filterCount(draft)} className="min-h-11 rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-40">Clear all</button>
            <button onClick={onClose} className="grid size-11 place-items-center rounded-xl hover:bg-brand-50" aria-label="Close filters"><Icon name="X" size={20} /></button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
          <FilterPanel offers={offers} value={draft} onChange={setDraft} />
        </div>
        <div className="border-t border-line p-4">
          <button onClick={() => onApply(draft)} disabled={!result} className="btn-primary w-full">
            {result ? `Show ${result} offer${result > 1 ? "s" : ""}` : "No offers match"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
