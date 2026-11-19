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
    <footer className="relative overflow-hidden bg-brand-950 pt-6 text-white">
      <div className="container-x grid gap-6 pb-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" className="h-7" />
          <p className="mt-2.5 max-w-xs text-[13px] text-brand-200">Search, compare and apply for loans from 50+ banks & NBFCs — free, fast and fully digital.</p>
          <ul className="mt-3 grid gap-1.5 text-[13px]">
            <li><a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2.5 text-brand-100 hover:text-white"><Icon name="Phone" size={14} className="text-flame-400" />{CONTACT.phone}</a></li>
            <li><a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2.5 text-brand-100 hover:text-white"><Icon name="Mail" size={14} className="text-flame-400" />{CONTACT.email}</a></li>
            <li className="inline-flex items-center gap-2.5 text-brand-100"><Icon name="MapPin" size={14} className="text-flame-400" />{CONTACT.city}</li>
          </ul>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="font-display text-xs font-semibold tracking-widest text-flame-400 uppercase">{c.title}</h2>
            <ul className="mt-2 grid text-[13px]">
              {c.links.map(([label, to]) => (
                <li key={label}><Link to={to} className="inline-flex min-h-7 items-center text-brand-200 hover:text-white">{label}</Link></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-3 text-[11px] text-brand-300">
        <p>© {new Date().getFullYear()} AvodahLoans. All rights reserved.</p>
        <p>AvodahLoans is a loan facilitation platform, not a lender. Rates shown are indicative; loans are subject to lender approval.</p>
      </div>
      <p aria-hidden="true" className="footer-wordmark pointer-events-none -mb-[0.22em] text-center font-display text-[9vw] leading-none font-extrabold tracking-tighter text-white/[0.04] select-none">
        avodah
      </p>
    </footer>
  );
}
