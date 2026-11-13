import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../lib/motion";

/**
 * Native <dialog> (focus trap + Esc for free) with three presentations:
 * "center" modal, "sheet" (bottom sheet on mobile, right drawer on desktop).
 */
export default function Dialog({ open, onClose, labelledBy, children, variant = "center", wide = false }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) {
      d.showModal();
      if (prefersReducedMotion()) return;
      if (variant === "sheet") {
        const desktop = window.matchMedia("(min-width: 768px)").matches;
        gsap.fromTo(d, desktop ? { xPercent: 100 } : { yPercent: 100 }, { xPercent: 0, yPercent: 0, duration: 0.45, ease: "expo.out" });
      } else {
        gsap.fromTo(d, { y: 30, autoAlpha: 0, scale: 0.97 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" });
      }
    } else if (!open && d.open) d.close();
  }, [open, variant]);

  const cls =
    variant === "sheet"
      ? "m-0 mt-auto h-[85dvh] max-h-none w-full max-w-none rounded-t-3xl md:mt-0 md:ml-auto md:h-dvh md:w-[520px] md:rounded-l-3xl md:rounded-tr-none"
      : `m-auto w-[calc(100%-2rem)] rounded-3xl ${wide ? "max-w-4xl" : "max-w-md"}`;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby={labelledBy}
      data-lenis-prevent
      className={`overflow-hidden bg-white p-0 text-ink backdrop:bg-brand-950/60 backdrop:backdrop-blur-sm ${cls}`}
    >
      {open && children}
    </dialog>
  );
}
