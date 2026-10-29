import React from 'react';
import { container, Reveal, Eyebrow, btnPrimary, btnSecondary } from './shared';
import { SOLAR_SERVICES, FEATURED_SECTORS, OTHER_SECTORS } from './solarContent';

export type SolarImageSlot = 'principal' | 'industrie' | 'agriculture' | 'habitat';

interface SolarSectionProps {
  /** Photos uploaded in the CMS; without them the section is laid out on typography alone. */
  images: Partial<Record<SolarImageSlot, string>>;
  onRequestQuote: (sector?: string) => void;
}

const HIGHLIGHTS = [
  { title: 'Étude', text: 'dimensionnement adapté à votre consommation et à votre site' },
  { title: 'Matériel', text: 'panneaux, onduleurs et batteries de qualité certifiée' },
  { title: 'Installation', text: 'pose, mise en service et maintenance par nos équipes' },
];

const FIGURES = [
  { value: '3 000 h', label: "d'ensoleillement par an dans la plupart des régions du Maroc" },
  { value: '25 ans', label: 'de durée de vie pour des panneaux de qualité' },
  { value: '100 %', label: 'de votre consommation couverte avec des batteries bien dimensionnées' },
];

// Faint grid echoing solar cells, faded towards the bottom of the card.
const CELL_TEXTURE: React.CSSProperties = {
  backgroundImage: 'linear-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.07) 1px, transparent 1px)',
  backgroundSize: '44px 26px',
  maskImage: 'linear-gradient(to bottom, #000, transparent 75%)',
  WebkitMaskImage: 'linear-gradient(to bottom, #000, transparent 75%)',
};

export function SolarSection({ images, onRequestQuote }: SolarSectionProps) {
  return (
    <section id="solaire" aria-labelledby="solaire-title" className="bg-afro-blue-50 py-20 lg:py-28">
      <div className={`${container} grid items-center gap-14 lg:grid-cols-2 lg:gap-20`}>
        <Reveal>
          <Eyebrow>Énergie solaire</Eyebrow>
          <h2 id="solaire-title" className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-afro-ink md:text-4xl lg:text-[2.75rem]">
            Panneaux solaires, <span className="whitespace-nowrap text-afro-blue">clé en main</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            AFRO Négoce conçoit, fournit et installe vos centrales photovoltaïques : sites industriels, exploitations agricoles,
            commerces, bâtiments publics et habitations, avec ou sans batteries, partout au Maroc.
          </p>
          <ul className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {HIGHLIGHTS.map(({ title, text }) => (
              <li key={title} className="py-3.5 text-slate-600">
                <span className="font-semibold text-afro-ink">{title}</span> : {text}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => onRequestQuote()} className={btnPrimary}>
              Demander un devis solaire
            </button>
            <a href="#simulateur-solaire" className={btnSecondary}>
              Simuler mon installation
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative">
          {images.principal && (
            <img
              src={images.principal}
              alt="Installation de panneaux solaires par AFRO Négoce"
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl shadow-afro-blue/15"
              referrerPolicy="no-referrer"
            />
          )}
          <div
            className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-afro-navy via-[#0F2C52] to-[#0B4A8C] p-8 text-white shadow-[0_30px_70px_rgb(11,31,58,0.3)] sm:p-10 ${
              images.principal ? 'mx-4 -mt-24 sm:mx-8' : ''
            }`}
          >
            <div className="pointer-events-none absolute inset-0" style={CELL_TEXTURE} aria-hidden="true" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Le solaire au Maroc</p>
              <dl className={`mt-6 divide-y divide-white/10 ${images.principal ? 'sm:grid sm:grid-cols-3 sm:gap-6 sm:divide-y-0' : ''}`}>
                {FIGURES.map(({ value, label }) => (
                  <div key={value} className={`flex flex-col-reverse py-5 first:pt-0 last:pb-0 ${images.principal ? 'sm:py-0' : ''}`}>
                    <dt className="mt-1 text-sm leading-relaxed text-white/70">{label}</dt>
                    <dd className="font-display text-4xl font-extrabold tracking-tight lg:text-5xl">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                <p className="text-sm text-white/70">Raccordé au réseau, hybride ou autonome</p>
                <a href="#simulateur-solaire" className="text-sm font-semibold text-afro-green transition-colors hover:text-white">
                  Estimer mon installation →
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Services */}
      <div className={`${container} mt-20 lg:mt-28`}>
        <Reveal className="mb-10 max-w-2xl">
          <h3 className="font-display text-2xl font-bold tracking-tight text-afro-ink lg:text-3xl">
            De l'étude à la <span className="text-afro-blue">maintenance</span>
          </h3>
          <p className="mt-3 leading-relaxed text-slate-600">Un seul interlocuteur pour tout votre projet solaire, ou pour l'achat de votre matériel.</p>
        </Reveal>
        <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {SOLAR_SERVICES.map(({ title, desc }, i) => (
            <li key={title}>
              <Reveal delay={i * 0.06} className="h-full border-t-2 border-slate-200 pt-6">
                <span className="font-display text-sm font-bold text-afro-blue">{String(i + 1).padStart(2, '0')}</span>
                <h4 className="mt-3 font-display text-lg font-bold text-afro-ink">{title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      {/* Sectors */}
      <div className={`${container} mt-20 lg:mt-28`}>
        <Reveal className="mb-10 max-w-2xl">
          <h3 className="font-display text-2xl font-bold tracking-tight text-afro-ink lg:text-3xl">
            Une solution pour <span className="text-afro-blue">chaque secteur</span>
          </h3>
          <p className="mt-3 leading-relaxed text-slate-600">
            Du pompage agricole aux toitures industrielles, chaque installation est dimensionnée selon votre consommation et votre site.
          </p>
        </Reveal>

        <ul className="grid gap-6 md:grid-cols-3">
          {FEATURED_SECTORS.map(({ id, title, desc, uses }, i) => (
            <li key={id}>
              <Reveal delay={i * 0.08} className="h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70 transition-shadow duration-300 hover:shadow-[0_24px_50px_rgb(14,108,208,0.12)]">
                  {images[id] && (
                    <img
                      src={images[id]}
                      alt={`Panneaux solaires, secteur ${title.toLowerCase()}`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex flex-1 flex-col p-7">
                    <h4 className="font-display text-2xl font-bold tracking-tight text-afro-ink">{title}</h4>
                    <p className="mt-3 flex-1 leading-relaxed text-slate-600">{desc}</p>
                    <ul className="mt-6 mb-7 grid grid-cols-2 gap-x-4 border-t border-slate-100 pt-5 text-sm text-slate-700" aria-label={`Applications : ${title}`}>
                      {uses.map((use) => <li key={use} className="py-1">{use}</li>)}
                    </ul>
                    <button
                      type="button"
                      onClick={() => onRequestQuote(title)}
                      className="self-start text-sm font-semibold text-afro-blue transition-colors hover:text-afro-blue-dark"
                    >
                      Demander un devis →
                    </button>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <ul className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {OTHER_SECTORS.map(({ id, title, desc }) => (
            <li key={id} className="border-t border-slate-200">
              <button type="button" onClick={() => onRequestQuote(title)} className="group block w-full py-6 text-left">
                <span className="sr-only">Demander un devis : </span>
                <span className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-lg font-bold text-afro-ink transition-colors group-hover:text-afro-blue">{title}</span>
                  <span className="shrink-0 text-sm font-semibold text-afro-blue opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true">
                    Devis →
                  </span>
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-slate-600">{desc}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
