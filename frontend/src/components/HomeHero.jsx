import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LOAN_TYPES } from "../lib/loans";
import { formatShort } from "../lib/emi";
import { gsap, useGSAP, MOTION_OK, prefersReducedMotion } from "../lib/motion";
import { Icon, SplitWords } from "./ui";

// One portrait photo per loan category, self-hosted in /public/hero/card (720×900 WebP).
// `approved` drives the floating "… approved" card so it matches the photo.
const HERO = {
  home: { src: "/hero/card/home.webp", alt: "Modern dream villa with a private pool and lawn", approved: 4500000 },
  lap: { src: "/hero/card/lap.webp", alt: "Premium residential and commercial towers", approved: 8000000 },
  personal: { src: "/hero/card/personal.webp", alt: "Friends sitting together, enjoying a trip", approved: 500000 },
  education: { src: "/hero/card/education.webp", alt: "Graduates throwing their caps outside a university", approved: 2000000 },
  gold: { src: "/hero/card/gold.webp", alt: "Traditional gold necklace and earrings", approved: 250000 },
  business: { src: "/hero/card/business.webp", alt: "Entrepreneur presenting to his team in a modern office", approved: 2500000 },
  car: { src: "/hero/card/car.webp", alt: "Luxury car driving on an open road", approved: 950000 },
};
const ORDER = LOAN_TYPES.map((t) => t.id);
const inrFull = new Intl.NumberFormat("en-IN");

// How each card sits in the fan, by distance from the front card.
const FAN = [
  { x: 0, r: 0, s: 1, o: 1 },
  { x: 36, r: 5, s: 0.9, o: 1 },
  { x: 64, r: 10, s: 0.8, o: 1 },
  { x: 0, r: 0, s: 0.72, o: 0 }, // tucked behind the front card
];

const TRUST = [
  { icon: "Zap", title: "Quick & 100%", sub: "digital" },
  { icon: "BadgeCheck", title: "Best rates", sub: "& offers" },
  { icon: "ShieldCheck", title: "Secure &", sub: "encrypted" },
];

