import { Link } from "react-router-dom";
import { LOAN_TYPES } from "../lib/loans";
import { Icon, SectionHeading } from "./ui";

export function LoanProducts() {
  return (
    <section id="loans" className="py-10 sm:py-14">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading title="Every loan you need, in one search." reveal={false} />
          <Link to="/search" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-700">
            Explore all loans <Icon name="ArrowRight" size={18} />
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {LOAN_TYPES.map((t, i) => (
            <li key={t.id}>
              <Link
                to={`/search?type=${t.id}`}
                className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 ${
                  i === 0 ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white hover:border-brand-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute -top-8 -right-8 size-24 rounded-full ${i === 0 ? "bg-white/10" : "bg-brand-50"}`}
                />
                <span className={`relative grid size-14 place-items-center rounded-2xl ${i === 0 ? "bg-white/15 text-flame-400" : "bg-brand-100 text-brand-700"}`}>
                  <Icon name={t.icon} size={28} />
                </span>
                <span className="relative mt-8 font-display text-lg leading-tight font-bold">{t.label}</span>
                <span className={`relative mt-1 text-xs ${i === 0 ? "text-brand-100" : "text-muted"}`}>{t.tagline}</span>
                <span className="relative mt-auto flex items-center justify-between pt-5 text-sm">
                  <span>
                    <span className={i === 0 ? "text-brand-100" : "text-muted"}>From </span>
                    <span className={`font-bold ${i === 0 ? "text-flame-400" : "text-brand-700"}`}>{t.from.toFixed(2)}%</span>
                  </span>
                  <span className={`grid size-8 place-items-center rounded-full border transition-colors ${i === 0 ? "border-white/30 group-hover:bg-white group-hover:text-brand-700" : "border-brand-200 text-brand-700 group-hover:bg-brand-700 group-hover:text-white"}`}>
                    <Icon name="ArrowRight" size={14} />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">Indicative starting rates p.a.; your rate depends on the lender’s assessment.</p>
      </div>
    </section>
  );
}
