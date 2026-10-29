import React, { useState } from 'react';
import { container, Reveal, Eyebrow } from './shared';

interface Logo {
  id: string;
  name: string;
  url: string;
}

const SUPPLIERS: Logo[] = [
  { id: 'vivo-energy', name: 'Vivo Energy Maroc', url: '/images/partenaires/vivo-energy-maroc.png' },
  { id: 'somap', name: 'SOMAP', url: '/images/partenaires/somap.jpg' },
];

// Shown when no partner logo is set in the CMS.
const DEFAULT_BRANDS: Logo[] = [
  { id: 'butagaz', name: 'Butagaz', url: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/3d/Logo_Butagaz.svg/1200px-Logo_Butagaz.svg.png' },
  { id: 'air-liquide', name: 'Air Liquide', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Air_Liquide_logo.svg/2560px-Air_Liquide_logo.svg.png' },
  { id: 'campingaz', name: 'Campingaz', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Campingaz_logo.svg/2560px-Campingaz_logo.svg.png' },
  { id: 'gurtner', name: 'Gurtner', url: 'https://logo.clearbit.com/gurtner.fr' },
  { id: 'nurgaz', name: 'Nurgaz', url: 'https://logo.clearbit.com/nurgaz.com.tr' },
];

function LogoTile({ logo, size, onFail }: { logo: Logo; size: 'lg' | 'sm'; onFail?: (id: string) => void }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <li
      className={`flex items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200/80 transition-shadow duration-300 hover:shadow-[0_16px_40px_rgb(15,23,42,0.08)] ${
        size === 'lg' ? 'h-28 px-4 sm:h-40 sm:px-8' : 'h-24 px-6'
      }`}
    >
      <img
        src={logo.url}
        alt={`Logo ${logo.name}`}
        loading="lazy"
        decoding="async"
        onError={() => { setFailed(true); onFail?.(logo.id); }}
        className={`w-auto object-contain ${size === 'lg' ? 'max-h-16 max-w-[85%] sm:max-h-28 sm:max-w-[75%]' : 'max-h-10 max-w-[80%]'}`}
        referrerPolicy="no-referrer"
      />
    </li>
  );
}

export function PartnersSection({ brandLogos }: { brandLogos: Logo[] }) {
  const brands = brandLogos.length > 0 ? brandLogos : DEFAULT_BRANDS;
  const [failedBrands, setFailedBrands] = useState<string[]>([]);
  const showBrands = brands.some((logo) => !failedBrands.includes(logo.id));
  return (
    <section id="partenaires" aria-labelledby="partenaires-title" className="bg-white pb-20 lg:pb-28">
      <div className={container}>
        <div className="border-t border-slate-200 pt-16 lg:pt-20">
          <Reveal className="mb-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Eyebrow>Partenaires</Eyebrow>
              <h2 id="partenaires-title" className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-afro-ink md:text-4xl">
                Nos fournisseurs <span className="text-afro-blue">et partenaires</span>
              </h2>
            </div>
            <p className="max-w-md leading-relaxed text-slate-600">
              Nous travaillons avec des acteurs reconnus de l'énergie pour garantir des approvisionnements réguliers et des produits conformes.
            </p>
          </Reveal>

          <Reveal>
            <ul className="grid grid-cols-2 gap-4">
              {SUPPLIERS.map((logo) => <LogoTile key={logo.id} logo={logo} size="lg" />)}
            </ul>
            {/* Partner logos managed in the CMS */}
            <ul className={`mt-4 grid grid-cols-2 gap-4 ${brands.length > 4 ? 'sm:grid-cols-3 lg:grid-cols-5' : 'sm:grid-cols-4'} ${showBrands ? '' : 'hidden'}`}>
              {brands.map((logo) => (
                <LogoTile key={logo.id} logo={logo} size="sm" onFail={(id) => setFailedBrands((ids) => [...ids, id])} />
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
