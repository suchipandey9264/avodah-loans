import { WHY_ITEMS } from "../lib/content";
import { Icon, SectionHeading } from "./ui";

export default function WhyUs() {
  return (
    <section className="relative overflow-hidden bg-white py-10 sm:py-14">
      <div className="container-x">
        <SectionHeading
          align="center"
          eyebrow="Why AvodahLoans"
          title="Built for your financial journey."
          sub="Technology, transparency and trust — to get you the best deal every time."
          reveal={false}
        />
        <ul className="why-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_ITEMS.map((w, i) => (
            <li key={w.title} className="why-card group rounded-3xl border border-line bg-paper p-7 transition-colors duration-300 hover:border-brand-200 hover:bg-brand-50">
              <div className="flex items-start justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-brand-700 text-flame-400">
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
