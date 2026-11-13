import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LOAN_TYPES } from "../lib/loans";
import { useAuth } from "../lib/auth";
import { gsap, ScrollTrigger, useGSAP } from "../lib/motion";
import { Icon, Logo, LoanIcon } from "./ui";

const LINKS = [
  { to: "/lenders", label: "Banks" },
  { to: "/emi-calculator", label: "EMI Calculator" },
  { to: "/credit-score", label: "Credit Score" },
  { to: "/support", label: "Support & Help" },
];

const linkCls = ({ isActive }) =>
  `relative inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium transition-colors hover:text-brand-700 ${
    isActive ? "text-brand-700" : "text-ink"
  }`;

function LoansMenu({ onNavigate }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);
  const panel = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !wrap.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    gsap.fromTo(panel.current, { y: -8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power3.out" });
    gsap.fromTo(panel.current.querySelectorAll("li"), { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.03, ease: "power3.out" });
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        aria-expanded={open}
        aria-controls="loans-menu"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-[15px] font-medium transition-colors hover:text-brand-700 ${pathname.startsWith("/search") ? "text-brand-700" : "text-ink"}`}
      >
        Loans <Icon name="ChevronDown" size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div id="loans-menu" ref={panel} hidden={!open} className="absolute top-full left-1/2 w-[560px] -translate-x-1/2 pt-3">
        <div className="rounded-2xl border border-line bg-white p-3 shadow-[0_30px_60px_-25px_rgb(36_16_82/0.35)]">
          <ul className="grid grid-cols-2 gap-1">
            {LOAN_TYPES.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/search?type=${t.id}`}
                  onClick={onNavigate}
                  className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-brand-50"
                >
                  <LoanIcon name={t.icon} size={20} className="size-10 group-hover:bg-brand-700 group-hover:text-white" />
                  <span className="leading-tight">
                    <span className="block font-semibold text-ink">{t.label}</span>
                    <span className="text-xs text-muted">From {t.from.toFixed(2)}% p.a.</span>
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/lenders" onClick={onNavigate} className="flex h-full items-center justify-between rounded-xl bg-brand-900 p-3 text-white">
                <span className="leading-tight">
                  <span className="block font-semibold">All banks & lenders</span>
                  <span className="text-xs text-brand-200">Rates, eligibility, documents</span>
                </span>
                <Icon name="ArrowRight" size={18} className="text-flame-400" />
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const bar = useRef(null);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useGSAP(() => {
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => (bar.current.dataset.scrolled = self.scroll() > 20 ? "true" : "false"),
    });
  });

  const masked = !user ? "" : user.name ? user.name.split(" ")[0] : user.phone ? `+91 ••••• ${user.phone.slice(-5)}` : user.email;

  return (
    <header ref={bar} data-scrolled="false" className="group/nav sticky top-0 z-50 border-b border-transparent bg-white/85 backdrop-blur-xl transition-[border-color,box-shadow] data-[scrolled=true]:border-line data-[scrolled=true]:shadow-[0_8px_30px_-20px_rgb(36_16_82/0.35)]">
      <a href="#main" className="sr-only rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50">
        Skip to content
      </a>
      <nav aria-label="Primary" className="container-x flex h-[72px] items-center justify-between gap-4">
        <Link to="/" aria-label="AvodahLoans home" className="shrink-0">
          <Logo className="h-8 sm:h-9" />
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <LoansMenu />
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/dashboard" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-50 px-3 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-100">
                <Icon name="LayoutDashboard" size={16} /> <span className="hidden xl:inline">{masked}</span><span className="xl:hidden">Dashboard</span>
              </Link>
              <button onClick={logout} className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-brand-50 hover:text-ink" aria-label="Log out">
                <Icon name="LogOut" size={18} />
              </button>
            </div>
          ) : (
            <Link to={`/login?next=${encodeURIComponent(pathname)}`} className="hidden min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-brand-300 sm:inline-flex">
              <Icon name="LogIn" size={16} /> Login
            </Link>
          )}
          <button onClick={() => navigate("/search")} className="btn-primary hidden min-h-11 px-5 text-sm md:inline-flex">
            <Icon name="Search" size={16} /> Search Loan
          </button>
          <button
            className="inline-flex size-11 items-center justify-center rounded-xl text-ink hover:bg-brand-50 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? "X" : "Menu"} size={22} />
          </button>
        </div>
      </nav>

      <div id="mobile-menu" hidden={!open} className="max-h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-white lg:hidden" data-lenis-prevent>
        <div className="container-x py-4">
          <p className="px-1 text-xs font-semibold tracking-widest text-muted uppercase">Loans</p>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {LOAN_TYPES.map((t) => (
              <li key={t.id}>
                <Link to={`/search?type=${t.id}`} className="flex min-h-14 items-center gap-2 rounded-xl border border-line p-2 text-sm font-semibold">
                  <LoanIcon name={t.icon} size={18} className="size-9" /> {t.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 grid gap-1 border-t border-line pt-4">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className={({ isActive }) => `flex min-h-12 items-center rounded-xl px-3 font-medium ${isActive ? "bg-brand-50 text-brand-700" : ""}`}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {user ? (
              <Link to="/dashboard" className="btn-ghost border-line">
                <Icon name="LayoutDashboard" size={16} /> Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn-ghost border-line">
                <Icon name="LogIn" size={16} /> Login
              </Link>
            )}
            <Link to="/search" className="btn-primary">
              <Icon name="Search" size={16} /> Search Loan
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
