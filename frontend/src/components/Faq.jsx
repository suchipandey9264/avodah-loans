import { useState } from "react";
import { Link } from "react-router-dom";
import { FAQS } from "../lib/content";
import { Icon, SectionHeading } from "./ui";

export function Accordion({ items, initial = 0, idPrefix = "faq" }) {
  const [open, setOpen] = useState(initial);
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <li key={f.q}>
            <h3>
              <button
                id={`${idPrefix}-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-a-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex min-h-12 w-full items-center justify-between gap-4 py-3.5 text-left font-display text-base font-semibold sm:text-lg"
              >
                {f.q}
                <span className={`grid size-8 shrink-0 place-items-center rounded-full ${isOpen ? "rotate-45 bg-brand-700 text-white" : "bg-brand-50 text-brand-700"}`}>
                  <Icon name="Plus" size={16} />
                </span>
              </button>
            </h3>
            <div id={`${idPrefix}-a-${i}`} role="region" aria-labelledby={`${idPrefix}-q-${i}`} className={`grid ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden" inert={!isOpen}>
                <p className="max-w-2xl pb-4 text-[15px] text-muted">{f.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function Faq() {
  return (
    <section id="faq" className="py-8 sm:py-10">
      <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading eyebrow="FAQ" title="Questions, answered." sub="Everything you need to know about eligibility, documents and approval." reveal={false} />
          <div className="mt-6 rounded-2xl bg-brand-50 p-5">
            <p className="font-semibold">Still have questions?</p>
            <p className="mt-1 text-sm text-muted">Our loan advisors are a call away — free of charge.</p>
            <Link to="/support" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-700 underline-offset-4 hover:underline">
              <Icon name="Headphones" size={16} /> Visit Support & Help
            </Link>
          </div>
        </div>
        <div>
          <Accordion items={FAQS.slice(0, 6)} />
        </div>
      </div>
    </section>
  );
}
