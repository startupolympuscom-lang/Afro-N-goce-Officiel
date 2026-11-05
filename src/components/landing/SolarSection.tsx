import React, { useId, useState } from 'react';
import { container, Reveal, Eyebrow, btnPrimary } from './shared';
import type { SummaryLine } from './solarContent';
import { SEGMENT_PROFILES, estimateSolar, type SolarSegment } from '../../lib/solarSimulation';

const SITES: { id: SolarSegment; label: string; sector: string }[] = [
  { id: 'habitat', label: 'Maison', sector: 'Maison ou villa' },
  { id: 'tertiaire', label: 'Entreprise', sector: 'Commerce ou bureaux' },
  { id: 'agriculture', label: 'Agriculture', sector: 'Agriculture et pompage' },
];

const POINTS = [
  'Étude de votre consommation et de votre site',
  'Fourniture des panneaux, onduleurs et batteries',
  'Installation, mise en service et maintenance',
];

const nf = (value: number, digits = 0) => value.toLocaleString('fr-FR', { maximumFractionDigits: digits });
const choice = (active: boolean) =>
  `flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-white text-afro-blue shadow-sm' : 'text-slate-600 hover:text-afro-ink'}`;

interface SolarSectionProps {
  /** Photo uploaded in the CMS, shown under the text when set. */
  image?: string;
  onRequestQuote: (sector?: string, summary?: SummaryLine[]) => void;
}

export function SolarSection({ image, onRequestQuote }: SolarSectionProps) {
  const uid = useId();
  const [site, setSite] = useState<SolarSegment>('habitat');
  const [kwh, setKwh] = useState(SEGMENT_PROFILES.habitat.defaultKwh);
  const [withBattery, setWithBattery] = useState(false);
  const estimate = estimateSolar(site, kwh, withBattery);
  const siteInfo = SITES.find((s) => s.id === site) ?? SITES[0];

  const chooseSite = (next: SolarSegment) => {
    setSite(next);
    setKwh(SEGMENT_PROFILES[next].defaultKwh);
  };

  const requestQuote = () =>
    onRequestQuote(siteInfo.sector, [
      { label: 'Site', value: siteInfo.label },
      { label: 'Consommation', value: `${nf(kwh)} kWh par mois` },
      { label: 'Batteries', value: withBattery ? `Oui, environ ${nf(estimate.batteryKwh)} kWh` : 'Non' },
      { label: 'Estimation', value: `${estimate.panels} panneaux de 550 Wc (${nf(estimate.kwc, 1)} kWc)` },
    ]);

  return (
    <section id="solaire" aria-labelledby="solaire-title" className="bg-afro-blue-50 py-20 lg:py-28">
      <div className={`${container} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
        <Reveal>
          <Eyebrow>Énergie solaire</Eyebrow>
          <h2 id="solaire-title" className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-afro-ink md:text-4xl lg:text-[2.75rem]">
            Panneaux solaires, <span className="whitespace-nowrap text-afro-blue">clé en main</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Nous installons des panneaux solaires, avec ou sans batteries, pour les maisons, les entreprises, les exploitations
            agricoles et les bâtiments publics, partout au Maroc.
          </p>
          <ul className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
            {POINTS.map((point) => <li key={point} className="py-3.5 text-slate-700">{point}</li>)}
          </ul>
          <button type="button" onClick={() => onRequestQuote()} className={`${btnPrimary} mt-10 w-full sm:w-auto`}>
            Demander un devis solaire
          </button>
          {image && (
            <img
              src={image}
              alt="Panneaux solaires installés par AFRO Négoce"
              loading="lazy"
              decoding="async"
              className="mt-10 aspect-[16/9] w-full rounded-2xl object-cover"
              referrerPolicy="no-referrer"
            />
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <form
            onSubmit={(e) => { e.preventDefault(); requestQuote(); }}
            aria-labelledby={`${uid}-title`}
            className="rounded-[1.75rem] bg-white p-6 shadow-[0_20px_60px_rgb(15,23,42,0.08)] ring-1 ring-slate-200/80 sm:p-8"
          >
            <h3 id={`${uid}-title`} className="font-display text-xl font-bold text-afro-ink">Estimez votre installation</h3>
            <p className="mt-1 text-sm text-slate-500">Trois questions pour connaître le nombre de panneaux.</p>

            <fieldset className="mt-7">
              <legend className="text-sm font-semibold text-afro-ink">Pour quel site ?</legend>
              <div className="mt-2.5 flex rounded-xl bg-slate-100 p-1">
                {SITES.map(({ id, label }) => (
                  <button key={id} type="button" aria-pressed={site === id} onClick={() => chooseSite(id)} className={choice(site === id)}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-6">
              <label htmlFor={`${uid}-kwh`} className="text-sm font-semibold text-afro-ink">Consommation d'électricité par mois</label>
              <div className="relative mt-2.5">
                <input
                  id={`${uid}-kwh`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={kwh || ''}
                  onChange={(e) => setKwh(Math.max(Number(e.target.value), 0))}
                  className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-20 font-display text-2xl font-bold text-afro-ink tabular-nums outline-none transition focus:border-afro-blue focus:ring-4 focus:ring-afro-blue/10"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">kWh</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Indiquée sur votre facture d'électricité.</p>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-afro-ink">Besoin d'électricité le soir et la nuit ?</legend>
              <div className="mt-2.5 flex rounded-xl bg-slate-100 p-1">
                <button type="button" aria-pressed={!withBattery} onClick={() => setWithBattery(false)} className={choice(!withBattery)}>
                  Non, sans batterie
                </button>
                <button type="button" aria-pressed={withBattery} onClick={() => setWithBattery(true)} className={choice(withBattery)}>
                  Oui, avec batteries
                </button>
              </div>
            </fieldset>

            <div className="mt-7 rounded-2xl bg-afro-navy p-6 text-white" aria-live="polite">
              <p className="text-sm text-white/70">Il vous faut environ</p>
              <p className="mt-1 font-display text-4xl font-extrabold tracking-tight">
                {estimate.panels} panneau{estimate.panels > 1 ? 'x' : ''}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                {nf(estimate.kwc, 1)} kWc
                {withBattery && <> et {nf(estimate.batteryKwh)} kWh de batteries</>}, pour couvrir{' '}
                {withBattery ? 'toute votre consommation' : `votre consommation de journée (${Math.round(estimate.coverage * 100)} %)`}.
                Économie estimée : <span className="font-semibold text-afro-green">{nf(estimate.savingsYear)} MAD par an</span>.
              </p>
            </div>

            <button type="submit" className={`${btnPrimary} mt-6 w-full`}>Recevoir un devis pour cette estimation</button>
            <p className="mt-3 text-center text-xs text-slate-500">
              Estimation indicative avec des panneaux de 550 Wc. Nos techniciens confirment le dimensionnement après visite.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
