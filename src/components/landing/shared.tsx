import React from 'react';
import { motion } from 'motion/react';

// Building blocks shared by the public landing page sections.

export const container = 'mx-auto w-full max-w-[1400px] px-5 sm:px-6 lg:px-10';

// Unsplash serves any width on demand: let the browser pick the smallest adequate one.
export const unsplashSrcSet = (url: string, widths: number[]) =>
  url.includes('images.unsplash.com') && /[?&]w=\d+/.test(url)
    ? widths.map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(', ')
    : undefined;

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <p className={`flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-afro-blue ${centered ? 'justify-center' : ''}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-afro-green" aria-hidden="true" />
      {children}
    </p>
  );
}

export function SectionHeading({ id, eyebrow, title, highlight, lead, align = 'center' }: {
  id: string;
  eyebrow: string;
  title: string;
  highlight?: string;
  lead?: string;
  align?: 'center' | 'left';
}) {
  const centered = align === 'center';
  return (
    <Reveal className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <Eyebrow centered={centered}>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-afro-ink md:text-4xl lg:text-[2.75rem]">
        {title} {highlight && <span className="text-afro-blue">{highlight}</span>}
      </h2>
      {lead && <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">{lead}</p>}
    </Reveal>
  );
}

export const btnPrimaryLook = 'items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-afro-blue text-sm font-semibold text-white shadow-[0_8px_24px_rgb(14,108,208,0.28)] transition-all hover:bg-afro-blue-dark hover:shadow-[0_10px_30px_rgb(14,108,208,0.35)]';
export const btnPrimary = `inline-flex h-12 px-6 ${btnPrimaryLook}`;
export const btnSecondary = 'inline-flex items-center justify-center gap-2 whitespace-nowrap h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-afro-ink transition-colors hover:border-afro-blue/40 hover:text-afro-blue';
