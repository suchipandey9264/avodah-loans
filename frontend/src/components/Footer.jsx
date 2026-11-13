import { Link } from "react-router-dom";
import { CONTACT } from "../lib/content";
import { LOAN_TYPES } from "../lib/loans";
import { Icon, Logo } from "./ui";

const COLS = [
  { title: "Loans", links: LOAN_TYPES.map((t) => [t.label, `/search?type=${t.id}`]) },
  { title: "Tools", links: [["All banks & lenders", "/lenders"], ["EMI calculator", "/emi-calculator"], ["Credit score", "/credit-score"], ["Search loans", "/search"]] },
  { title: "Help", links: [["Support & Help", "/support"], ["My dashboard", "/dashboard"], ["Login", "/login"]] },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-brand-950 pt-20 text-white">
      <div className="container-x grid gap-12 pb-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" className="h-10" />
          <p className="mt-5 max-w-xs text-brand-200">Search, compare and apply for loans from 50+ banks & NBFCs — free, fast and fully digital.</p>
          <ul className="mt-6 grid gap-3 text-sm">
            <li><a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-3 text-brand-100 hover:text-white"><Icon name="Phone" size={16} className="text-flame-400" />{CONTACT.phone}</a></li>
            <li><a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-3 text-brand-100 hover:text-white"><Icon name="Mail" size={16} className="text-flame-400" />{CONTACT.email}</a></li>
            <li className="inline-flex items-center gap-3 text-brand-100"><Icon name="MapPin" size={16} className="text-flame-400" />{CONTACT.city}</li>
          </ul>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="font-display text-sm font-semibold tracking-widest text-flame-400 uppercase">{c.title}</h2>
            <ul className="mt-4 grid gap-1 text-sm">
              {c.links.map(([label, to]) => (
                <li key={label}><Link to={to} className="inline-flex min-h-8 items-center text-brand-200 transition-colors hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-brand-300">
        <p>© {new Date().getFullYear()} AvodahLoans. All rights reserved.</p>
        <p>AvodahLoans is a loan facilitation platform, not a lender. Rates shown are indicative; loans are subject to lender approval.</p>
      </div>
      <p aria-hidden="true" className="footer-wordmark pointer-events-none -mb-[0.22em] text-center font-display text-[19vw] leading-none font-extrabold tracking-tighter text-white/[0.04] select-none">
        avodah
      </p>
    </footer>
  );
}
