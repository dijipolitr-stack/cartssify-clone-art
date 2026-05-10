import aboutImg from "@/assets/lifestyle/about-cafe-setup.png";
import { useT } from "@/lib/i18n";

export function AboutSection() {
  const t = useT();
  return (
    <section id="about" className="py-20 md:py-32 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 md:gap-20 items-start">
        <div className="aspect-[4/3] overflow-hidden bg-secondary md:sticky md:top-28">
          <img
            src={aboutImg}
            alt={t.about.title}
            loading="lazy"
            width={1600}
            height={1200}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="max-w-md">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-5">
            {t.about.eyebrow}
          </p>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-foreground leading-[1.05]">
            {t.about.title}
          </h2>
          <div className="mt-6 space-y-5 text-base text-muted-foreground leading-relaxed">
            <p>{t.about.body1}</p>
            <p>{t.about.body2}</p>
            <p>{t.about.body3}</p>
          </div>
          <ul className="mt-10 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {t.about.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-foreground">
                <span
                  aria-hidden
                  className="mt-2 h-px w-4 bg-foreground flex-shrink-0"
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
