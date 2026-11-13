import { useRef } from "react";
import { TESTIMONIALS } from "../lib/content";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon, SectionHeading } from "./ui";

export default function Testimonials() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (min-width: 768px)`, () => {
        // Columns drift at different speeds for depth.
        gsap.utils.toArray(".testi-card").forEach((card, i) => {
          gsap.fromTo(card, { y: [80, 0, 140][i] ?? 60 }, {
            y: [-40, 40, -20][i] ?? 0,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="overflow-hidden bg-brand-50 py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading
          eyebrow="Customer stories"
          title="2,40,000+ customers. Real savings."
          sub="People who secured their dream home, grew their business and planned their future."
        />
        <ul className="mt-16 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <li key={t.name} className={`testi-card relative flex flex-col rounded-3xl p-7 ${i === 1 ? "bg-brand-700 text-white" : "bg-white"}`}>
              <Icon name="Quote" size={40} className={`${i === 1 ? "text-flame-400" : "text-brand-200"}`} />
              <div className="mt-4 flex gap-0.5 text-flame-500" role="img" aria-label="Rated 5 out of 5">
                {Array.from({ length: 5 }).map((_, k) => <Icon key={k} name="Star" size={16} fill="currentColor" />)}
              </div>
              <blockquote className={`mt-4 flex-1 text-lg leading-relaxed ${i === 1 ? "text-brand-50" : "text-ink"}`}>
                “{t.text}”
              </blockquote>
              <footer className="mt-8 flex items-center gap-3">
                <span className={`grid size-12 place-items-center rounded-full font-display font-bold ${i === 1 ? "bg-flame-400 text-ink" : "bg-brand-100 text-brand-700"}`}>
                  {t.initials}
                </span>
                <div className="leading-tight">
                  <p className="font-semibold">{t.name}</p>
                  <p className={`text-sm ${i === 1 ? "text-brand-200" : "text-muted"}`}>{t.loan} · {t.city}</p>
                </div>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
