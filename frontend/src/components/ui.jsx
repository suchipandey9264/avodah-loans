import {
  House, Briefcase, User, Car, GraduationCap, LandPlot, CreditCard, HeartPulse, Search, Zap,
  Handshake, ShieldCheck, ClipboardCheck, Scale, BadgeCheck, FileUp, Banknote, ArrowRight,
  ArrowUpRight, PhoneCall, Star, Quote, Plus, Menu, X, Check, Mail, Phone, MapPin, Pause, Play,
  Lock, Sparkles, Circle, Building2, Coins, Store, Stethoscope, Gauge, Headphones, MessageCircle,
  LogIn, LogOut, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, Pencil,
  Percent, Users, Landmark, Clock, Info, Smartphone, CircleCheck, TriangleAlert, Calculator, IdCard,
  ArrowLeft, Wallet, Heart, LayoutDashboard, History, FileText, Trash2, RotateCcw, Activity,
  ExternalLink, UserRound, Laptop, IndianRupee, CalendarDays, Building, AtSign, KeyRound, ListFilter, Upload, LoaderCircle,
} from "lucide-react";

const Icons = {
  House, Briefcase, User, Car, GraduationCap, LandPlot, CreditCard, HeartPulse, Search, Zap,
  Handshake, ShieldCheck, ClipboardCheck, Scale, BadgeCheck, FileUp, Banknote, ArrowRight,
  ArrowUpRight, PhoneCall, Star, Quote, Plus, Menu, X, Check, Mail, Phone, MapPin, Pause, Play,
  Lock, Sparkles, Circle, Building2, Coins, Store, Stethoscope, Gauge, Headphones, MessageCircle,
  LogIn, LogOut, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, Pencil,
  Percent, Users, Landmark, Clock, Info, Smartphone, CircleCheck, TriangleAlert, Calculator, IdCard,
  ArrowLeft, Wallet, Heart, LayoutDashboard, History, FileText, Trash2, RotateCcw, Activity,
  ExternalLink, UserRound, Laptop, IndianRupee, CalendarDays, Building, AtSign, KeyRound, ListFilter, Upload, LoaderCircle,
};

/** Renders a lucide icon by name; decorative by default. */
export function Icon({ name, size = 22, className = "", strokeWidth = 1.75, ...rest }) {
  const Cmp = Icons[name] ?? Icons.Circle;
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" {...rest} />;
}

/** Brand logo. `tone="dark"` = dark text for light backgrounds; `"light"` = white text for dark ones. */
export function Logo({ tone = "dark", className = "h-9" }) {
  return (
    <img
      src={tone === "dark" ? "/logo-dark.png" : "/logo-light.png"}
      alt="AvodahLoans — Quick & Easy"
      width="520"
      height="102"
      className={`w-auto self-start ${className}`}
    />
  );
}

/** Loan-type icon tile with a consistent tint. */
export function LoanIcon({ name, active = false, size = 22, className = "size-11" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl transition-colors ${
        active ? "bg-white/20 text-white" : "bg-brand-100 text-brand-700"
      } ${className}`}
    >
      <Icon name={name} size={size} />
    </span>
  );
}

/** Splits text into masked words so GSAP can slide them up. Accessible label stays intact. */
export function SplitWords({ text, className = "", wordClassName = "" }) {
  return (
    <span className={className} aria-label={text} role="text">
      {text.split(" ").map((w, i) => (
        <span key={i} className="word-mask" aria-hidden="true">
          <span className={wordClassName}>{w}</span>
          {" "}
        </span>
      ))}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, sub, align = "left", dark = false, reveal = true, as: H = "h2" }) {
  const center = align === "center";
  const r = reveal || undefined; // undefined drops the attribute, so the scroll fade-in skips it
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`} data-reveal-group>
      {eyebrow && (
        <p
          className={`eyebrow ${dark ? "border-white/15 bg-white/5 text-flame-400" : ""}`}
          data-reveal={r}
        >
          {eyebrow}
        </p>
      )}
      <H
        className={`${eyebrow ? "mt-4" : ""} text-4xl leading-[1.05] font-bold sm:text-5xl ${dark ? "text-white" : "text-ink"}`}
        data-reveal={r}
      >
        {title}
      </H>
      {sub && (
        <p className={`mt-4 text-lg ${dark ? "text-brand-200" : "text-muted"}`} data-reveal={r}>
          {sub}
        </p>
      )}
    </div>
  );
}
