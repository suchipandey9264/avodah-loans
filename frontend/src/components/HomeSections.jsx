import { Link } from "react-router-dom";
import { HERO_STATS } from "../lib/content";
import { LOAN_TYPES } from "../lib/loans";
import { Counter, Icon, SectionHeading } from "./ui";

const STAT_ICONS = ["Users", "Landmark", "Wallet", "Percent"];

export function StatsStrip() {
  return (
    <section aria-label="AvodahLoans in numbers" className="container-x">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4" data-stagger>
        {HERO_STATS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-4 bg-white p-5 sm:p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
              <Icon name={STAT_ICONS[i]} size={22} />
            </span>
            <div className="flex flex-col-reverse">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="font-display text-2xl font-bold sm:text-3xl">
                <Counter {...s} />
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function LoanProducts() {
  return (
    <section id="loans" className="py-20 sm:py-28">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Our loan products" title="Every loan you need, in one search." />
          <Link to="/search" className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-700 hover:gap-3 transition-[gap]" data-reveal>
            Explore all loans <Icon name="ArrowRight" size={18} />
          </Link>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7" data-stagger>
          {LOAN_TYPES.map((t, i) => (
            <li key={t.id}>
              <Link
                to={`/search?type=${t.id}`}
                className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_50px_-24px_rgb(70_32_141/0.5)] ${
                  i === 0 ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white hover:border-brand-200"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute -top-8 -right-8 size-24 rounded-full transition-transform duration-500 group-hover:scale-[2.4] ${i === 0 ? "bg-white/10" : "bg-brand-50"}`}
                />
                <span className={`relative grid size-14 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 ${i === 0 ? "bg-white/15 text-flame-400" : "bg-brand-100 text-brand-700"}`}>
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
