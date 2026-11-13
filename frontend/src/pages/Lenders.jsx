import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LENDERS, LENDER_KINDS, loanById } from "../lib/loans";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon } from "../components/ui";

export default function Lenders() {
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const grid = useRef(null);

  const list = useMemo(
    () => LENDERS.filter((l) => (kind === "all" || l.kind === kind) && l.name.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => a.lowestRate - b.lowestRate),
    [kind, q]
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(".lender-tile", { y: 24, autoAlpha: 0, duration: 0.5, stagger: { each: 0.025, grid: "auto" }, ease: "power3.out", clearProps: "all" });
      });
      return () => mm.revert();
    },
    { scope: grid, dependencies: [kind, q], revertOnUpdate: true }
  );

  return (
    <div className="bg-gradient-to-b from-brand-50 to-paper pb-24">
      <section className="container-x pt-12 sm:pt-16">
        <p className="eyebrow" data-reveal>{LENDERS.length} lending partners</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[1.02] font-extrabold sm:text-6xl" data-reveal>
          Every bank & lender, <span className="text-brand-700">one page each.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted" data-reveal>Open any lender to see its rates across loan types, eligibility, documents and an EMI estimate.</p>

        <div className="mt-10 flex flex-wrap items-center gap-2" data-reveal>
          <div className="relative w-full sm:w-72">
            <Icon name="Search" size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a bank or NBFC" aria-label="Search lenders" className="field pl-11" />
          </div>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {[{ id: "all" }, ...LENDER_KINDS].map((k) => (
              <button key={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)} className="chip shrink-0">
                {k.id === "all" ? "All" : k.id} <span className="text-xs opacity-70">{k.id === "all" ? LENDERS.length : LENDERS.filter((l) => l.kind === k.id).length}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x mt-8">
        <p className="mb-4 text-sm text-muted" aria-live="polite">{list.length} lender{list.length === 1 ? "" : "s"} · sorted by lowest starting rate</p>
        <ul ref={grid} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((l) => (
            <li key={l.id} className="lender-tile">
              <Link to={`/lenders/${l.id}`} className="group flex h-full flex-col rounded-3xl border border-line bg-white p-5 transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-[0_20px_40px_-25px_rgb(36_16_82/0.5)]">
                <div className="flex items-start justify-between">
                  <img src={`/bank-logos/${l.logo}.png`} alt="" loading="lazy" className="h-12 w-24 object-contain object-left" />
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">{l.kind}</span>
                </div>
                <h2 className="mt-4 font-sans text-base font-bold tracking-normal group-hover:text-brand-700">{l.name}</h2>
                <p className="mt-1 text-sm text-muted">Rates from <strong className="text-ink tabular-nums">{l.lowestRate.toFixed(2)}%</strong> p.a.</p>
                <div className="mt-auto flex items-center justify-between pt-5">
                  <ul className="flex -space-x-1" aria-label={`${l.products.length} loan types`}>
                    {l.products.map((p) => (
                      <li key={p.type} title={loanById(p.type).label} className="grid size-8 place-items-center rounded-full border-2 border-white bg-brand-100 text-brand-700">
                        <Icon name={loanById(p.type).icon} size={14} />
                        <span className="sr-only">{loanById(p.type).label}</span>
                      </li>
                    ))}
                  </ul>
                  <Icon name="ArrowRight" size={18} className="text-brand-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-700" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {!list.length && <p className="rounded-3xl border border-dashed border-brand-200 bg-white p-10 text-center text-muted">No lender matches “{q}”.</p>}
      </section>
    </div>
  );
}