function SearchWidget({ typeId, setTypeId }) {
  const navigate = useNavigate();
  const type = LOAN_TYPES.find((t) => t.id === typeId);
  const [amount, setAmount] = useState(type.defaultAmount);
  const [tenure, setTenure] = useState(type.defaultTenure);
  const [income, setIncome] = useState("");
  const fields = useRef(null);
  const first = useRef(true);

  // The category can change from the tabs or from the photo deck — reset the fields either way.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setAmount(type.defaultAmount);
    setTenure(type.defaultTenure);
    gsap.fromTo(fields.current.children, { y: 12, autoAlpha: 0.3 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.05, ease: "power3.out" });
  }, [typeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault();
    const monthly = Number(income.replace(/\D/g, ""));
    const q = new URLSearchParams({ type: typeId, amount, tenure });
    if (monthly) q.set("income", monthly * 12);
    navigate(`/search?${q}`);
  };

  const incomeView = income ? "₹ " + new Intl.NumberFormat("en-IN").format(Number(income.replace(/\D/g, ""))) : "";

  return (
    <form onSubmit={submit} className="hero-search relative rounded-[28px] border border-white bg-white/90 p-3 shadow-[0_40px_80px_-40px_rgb(36_16_82/0.45)] backdrop-blur-xl sm:p-4">
      <div role="tablist" aria-label="Loan type" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {LOAN_TYPES.map((t) => {
          const active = t.id === typeId;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTypeId(t.id)}
              className={`flex min-h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition-[background-color,color,box-shadow] duration-300 ${
                active ? "bg-brand-700 text-white shadow-lg shadow-brand-700/30" : "text-ink hover:bg-brand-50"
              }`}
            >
              <Icon name={t.icon} size={18} className={active ? "text-flame-400" : "text-brand-600"} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div ref={fields} className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="grid gap-1 rounded-2xl border border-line bg-white px-4 pt-2.5 pb-1 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <span className="text-xs font-medium text-muted">Loan amount</span>
          <select value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="min-h-9 bg-transparent text-base font-semibold outline-none">
            {type.amounts.map((a) => <option key={a} value={a}>{formatShort(a)}</option>)}
          </select>
        </label>
        <label className="grid gap-1 rounded-2xl border border-line bg-white px-4 pt-2.5 pb-1 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <span className="text-xs font-medium text-muted">Tenure</span>
          <select value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="min-h-9 bg-transparent text-base font-semibold outline-none">
            {type.tenures.map((y) => <option key={y} value={y}>{y} {y > 1 ? "years" : "year"}</option>)}
          </select>
        </label>
        <label className="grid gap-1 rounded-2xl border border-line bg-white px-4 pt-2.5 pb-1 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-100">
          <span className="text-xs font-medium text-muted">Monthly income</span>
          <input
            inputMode="numeric"
            placeholder="₹ 1,50,000"
            value={incomeView}
            onChange={(e) => setIncome(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="min-h-9 bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-muted/70"
          />
        </label>
        <button type="submit" className="btn-primary min-h-16 rounded-2xl px-8 text-base">
          <Icon name="Search" size={18} /> Search Loan
        </button>
      </div>
    </form>
  );
}

/**
 * The seven category photos as a fanned deck of cards, on the right of the hero copy.
 * The selected card sits in front; switching category shuffles the new card forward with a short 3D flip.
 * Peeking cards are clickable. The front card carries the category name and tagline.
 */
function PhotoDeck({ typeId, onPick }) {
  const wrap = useRef(null);
  const first = useRef(true);
  const n = ORDER.length;
  const ai = ORDER.indexOf(typeId);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (prefersReducedMotion()) return;
    const el = wrap.current?.querySelector(`[data-card="${typeId}"] .deck-inner`);
    if (el) gsap.fromTo(el, { rotateY: -32, y: -24, scale: 0.92 }, { rotateY: 0, y: 0, scale: 1, duration: 1, ease: "expo.out", clearProps: "transform" });
  }, [typeId]);

  return (
    <div ref={wrap} className="absolute inset-0 [perspective:1600px]">
      {/* Ambient glow in the active photo's colours (its own parallax layer) */}
      <div aria-hidden="true" className="deck-glow pointer-events-none absolute -inset-x-[20%] -inset-y-[10%] -z-10">
        {ORDER.map((id) => (
          <img
            key={id}
            src={HERO[id].src}
            alt=""
            className={`absolute inset-0 m-auto h-full w-3/4 rounded-full object-cover blur-[90px] saturate-150 transition-opacity duration-1000 ${id === typeId ? "opacity-60" : "opacity-0"}`}
          />
        ))}
      </div>

      <div className="deck-tilt absolute inset-0 [transform-style:preserve-3d]">
        <div className="absolute inset-0 [perspective:1600px]">
        {ORDER.map((id, i) => {
          const d = (i - ai + n) % n;
          const signed = d > n / 2 ? d - n : d; // -3 … 3
          const f = FAN[Math.min(Math.abs(signed), 3)];
          const dir = Math.sign(signed);
          const front = signed === 0;
          const t = LOAN_TYPES[i];
          return (
            <div
              key={id}
              data-card={id}
              className="deck-card absolute top-1/2 left-1/2 aspect-[4/5] h-full max-w-[94%] [transition:transform_0.9s_cubic-bezier(0.16,1,0.3,1),opacity_0.6s_ease]"
              style={{
                transform: `translate(-50%, -50%) translateX(${dir * f.x}%) rotate(${dir * f.r}deg) scale(${f.s})`,
                zIndex: 20 - Math.abs(signed) * 4,
                opacity: f.o,
              }}
            >
              <button
                type="button"
                tabIndex={-1}
                aria-hidden={!front}
                disabled={front || f.o === 0}
                onClick={() => onPick(id)}
                aria-label={front ? undefined : `Show ${t.label}`}
                className={`deck-inner block size-full rounded-[32px] bg-white/90 p-2 transition-[transform,box-shadow] duration-300 ${
                  front
                    ? "cursor-default shadow-[0_50px_100px_-40px_rgb(36_16_82/0.75)]"
                    : "shadow-[0_30px_60px_-34px_rgb(36_16_82/0.6)] hover:-translate-y-3"
                }`}
              >
                <span className="relative block size-full overflow-hidden rounded-[26px] bg-brand-900">
                  <img
                    src={HERO[id].src}
                    alt={front ? HERO[id].alt : ""}
                    decoding="async"
                    fetchPriority={id === "home" ? "high" : "auto"}
                    className={`size-full object-cover transition-transform duration-[2.5s] ease-out-expo ${front ? "scale-100" : "scale-110"}`}
                  />
                  {/* Bottom shade for the caption; peeking cards are dimmed slightly */}
                  <span className={`absolute inset-0 transition-colors duration-500 ${front ? "bg-gradient-to-t from-brand-950/75 via-brand-950/10 via-35% to-transparent" : "bg-brand-950/20"}`} />
                  <span className={`absolute inset-x-0 bottom-0 flex items-center gap-3 p-4 text-left text-white transition-opacity duration-500 ${front ? "opacity-100" : "opacity-0"}`}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md"><Icon name={t.icon} size={18} /></span>
                    <span className="leading-tight">
                      <span className="block font-display text-base font-bold">{t.label}</span>
                      <span className="text-xs text-white/75">{t.tagline}</span>
                    </span>
                  </span>
                </span>
              </button>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}

export default function HomeHero() {
  const root = useRef(null);
  const [typeId, setTypeId] = useState("home");
  const active = LOAN_TYPES.find((t) => t.id === typeId);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        // Deal the cards in from below, back to front, then bring in the copy on top
        tl.from(".deck-inner", { y: 160, rotate: (i) => (i % 2 ? 14 : -14), autoAlpha: 0, duration: 1.1, stagger: { each: 0.07, from: "end" }, clearProps: "transform,opacity,visibility" })
          .from(".hero-title .word-mask > span", { yPercent: 110, duration: 1.1, stagger: 0.05 }, 0.35)
          .from(".hero-sub, .hero-trust > li", { y: 20, autoAlpha: 0, duration: 0.8, stagger: 0.07 }, "-=0.8")
          .from(".hero-float", { y: 30, autoAlpha: 0, scale: 0.9, duration: 0.9, stagger: 0.12, ease: "back.out(1.6)" }, "-=0.9")
          .from(".hero-search", { y: 40, autoAlpha: 0, duration: 1 }, "-=1");

        gsap.to(".hero-float-inner", { y: -8, duration: 2.4, yoyo: true, repeat: -1, ease: "sine.inOut", stagger: 0.6 });

        // Scroll parallax: each layer moves at its own speed
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to(".hero-copy", { y: -80, ease: "none", scrollTrigger: st });
        gsap.to(".deck-layer", { y: 90, scale: 1.06, ease: "none", scrollTrigger: st });
        gsap.to(".deck-glow", { yPercent: 18, ease: "none", scrollTrigger: st });
        gsap.to(".hero-float-a", { y: -200, ease: "none", scrollTrigger: st });
        gsap.to(".hero-float-b", { y: -60, ease: "none", scrollTrigger: st });
        gsap.to(".hero-orb", { yPercent: 40, ease: "none", scrollTrigger: st });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  // Mouse parallax: the deck tilts toward the pointer, the copy and floating cards drift at different depths.
  const onMove = (e) => {
    if (e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const q = (sel, vars) => gsap.to(root.current.querySelector(sel), { duration: 0.8, ease: "power3.out", overwrite: "auto", ...vars });
    q(".deck-tilt", { rotateY: x * 9, rotateX: -y * 7 });
    q(".hero-copy-inner", { x: -x * 18, y: -y * 12 });
    q(".hero-float-a .hero-float-shift", { x: x * 34, y: y * 24 });
    q(".hero-float-b .hero-float-shift", { x: x * 22, y: y * 16 });
  };
  const onLeave = () => {
    gsap.to(root.current.querySelectorAll(".deck-tilt, .hero-copy-inner, .hero-float-shift"), { x: 0, y: 0, rotateX: 0, rotateY: 0, duration: 1, ease: "power3.out" });
  };

  return (
    <section ref={root} className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-[#f3eefd] to-paper pt-10 pb-16 sm:pt-14">
      <div className="hero-orb pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-brand-200/60 blur-[120px]" />
      <div className="hero-orb pointer-events-none absolute top-20 right-[-10%] size-[460px] rounded-full bg-flame-100 blur-[120px]" />

      <div className="container-x relative">
        {/* Stage: copy on the left, photo deck on the right */}
        <div onPointerMove={onMove} onPointerLeave={onLeave} className="relative isolate grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-6">
          <div className="hero-copy relative z-40 text-center lg:text-left">
            <div className="hero-copy-inner">
              <h1 className="hero-title text-[2.4rem] leading-[1.04] font-extrabold sm:text-6xl xl:text-[4.25rem]">
                <SplitWords text="Search & get the" />
                <br />
                <SplitWords text="Best Loan" wordClassName="text-brand-700" />
                <SplitWords text="in India" />
              </h1>
              <p className="hero-sub mx-auto mt-5 max-w-lg text-base text-muted sm:text-lg lg:mx-0">
                Check offers from 50+ banks & NBFCs. Compare rates, EMIs and eligibility — all in one place, in under 2 minutes.
              </p>
              <ul className="hero-trust mt-7 flex flex-wrap justify-center gap-x-7 gap-y-4 lg:justify-start">
                {TRUST.map((t) => (
                  <li key={t.title} className="flex items-center gap-3 text-left text-sm leading-tight">
                    <span className="grid size-11 place-items-center rounded-full bg-white text-brand-700 shadow-sm ring-1 ring-brand-100">
                      <Icon name={t.icon} size={20} />
                    </span>
                    <span>
                      <span className="block font-semibold">{t.title}</span>
                      <span className="text-muted">{t.sub}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative h-[320px] sm:h-[380px] lg:h-[400px]">
            <div className="deck-layer absolute inset-0">
              <PhotoDeck typeId={typeId} onPick={setTypeId} />
            </div>

            <div className="hero-float hero-float-a pointer-events-none absolute -top-3 left-[18%] z-50 hidden sm:block">
              <div className="hero-float-shift">
                <div className="hero-float-inner flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-xl">
                  <span className="grid size-10 place-items-center rounded-full bg-green-100 text-success"><Icon name="Check" size={20} strokeWidth={2.5} /></span>
                  <span className="leading-tight">
                    <span className="block text-xs text-muted">{active.label.replace(/ Loan\b/, " loan")} approved</span>
                    <span className="font-display text-lg font-bold tabular-nums">₹{inrFull.format(HERO[typeId].approved)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-float hero-float-b pointer-events-none absolute right-[2%] bottom-[4%] z-50 hidden sm:block">
              <div className="hero-float-shift">
                <div className="hero-float-inner rounded-2xl bg-brand-900 p-4 text-white shadow-xl ring-1 ring-white/10">
                  <p className="text-xs text-brand-200">Rates starting from</p>
                  <p className="font-display text-3xl font-extrabold text-flame-400 tabular-nums">{active.from.toFixed(2)}%<span className="ml-1 text-sm font-medium text-brand-200">p.a.</span></p>
                  <div className="mt-2 flex -space-x-2">
                    {["sbi", "hdfs", "icic", "axis"].map((l) => (
                      <img key={l} src={`/bank-logos/${l}.png`} alt="" className="size-7 rounded-full border-2 border-brand-900 bg-white object-contain p-0.5" />
                    ))}
                    <span className="grid size-7 place-items-center rounded-full border-2 border-brand-900 bg-flame-400 text-[10px] font-bold text-ink">50+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-50 mt-8 lg:mt-4">
          <SearchWidget typeId={typeId} setTypeId={setTypeId} />
        </div>
      </div>
    </section>
  );
}
