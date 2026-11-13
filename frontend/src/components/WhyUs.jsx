import { useRef } from "react";
import { WHY_ITEMS } from "../lib/content";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon, SectionHeading } from "./ui";

export default function WhyUs() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Cards rise in a staggered cascade as the grid scrubs into view.
      mm.add(`${MOTION_OK} and (min-width: 768px)`, () => {
        gsap.from(".why-card", {
          y: (i) => 80 + i * 40,
          rotate: (i) => (i % 2 ? 2 : -2),
          ease: "none",
          stagger: 0.05,
          scrollTrigger: { trigger: ".why-grid", start: "top 95%", end: "top 45%", scrub: 0.8 },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-white py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading
          align="center"
          eyebrow="Why AvodahLoans"
          title="Built for your financial journey."
          sub="Technology, transparency and trust — to get you the best deal every time."
        />
        <ul className="why-grid mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_ITEMS.map((w, i) => (
            <li key={w.title} className="why-card group rounded-3xl border border-line bg-paper p-7 transition-colors duration-300 hover:border-brand-200 hover:bg-brand-50">
              <div className="flex items-start justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-brand-700 text-flame-400 transition-transform duration-300 group-hover:-rotate-6">
                  <Icon name={w.icon} size={26} />
                </span>
                <span className="font-display text-5xl font-extrabold text-brand-100 transition-colors group-hover:text-brand-200" aria-hidden="true">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-10 text-xl font-bold">{w.title}</h3>
              <p className="mt-2 text-muted">{w.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
