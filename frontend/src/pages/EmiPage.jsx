import { Link } from "react-router-dom";
import EmiCalculator from "../components/EmiCalculator";
import { LOAN_TYPES } from "../lib/loans";
import { Icon } from "../components/ui";

export default function EmiPage() {
  return (
    <div className="bg-gradient-to-b from-brand-50 to-paper">
      <EmiCalculator />
      <section className="container-x pb-24">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-line bg-white p-7" data-reveal>
            <h2 className="text-2xl font-bold">How EMI is calculated</h2>
            <p className="mt-4 rounded-2xl bg-brand-900 p-5 text-center font-display text-xl text-white">
              EMI = P × r × (1+r)<sup>n</sup> / ((1+r)<sup>n</sup> − 1)
            </p>
            <dl className="mt-5 grid gap-2 text-sm">
              {[["P", "Loan amount (principal)"], ["r", "Monthly interest rate (annual rate ÷ 12 ÷ 100)"], ["n", "Tenure in months"]].map(([k, v]) => (
                <div key={k} className="flex gap-3"><dt className="w-6 font-display font-bold text-brand-700">{k}</dt><dd className="text-muted">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="rounded-3xl border border-line bg-white p-7" data-reveal>
            <h2 className="text-2xl font-bold">Ready to see real offers?</h2>
            <p className="mt-2 text-muted">Pick a loan type to compare rates and EMIs from 50+ lenders.</p>
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LOAN_TYPES.map((t) => (
                <li key={t.id}>
                  <Link to={`/search?type=${t.id}`} className="flex min-h-12 items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold transition-colors hover:border-brand-700 hover:bg-brand-50">
                    <Icon name={t.icon} size={18} className="text-brand-700" /> {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
