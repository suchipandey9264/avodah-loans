import { useRef } from "react";
import { STEPS } from "../lib/content";
import { gsap, useGSAP, MOTION_OK } from "../lib/motion";
import { Icon } from "./ui";

export default function HowItWorks() {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop: pin the section and scroll the steps horizontally.
      mm.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
        const distance = () => track.current.scrollWidth - window.innerWidth;
        const horizontal = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: ".how-pin",
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => gsap.set(".how-progress", { scaleX: self.progress }),
          },
        });

        // Each card's icon pops as it slides into view.
        gsap.utils.toArray(".how-card").forEach((card) => {
          gsap.from(card.querySelector(".how-icon"), {
            scale: 0.4,
            rotate: -30,
            duration: 0.6,
            ease: "back.out(2)",
            scrollTrigger: { trigger: card, containerAnimation: horizontal, start: "left 85%", toggleActions: "play none none reverse" },
          });
        });
      });

      // Mobile / tablet: vertical timeline that fills as you scroll.
      mm.add(`${MOTION_OK} and (max-width: 1023px)`, () => {
        gsap.fromTo(".how-vline", { scaleY: 0 }, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: track.current, start: "top 70%", end: "bottom 60%", scrub: true },
        });
        gsap.utils.toArray(".how-card").forEach((card) => {
          gsap.from(card, { x: 40, autoAlpha: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 85%" } });
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="how" ref={root} className="bg-brand-950 text-white">
      <div className="how-pin flex min-h-dvh flex-col justify-center overflow-hidden py-24 lg:py-0">
        <div className="container-x flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow border-white/15 bg-white/5 text-flame-400">How it works</p>
            <h2 className="mt-4 text-4xl leading-[1.05] font-bold sm:text-5xl">From application to disbursal in five steps.</h2>
          </div>
          <p className="max-w-sm text-brand-200">No branch visits, no paperwork marathons. One digital journey, start to finish.</p>
        </div>

        <div className="container-x mt-10 hidden lg:block">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div className="how-progress h-full origin-left rounded-full bg-flame-400" />
          </div>
        </div>

        <div className="relative mt-12 lg:mt-14">
          <span className="how-vline absolute top-0 bottom-0 left-[calc(1rem+27px)] w-0.5 origin-top bg-flame-400/60 sm:left-[calc(1.5rem+27px)] lg:hidden" aria-hidden="true" />
          <ol
            ref={track}
            className="grid gap-6 px-4 sm:px-6 lg:flex lg:w-max lg:gap-6 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
          >
            {STEPS.map((s, i) => (
              <li key={s.title} className="how-card relative flex gap-5 lg:block lg:w-[380px] lg:rounded-3xl lg:border lg:border-white/10 lg:bg-white/[0.04] lg:p-8">
                <span className="how-icon relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl bg-flame-400 text-ink">
                  <Icon name={s.icon} size={26} />
                </span>
                <div className="pb-2">
                  <p className="font-display text-sm font-semibold tracking-widest text-flame-400 lg:mt-10">STEP {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-2 text-2xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-brand-200">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
