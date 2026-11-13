import { useRef, useState } from "react";
import { CONTACT } from "../lib/content";
import { Link } from "react-router-dom";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { logCallback } from "../lib/activity";
import { Icon } from "./ui";

export function CallbackForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (!data.get("name").trim()) return setError("name");
    if (data.get("phone").replace(/\D/g, "").length < 10) return setError("phone");
    setError("");
    logCallback({ name: data.get("name").trim() });
    setSent(true);
  };

  if (sent)
    return (
      <div role="status" className="flex items-center gap-3 rounded-2xl bg-white/10 p-5">
        <span className="grid size-10 place-items-center rounded-full bg-flame-400 text-ink"><Icon name="Check" size={20} strokeWidth={2.5} /></span>
        <p>Thanks! A loan advisor will call you shortly.</p>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <label className="grid gap-1 text-sm">
        <span className="text-brand-100">Your name</span>
        <input name="name" autoComplete="name" aria-invalid={error === "name"} aria-describedby="cb-err" className="field border-white/20 bg-white/10 text-white placeholder:text-brand-300 focus:border-flame-400 focus:ring-flame-400/30" placeholder="Priya Shah" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-brand-100">Mobile number</span>
        <input name="phone" type="tel" autoComplete="tel" aria-invalid={error === "phone"} aria-describedby="cb-err" className="field border-white/20 bg-white/10 text-white placeholder:text-brand-300 focus:border-flame-400 focus:ring-flame-400/30" placeholder="98765 43210" />
      </label>
      <button type="submit" className="btn-accent self-end">Call me back</button>
      <p id="cb-err" role="alert" className="text-sm text-flame-400 sm:col-span-3">
        {error === "name" && "Please tell us your name."}
        {error === "phone" && "Enter a 10-digit mobile number."}
      </p>
    </form>
  );
}

export default function Cta() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // The panel grows from an inset card to near full-bleed as it scrolls in.
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          ".cta-panel",
          { scale: 0.88, borderRadius: "48px" },
          { scale: 1, borderRadius: "28px", ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 25%", scrub: true } }
        );
        gsap.from(".cta-line", {
          yPercent: 100,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".cta-panel", start: "top 70%" },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="contact" ref={root} className="px-3 pb-24 sm:px-5 sm:pb-32">
      <div className="cta-panel relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-brand-800 px-6 py-16 text-white sm:px-12 sm:py-20 lg:px-16">
        <div className="grain-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -top-32 -right-24 size-96 rounded-full bg-flame-500/30 blur-[100px]" />

        <div className="relative grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <h2 className="text-4xl leading-[1.02] font-extrabold sm:text-6xl">
              <span className="block overflow-hidden"><span className="cta-line block">Ready to get the</span></span>
              <span className="block overflow-hidden"><span className="cta-line block text-flame-400">best loan deal?</span></span>
            </h2>
            <p className="cta-line mt-6 max-w-lg text-lg text-brand-100">
              Join 2.4 lakh+ customers. Compare, apply and get approved — all in one place.
            </p>
            <div className="cta-line mt-8 flex flex-wrap gap-3">
              <Link to="/search" className="btn-accent">
                Search Loan <Icon name="ArrowRight" size={16} />
              </Link>
              <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`} className="btn-ghost border-white/30 text-white hover:bg-white/10">
                <Icon name="PhoneCall" size={16} /> Talk to an advisor
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-brand-950/40 p-6 backdrop-blur">
            <p className="font-display text-xl font-bold">Prefer a callback?</p>
            <p className="mt-1 mb-5 text-sm text-brand-200">Leave your number — a loan advisor will reach out.</p>
            <CallbackForm />
          </div>
        </div>
      </div>
    </section>
  );
}
