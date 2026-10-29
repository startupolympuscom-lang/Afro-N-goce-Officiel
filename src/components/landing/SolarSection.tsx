import React from 'react';
import { ArrowRight, BatteryCharging, Calculator, Check, FileText, Sun } from 'lucide-react';
import { container, Reveal, Eyebrow, btnPrimary, btnSecondary } from './shared';
import { SolarScene, SolarVignette } from './SolarIllustrations';
import { SOLAR_SERVICES, FEATURED_SECTORS, OTHER_SECTORS } from './solarContent';

export type SolarImageSlot = 'principal' | 'industrie' | 'agriculture' | 'habitat';

interface SolarSectionProps {
  /** Photos uploaded in the CMS; the brand illustrations are shown where none is set. */
  images: Partial<Record<SolarImageSlot, string>>;
  onRequestQuote: (sector?: string) => void;
}

const HIGHLIGHTS = [
  'Étude et dimensionnement adaptés à votre consommation',
  'Panneaux, onduleurs et batteries de qualité certifiée',
  'Installation, mise en service et maintenance par nos équipes',
];

export function SolarSection({ images, onRequestQuote }: SolarSectionProps) {
  return (
    <section id="solaire" aria-labelledby="solaire-title" className="relative overflow-hidden bg-afro-blue-50 py-20 lg:py-28">
      <div className={`${container} relative grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16`}>
        <Reveal>
          <Eyebrow>Énergie solaire</Eyebrow>
          <h2 id="solaire-title" className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-afro-ink md:text-4xl lg:text-[2.75rem]">
            Panneaux solaires, <span className="whitespace-nowrap text-afro-blue">clé en main</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            AFRO Négoce conçoit, fournit et installe vos centrales photovoltaïques : sites industriels, exploitations agricoles,
            commerces, bâtiments publics et habitations, avec ou sans batteries, partout au Maroc.
          </p>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((point) => (
              <li key={point} className="flex gap-3 text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-afro-green/20 text-afro-green-dark">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => onRequestQuote()} className={btnPrimary}>
              <FileText className="h-4 w-4" aria-hidden="true" /> Demander un devis solaire
            </button>
            <a href="#simulateur-solaire" className={btnSecondary}>
              <Calculator className="h-4 w-4 text-afro-blue" aria-hidden="true" /> Simuler mon installation
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative mx-auto w-full max-w-[640px] lg:max-w-none">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-afro-blue/15 ring-1 ring-slate-900/5">
            {images.principal ? (
              <img
                src={images.principal}
                alt="Installation de panneaux solaires par AFRO Négoce"
                loading="lazy"
                decoding="async"
                className="aspect-[640/465] h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <SolarScene className="block h-auto w-full" />
            )}
          </div>
          <div className="mt-5 grid gap-3 sm:contents">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 shadow-[0_20px_50px_rgb(15,23,42,0.14)] ring-1 ring-slate-900/5 sm:absolute sm:-left-4 sm:-top-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF3D7] text-[#B7791F]">
                <Sun className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-[15px] font-bold text-afro-ink">Jusqu'à 3 000 h</span>
                <span className="block text-xs font-medium text-slate-500">de soleil par an au Maroc</span>
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 pr-5 shadow-[0_20px_50px_rgb(15,23,42,0.14)] ring-1 ring-slate-900/5 sm:absolute sm:-bottom-5 sm:-right-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-afro-green/20 text-afro-green-dark">
                <BatteryCharging className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-display text-[15px] font-bold text-afro-ink">Avec ou sans batteries</span>
                <span className="block text-xs font-medium text-slate-500">Réseau, hybride ou autonome</span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Services */}
      <div className={`${container} relative mt-20 lg:mt-28`}>
        <Reveal className="mb-8 max-w-2xl">
          <h3 className="font-display text-2xl font-bold tracking-tight text-afro-ink lg:text-3xl">
            De l'étude à la <span className="text-afro-blue">maintenance</span>
          </h3>
          <p className="mt-3 leading-relaxed text-slate-600">Un seul interlocuteur pour tout votre projet solaire, ou pour l'achat de votre matériel.</p>
        </Reveal>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOLAR_SERVICES.map(({ title, desc, icon: Icon }, i) => (
            <li key={title}>
              <Reveal delay={i * 0.06} className="h-full">
                <div className="h-full rounded-2xl bg-white p-6 ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgb(14,108,208,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-afro-blue-50 text-afro-blue">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-sm font-bold text-slate-300" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h4 className="mt-5 font-display text-base font-bold text-afro-ink">{title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      {/* Sectors */}
      <div className={`${container} relative mt-20 lg:mt-28`}>
        <Reveal className="mb-8 max-w-2xl">
          <h3 className="font-display text-2xl font-bold tracking-tight text-afro-ink lg:text-3xl">
            Une solution pour <span className="text-afro-blue">chaque secteur</span>
          </h3>
          <p className="mt-3 leading-relaxed text-slate-600">
            Du pompage agricole aux toitures industrielles, chaque installation est dimensionnée selon votre consommation et votre site.
          </p>
        </Reveal>

        <ul className="grid gap-6 md:grid-cols-3">
          {FEATURED_SECTORS.map(({ id, title, desc, icon: Icon, uses }, i) => (
            <li key={id}>
              <Reveal delay={i * 0.08} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgb(14,108,208,0.14)]">
                  <div className="relative aspect-[5/3] overflow-hidden rounded-xl bg-afro-blue-50">
                    {images[id] ? (
                      <img
                        src={images[id]}
                        alt={`Panneaux solaires, secteur ${title.toLowerCase()}`}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <SolarVignette variant={id} className="h-full w-full transition-transform duration-700 group-hover:scale-105" />
                    )}
                    <span className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-afro-blue shadow-sm">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4 pt-5">
                    <h4 className="font-display text-lg font-bold text-afro-ink">{title}</h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                    <ul className="mt-4 mb-5 flex flex-wrap gap-1.5" aria-label={`Applications : ${title}`}>
                      {uses.map((use) => (
                        <li key={use} className="rounded-full bg-afro-blue-50 px-2.5 py-1 text-xs font-medium text-afro-blue">{use}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onRequestQuote(title)}
                      className="mt-auto inline-flex items-center gap-1.5 self-start text-sm font-semibold text-afro-blue transition-all hover:gap-2.5"
                    >
                      Demander un devis <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OTHER_SECTORS.map(({ id, title, desc, icon: Icon }, i) => (
            <li key={id}>
              <Reveal delay={i * 0.05} className="h-full">
                <button
                  type="button"
                  onClick={() => onRequestQuote(title)}
                  className="group flex h-full w-full gap-4 rounded-2xl bg-white p-5 text-left ring-1 ring-slate-200/70 transition-all duration-300 hover:ring-afro-blue/30 hover:shadow-[0_16px_40px_rgb(14,108,208,0.1)]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-afro-blue-50 text-afro-blue transition-colors group-hover:bg-afro-blue group-hover:text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="sr-only">Demander un devis : </span>
                    <span className="block font-display font-bold text-afro-ink">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-slate-600">{desc}</span>
                  </span>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-afro-blue opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
                </button>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
