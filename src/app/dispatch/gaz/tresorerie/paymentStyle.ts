import { normalizeDepense, type Depense } from '../../../../lib/tresorerieSim';

/** How an expense is paid, in plain words (maps onto the engine's mode / installments / locked). */
export type PaymentStyle = 'une_fois' | 'deux_fois' | 'quatre_fois' | 'chaque_jour' | 'date_fixe' | 'jours_fixes' | 'n_fois';

export const PAYMENT_STYLES: { id: PaymentStyle; label: string }[] = [
  { id: 'une_fois', label: 'En une fois' },
  { id: 'deux_fois', label: 'En 2 fois' },
  { id: 'quatre_fois', label: 'Chaque semaine (4×)' },
  { id: 'chaque_jour', label: 'Chaque jour travaillé' },
  { id: 'date_fixe', label: 'À date fixe (prélèvement)' },
];

export function styleOf(d: Depense): PaymentStyle {
  if (d.mode === 'quotidien') return 'chaque_jour';
  if (d.mode === 'jours_fixes') return 'jours_fixes';
  if (d.locked) return 'date_fixe';
  if (d.installments === 1) return 'une_fois';
  if (d.installments === 2) return 'deux_fois';
  if (d.installments === 4) return 'quatre_fois';
  return 'n_fois';
}

/** Options of the select: the standard ones, plus the current one when it is not standard. */
export const styleOptions = (d: Depense) => {
  const style = styleOf(d);
  if (style === 'jours_fixes') return [...PAYMENT_STYLES, { id: style, label: 'Jours fixes de la semaine' }];
  if (style === 'n_fois') return [...PAYMENT_STYLES, { id: style, label: `En ${d.installments} fois` }];
  return PAYMENT_STYLES;
};

export function applyStyle(d: Depense, style: PaymentStyle, n: number): Depense {
  const base = { ...d, locked: false, source: 'manuel' as const };
  switch (style) {
    case 'chaque_jour':
      return normalizeDepense({ ...base, mode: 'quotidien' }, n);
    case 'date_fixe': {
      const day = d.days[0] ?? d.windowEnd;
      return normalizeDepense({ ...base, mode: 'echeances', installments: 1, locked: true, windowStart: day, windowEnd: day, days: [day] }, n);
    }
    case 'deux_fois':
      return normalizeDepense({ ...base, mode: 'echeances', installments: 2, days: [] }, n);
    case 'quatre_fois':
      return normalizeDepense({ ...base, mode: 'echeances', installments: 4, days: [] }, n);
    case 'jours_fixes':
      return normalizeDepense({ ...base, mode: 'jours_fixes' }, n);
    case 'n_fois':
      return d;
    default:
      return normalizeDepense({ ...base, mode: 'echeances', installments: 1, days: [] }, n);
  }
}
