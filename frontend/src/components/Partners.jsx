import { useRef, useState } from "react";
import { PARTNER_LOGOS } from "../lib/content";
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon } from "./ui";

/** "Compare offers from India's leading lenders" strip with a scroll-reactive logo marquee. */
export default function Partners() {
  const root = useRef(null);
  const tween = useRef(null);
  const [paused, setPaused] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        tween.current = gsap.to(".marquee-row", { xPercent: -50, duration: 45, ease: "none", repeat: -1 });
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const t = tween.current;
            if (!t || t.paused()) return;
            const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 7);
            gsap.to(t, { timeScale: boost * (self.direction === -1 ? -1 : 1), duration: 0.2, overwrite: true });
            gsap.to(t, { timeScale: 1, duration: 1.2, delay: 0.2, ease: "power2.out" });
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  const toggle = () => {
    const next = !paused;
    tween.current?.[next ? "pause" : "resume"]();
    setPaused(next);
  };

  return (
    <section ref={root} aria-labelledby="partners-title" className="container-x py-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex items-center justify-between gap-4 lg:w-60 lg:shrink-0 lg:border-r lg:border-line lg:pr-5">
          <h2 id="partners-title" className="text-lg leading-tight font-bold">
            Compare offers from <span className="text-brand-700">India’s leading lenders</span>
          </h2>
          <button onClick={toggle} aria-pressed={paused} aria-label={paused ? "Play logo animation" : "Pause logo animation"} className="grid size-11 shrink-0 place-items-center rounded-xl border border-line text-muted hover:text-ink lg:hidden">
            <Icon name={paused ? "Play" : "Pause"} size={16} />
          </button>
        </div>
        <ul className="sr-only">
          {PARTNER_LOGOS.map(([, n]) => <li key={n}>{n}</li>)}
        </ul>
        <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]" aria-hidden="true">
          <div className="marquee-row flex w-max gap-3">
            {[...PARTNER_LOGOS, ...PARTNER_LOGOS].map(([file, name], i) => (
              <div key={i} className="flex h-14 shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-4">
                <img src={`/bank-logos/${file}.png`} alt="" loading="lazy" className="h-8 w-12 object-contain" />
                <span className="text-sm font-semibold whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={toggle} aria-pressed={paused} aria-label={paused ? "Play logo animation" : "Pause logo animation"} className="hidden size-11 shrink-0 place-items-center rounded-xl border border-line text-muted hover:text-ink lg:grid">
          <Icon name={paused ? "Play" : "Pause"} size={16} />
        </button>
      </div>
    </section>
  );
}
