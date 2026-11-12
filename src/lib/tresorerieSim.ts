/**
 * Treasury simulation engine (pure functions, no store access).
 * It only computes a what-if month; nothing here reads or writes caisse, stock or sales data.
 *
 * Formulas
 *   Solde(J)                = Solde(J-1) + Encaissements(J) - Décaissements(J)
 *   Ventes par jour         = Chiffre d'affaires du mois / jours travaillés du mois
 *   Encaissements(J)        = ventes du jour × % comptant
 *                           + ventes à crédit du jour J - délai × (1 - % comptant)
 *                           + autres encaissements + fonds bancaires
 *   Capacité de paiement(J) = min(Solde(J), Solde(J+1), …, Solde(fin du mois)) - seuil de sécurité
 *                             (ce qu'on peut payer le jour J sans faire passer un jour suivant sous le seuil)
 *   Meilleur jour           = premier jour de la fenêtre autorisée où Capacité de paiement ≥ montant
 */
import type { CompanyId } from './dispatchCompanies';

export type FlowCategory =
  | 'fournisseur_gaz'
  | 'gasoil'
  | 'salaires'
  | 'charges_sociales'
  | 'impots'
  | 'loyer'
  | 'banque'
  | 'autre';

export const CATEGORIES: { id: FlowCategory; label: string }[] = [
  { id: 'fournisseur_gaz', label: 'Paiement gaz' },
  { id: 'gasoil', label: 'Gasoil' },
  { id: 'salaires', label: 'Salaires' },
  { id: 'charges_sociales', label: 'CNSS' },
  { id: 'impots', label: 'Impôts & taxes' },
  { id: 'loyer', label: 'Loyers & assurances' },
  { id: 'banque', label: 'Banque (prêts, agios)' },
  { id: 'autre', label: 'Charges diverses' },
];
export const categoryLabel = (id: FlowCategory) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export type RowSource = 'manuel' | 'import';

export type PaymentMode = 'echeances' | 'quotidien' | 'jours_fixes';
export const PAYMENT_MODES: { id: PaymentMode; label: string }[] = [
  { id: 'echeances', label: 'À échéance' },
  { id: 'quotidien', label: 'Chaque jour travaillé' },
  { id: 'jours_fixes', label: 'Jours fixes' },
];

/** One expenditure of the month (gaz, gasoil, salaires, CNSS, impôts…). */
export interface Depense {
  id: string;
  label: string;
  supplier: string;
  category: FlowCategory;
  /** Amount for the whole month. */
  monthlyAmount: number;
  mode: PaymentMode;
  /** 'echeances': number of payments in the month (amount split equally). */
  installments: number;
  /** 'echeances': allowed window, first and last day (deadline). */
  windowStart: number;
  windowEnd: number;
  /** 'echeances': planned day of each payment. */
  days: number[];
  /** 'jours_fixes': weekdays (0 = dimanche). */
  weekdays: number[];
  /** Date imposed by the creditor: the optimiser keeps the planned days. */
  locked?: boolean;
  /** Already paid this month: listed but not simulated. */
  paid?: boolean;
  source?: RowSource;
}

/** Expected receipt on a given day (collection of an old receivable, capital contribution...). */
export interface EncaissementPrevu {
  id: string;
  label: string;
  amount: number;
  day: number;
  source?: RowSource;
}

export type BankProductType = 'decouvert' | 'facilite_caisse' | 'credit_tresorerie' | 'escompte' | 'echeance_pret';

export const BANK_PRODUCT_TYPES: { id: BankProductType; label: string; help: string }[] = [
  { id: 'decouvert', label: 'Découvert autorisé', help: 'Plafond de solde négatif autorisé ; agios = montant débiteur × taux / 360 par jour débiteur.' },
  { id: 'facilite_caisse', label: 'Facilité de caisse', help: 'Découvert de courte durée pour les décalages de fin de mois ; mêmes agios que le découvert.' },
  { id: 'credit_tresorerie', label: 'Crédit de trésorerie', help: 'Versé à une date, remboursé avec intérêts = montant × taux × jours / 360.' },
  { id: 'escompte', label: "Escompte d'effets / affacturage", help: 'Encaissement anticipé de créances : reçu = montant - montant × taux × jours d’avance / 360 - frais.' },
  { id: 'echeance_pret', label: 'Échéance de prêt / leasing', help: 'Prélèvement bancaire fixe à une date.' },
];
export const bankProductLabel = (id: BankProductType) => BANK_PRODUCT_TYPES.find((t) => t.id === id)?.label ?? id;

export interface BankProduct {
  id: string;
  type: BankProductType;
  label: string;
  amount: number;
  rate: number;
  day: number;
  repayDay: number;
  advanceDays: number;
  fees: number;
  enabled: boolean;
  source?: RowSource;
}

/** What-if levers applied on top of the scenario. */
export interface SimLevers {
  /** Change of the turnover, in %. */
  salesPct: number;
  /** Change of gasoil cost, in %. */
  gasoilPct: number;
  /** Change of the charges diverses, in %. */
  variablePct: number;
  /** Extra days negotiated with gas suppliers. */
  supplierDelayDays: number;
}

export const DEFAULT_LEVERS: SimLevers = { salesPct: 0, gasoilPct: 0, variablePct: 0, supplierDelayDays: 0 };

export interface SimScenario {
  version: 2;
  month: string;
  company: 'all' | CompanyId;
  /** Cash + bank balance available on the 1st of the month. */
  openingBalance: number;
  /** Safety cash the cashier must keep. */
  minReserve: number;
  /** Chiffre d'affaires expected for the month (MAD). */
  monthlyTurnover: number;
  /** Weekdays with sales (0 = dimanche). */
  workDays: number[];
  /** Share of sales cashed the same day, in %. */
  cashSharePct: number;
  /** Days before credit sales are collected. */
  creditDelayDays: number;
  /** Credit sales of the previous month are collected at the start of this month (steady activity). */
  includePriorCredit: boolean;
  encaissements: EncaissementPrevu[];
  depenses: Depense[];
  bankProducts: BankProduct[];
  levers: SimLevers;
  updatedAt?: string;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const round2 = (v: number) => Math.round(v * 100) / 100;
let idCounter = 0;
const newId = () => `dep-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

export const daysIn = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};
const dateOf = (month: string, day: number) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, day);
};

/** Number of days of the month whose weekday is in the list. */
export const countDays = (month: string, weekdays: number[]) => {
  let count = 0;
  for (let d = 1; d <= daysIn(month); d++) if (weekdays.includes(dateOf(month, d).getDay())) count++;
  return count;
};

/** Window of payment i when the month's amount is paid in several times: the allowed window is cut in equal parts. */
export function installmentWindow(dep: Pick<Depense, 'installments' | 'windowStart' | 'windowEnd'>, i: number, n: number, extraDays = 0): [number, number] {
  const k = Math.max(1, Math.round(dep.installments));
  const start = clamp(Math.round(dep.windowStart), 1, n);
  const end = Math.max(start, Math.min(n, Math.round(dep.windowEnd)));
  const len = end - start + 1;
  const s = start + Math.floor((i * len) / k);
  const e = Math.max(s, start + Math.floor(((i + 1) * len) / k) - 1);
  return [s, e + extraDays];
}

/** Keeps one planned day per payment, inside its window (defaults to the last day of the window). */
export function normalizeDepense(dep: Depense, n: number): Depense {
  const installments = Math.max(1, Math.min(31, Math.round(dep.installments || 1)));
  const windowStart = clamp(Math.round(dep.windowStart || 1), 1, n);
  const windowEnd = clamp(Math.round(dep.windowEnd || n), windowStart, n);
  const base = { ...dep, installments, windowStart, windowEnd };
  const days = Array.from({ length: installments }, (_, i) => {
    const [s, e] = installmentWindow(base, i, n);
    const planned = dep.days?.[i];
    return planned && planned >= 1 ? clamp(Math.round(planned), 1, n) : Math.min(e, n) || s;
  });
  return { ...base, days, weekdays: dep.weekdays ?? [] };
}

export const newDepense = (n: number, patch: Partial<Depense>): Depense => normalizeDepense({
  id: newId(), label: '', supplier: '', category: 'autre', monthlyAmount: 0, mode: 'echeances', installments: 1,
  windowStart: 1, windowEnd: n, days: [], weekdays: [1], source: 'manuel', ...patch,
}, n);

/** The expenses of a month of work, to fill in. */
export const defaultDepenses = (n: number): Depense[] => [
  newDepense(n, { label: 'Paiement gaz', supplier: 'Vivo Energy', category: 'fournisseur_gaz', installments: 4 }),
  newDepense(n, { label: 'Gasoil', category: 'gasoil', mode: 'quotidien' }),
  newDepense(n, { label: 'Salaires', supplier: 'Personnel', category: 'salaires', windowStart: n - 5, windowEnd: n }),
  newDepense(n, { label: 'CNSS', supplier: 'CNSS', category: 'charges_sociales', windowStart: 1, windowEnd: 10 }),
  newDepense(n, { label: 'Impôts (TVA, IR…)', supplier: 'DGI', category: 'impots' }),
  newDepense(n, { label: 'Charges diverses', category: 'autre', days: [15] }),
];

export const newScenario = (month: string, company: SimScenario['company']): SimScenario => ({
  version: 2,
  month,
  company,
  openingBalance: 0,
  minReserve: 5000,
  monthlyTurnover: 0,
  workDays: [1, 2, 3, 4, 5, 6],
  cashSharePct: 70,
  creditDelayDays: 30,
  includePriorCredit: true,
  encaissements: [],
  depenses: defaultDepenses(daysIn(month)),
  bankProducts: [],
  levers: { ...DEFAULT_LEVERS },
});

/** Brings a saved simulation (including the first version) to the current format. */
export function normalizeScenario(raw: any): SimScenario {
  const month: string = raw?.month;
  const n = daysIn(month);
  const base = newScenario(month, raw?.company ?? 'all');
  if (raw?.version === 2) {
    return {
      ...base,
      ...raw,
      levers: { ...DEFAULT_LEVERS, ...(raw.levers ?? {}) },
      encaissements: raw.encaissements ?? [],
      bankProducts: raw.bankProducts ?? [],
      depenses: (raw.depenses ?? []).map((d: Depense) => normalizeDepense(d, n)),
    };
  }
  // First version: daily sales, one-off due dates and recurring charges
  const workDays: number[] = raw?.workDays ?? base.workDays;
  const depenses: Depense[] = [];
  (raw?.echeances ?? []).forEach((e: any) => depenses.push(normalizeDepense({
    id: e.id, label: e.label || e.supplier || 'Échéance', supplier: e.supplier ?? '', category: e.category ?? 'autre', monthlyAmount: e.amount ?? 0,
    mode: 'echeances', installments: 1, windowStart: 1, windowEnd: n, days: [e.day ?? n], weekdays: [], paid: e.paid, source: e.source,
  }, n)));
  (raw?.charges ?? []).forEach((c: any) => {
    const occurrences = c.frequency === 'quotidienne' ? countDays(month, workDays) : c.frequency === 'hebdomadaire' ? countDays(month, c.weekdays ?? []) : 1;
    depenses.push(normalizeDepense({
      id: c.id, label: c.label || 'Charge', supplier: '', category: c.category ?? 'autre', monthlyAmount: (c.amount ?? 0) * occurrences,
      mode: c.frequency === 'quotidienne' ? 'quotidien' : c.frequency === 'hebdomadaire' ? 'jours_fixes' : 'echeances',
      installments: 1, windowStart: 1, windowEnd: n, days: [c.day ?? 1], weekdays: c.weekdays ?? [1], source: c.source,
    }, n));
  });
  return {
    ...base,
    openingBalance: raw?.openingBalance ?? 0,
    minReserve: raw?.minReserve ?? base.minReserve,
    monthlyTurnover: Math.round((raw?.dailySales ?? 0) * countDays(month, workDays)),
    workDays,
    cashSharePct: raw?.cashSharePct ?? base.cashSharePct,
    creditDelayDays: raw?.creditDelayDays ?? base.creditDelayDays,
    includePriorCredit: raw?.includePriorCredit ?? true,
    encaissements: raw?.encaissements ?? [],
    depenses: depenses.length ? depenses : base.depenses,
    bankProducts: raw?.bankProducts ?? [],
    levers: { ...DEFAULT_LEVERS, ...(raw?.levers ?? {}) },
  };
}

export interface FlowItem {
  label: string;
  category: FlowCategory | 'ventes' | 'encaissement' | 'banque_in';
  amount: number;
  depenseId?: string;
  installment?: number;
}

export interface SimDay {
  day: number;
  date: Date;
  inflows: FlowItem[];
  outflows: FlowItem[];
  totalIn: number;
  totalOut: number;
  balance: number;
  /** Balance + authorised overdraft. */
  available: number;
  status: 'ok' | 'sous_seuil' | 'decouvert' | 'rupture';
}

export interface SimResult {
  days: SimDay[];
  daysInMonth: number;
  workDaysCount: number;
  dailySales: number;
  turnover: number;
  /** Expenses of the month after levers (bank excluded). */
  totalExpenses: number;
  openingBalance: number;
  closingBalance: number;
  totalIn: number;
  totalOut: number;
  salesIn: number;
  bankIn: number;
  minBalance: number;
  minBalanceDay: number;
  overdraftLimit: number;
  overdraftRate: number;
  bankCost: number;
  daysInOverdraft: number;
  daysBelowReserve: number;
  ruptureDays: number;
  firstRuptureDay: number | null;
  uncoveredNeed: number;
  grossNeed: number;
  coverage: number;
  outByCategory: { id: FlowCategory; label: string; amount: number; share: number }[];
  deferredToNextMonth: number;
  score: number;
  scoreParts: { coverage: number; noRupture: number; cushion: number; bankIndependence: number };
  level: 'solvable' | 'tendu' | 'critique';
}

export interface SimulateOptions {
  /** Days to use for the 'echeances' payments instead of the planned ones (recommended schedule). */
  days?: Record<string, number[]>;
  /** Leave out the movable payments (used to measure the payment capacity). */
  withoutMovable?: boolean;
}

const factorFor = (levers: SimLevers, category: FlowCategory) =>
  category === 'gasoil' ? 1 + levers.gasoilPct / 100 : category === 'autre' ? 1 + levers.variablePct / 100 : 1;

export const isMovable = (d: Depense) => d.mode === 'echeances' && !d.locked && !d.paid && d.monthlyAmount > 0;

export function simulate(s: SimScenario, opts: SimulateOptions = {}): SimResult {
  const n = daysIn(s.month);
  const { levers } = s;
  const workDaysCount = countDays(s.month, s.workDays);
  const salesFactor = 1 + levers.salesPct / 100;
  const cashShare = clamp(s.cashSharePct / 100);
  const dailySales = workDaysCount > 0 ? (Math.max(0, s.monthlyTurnover) * salesFactor) / workDaysCount : 0;
  const isWorkDay = (d: Date) => s.workDays.includes(d.getDay());
  const delay = Math.max(0, Math.round(levers.supplierDelayDays));

  const days: SimDay[] = Array.from({ length: n }, (_, i) => ({
    day: i + 1, date: dateOf(s.month, i + 1), inflows: [], outflows: [], totalIn: 0, totalOut: 0, balance: 0, available: 0, status: 'ok',
  }));
  const addIn = (day: number, item: FlowItem) => {
    if (day >= 1 && day <= n && item.amount > 0) days[day - 1].inflows.push({ ...item, amount: round2(item.amount) });
  };
  let deferredToNextMonth = 0;
  const addOut = (day: number, item: FlowItem) => {
    if (item.amount <= 0) return;
    if (day > n) { deferredToNextMonth += item.amount; return; }
    days[Math.max(1, day) - 1].outflows.push({ ...item, amount: round2(item.amount) });
  };

  // Turnover: cash part the same day, credit part after the collection delay
  days.forEach((d) => {
    if (isWorkDay(d.date)) addIn(d.day, { label: 'Ventes au comptant', category: 'ventes', amount: dailySales * cashShare });
    const soldOn = new Date(d.date);
    soldOn.setDate(soldOn.getDate() - Math.max(0, Math.round(s.creditDelayDays)));
    const soldThisMonth = soldOn.getMonth() === d.date.getMonth() && soldOn.getFullYear() === d.date.getFullYear();
    if (isWorkDay(soldOn) && (soldThisMonth || s.includePriorCredit)) {
      addIn(d.day, { label: 'Encaissement ventes à crédit', category: 'ventes', amount: dailySales * (1 - cashShare) });
    }
  });
  s.encaissements.forEach((e) => addIn(e.day, { label: e.label || 'Encaissement prévu', category: 'encaissement', amount: e.amount }));

  // Expenses of the month
  let totalExpenses = 0;
  s.depenses.forEach((dep) => {
    if (dep.paid || dep.monthlyAmount <= 0) return;
    const amount = dep.monthlyAmount * factorFor(levers, dep.category);
    totalExpenses += amount;
    const label = dep.supplier && dep.supplier !== dep.label ? `${dep.label} - ${dep.supplier}` : dep.label || categoryLabel(dep.category);
    const gasShift = dep.category === 'fournisseur_gaz' ? delay : 0;
    if (dep.mode === 'echeances') {
      if (opts.withoutMovable && isMovable(dep)) return;
      const k = Math.max(1, dep.installments);
      const override = isMovable(dep) ? opts.days?.[dep.id] : undefined;
      for (let i = 0; i < k; i++) {
        const planned = dep.days[i] ?? n;
        // A recommended day already takes the negotiated delay into account
        const day = override ? override[i] : planned + (dep.locked ? 0 : gasShift);
        addOut(day, { label: k > 1 ? `${label} (${i + 1}/${k})` : label, category: dep.category, amount: amount / k, depenseId: dep.id, installment: i });
      }
      return;
    }
    const due = days.filter((d) => (dep.mode === 'quotidien' ? isWorkDay(d.date) : dep.weekdays.includes(d.date.getDay())));
    due.forEach((d) => addOut(d.day + gasShift, { label, category: dep.category, amount: amount / due.length, depenseId: dep.id }));
  });

  // Bank products
  const products = s.bankProducts.filter((p) => p.enabled && p.amount > 0);
  const lines = products.filter((p) => p.type === 'decouvert' || p.type === 'facilite_caisse');
  const overdraftLimit = lines.reduce((sum, p) => sum + p.amount, 0);
  const overdraftRate = overdraftLimit > 0 ? lines.reduce((sum, p) => sum + p.amount * p.rate, 0) / overdraftLimit : 0;
  let bankIn = 0;
  let bankCost = 0;
  lines.forEach((p) => { if (p.fees > 0) { addOut(Math.max(1, p.day || 1), { label: `Frais - ${p.label}`, category: 'banque', amount: p.fees }); bankCost += p.fees; } });
  products.forEach((p) => {
    if (p.type === 'credit_tresorerie') {
      const repay = Math.max(p.day, p.repayDay || n);
      const interest = (p.amount * p.rate) / 100 * (repay - p.day) / 360;
      addIn(p.day, { label: p.label || 'Crédit de trésorerie', category: 'banque_in', amount: p.amount });
      bankIn += p.amount;
      if (p.fees > 0) addOut(p.day, { label: `Frais - ${p.label}`, category: 'banque', amount: p.fees });
      if (repay <= n) addOut(repay, { label: `Remboursement - ${p.label}`, category: 'banque', amount: p.amount + interest });
      bankCost += interest + p.fees;
    } else if (p.type === 'escompte') {
      const cost = (p.amount * p.rate) / 100 * Math.max(0, p.advanceDays) / 360 + p.fees;
      addIn(p.day, { label: p.label || 'Escompte', category: 'banque_in', amount: p.amount - cost });
      bankIn += p.amount - cost;
      bankCost += cost;
    } else if (p.type === 'echeance_pret') {
      addOut(p.day, { label: p.label || 'Échéance de prêt', category: 'banque', amount: p.amount });
    }
  });

  // Day-by-day balance; overdraft interest accrues on debit days and is charged on the last day
  let balance = s.openingBalance;
  let agios = 0;
  let minBalance = Infinity;
  let minBalanceDay = 1;
  days.forEach((d, i) => {
    d.totalIn = round2(d.inflows.reduce((sum, f) => sum + f.amount, 0));
    if (i === n - 1 && agios > 0) d.outflows.push({ label: 'Agios du découvert', category: 'banque', amount: round2(agios) });
    d.totalOut = round2(d.outflows.reduce((sum, f) => sum + f.amount, 0));
    balance = round2(balance + d.totalIn - d.totalOut);
    if (balance < 0) agios += (Math.min(-balance, overdraftLimit) * overdraftRate) / 100 / 360;
    d.balance = balance;
    d.available = round2(balance + overdraftLimit);
    d.status = d.available < 0 ? 'rupture' : balance < 0 ? 'decouvert' : balance < s.minReserve ? 'sous_seuil' : 'ok';
    if (balance < minBalance) { minBalance = balance; minBalanceDay = d.day; }
  });
  bankCost += days[n - 1].outflows.find((f) => f.label === 'Agios du découvert')?.amount ?? 0;

  const allIn = days.reduce((sum, d) => sum + d.totalIn, 0);
  const totalOut = days.reduce((sum, d) => sum + d.totalOut, 0);
  const salesIn = days.reduce((sum, d) => sum + d.inflows.filter((f) => f.category === 'ventes').reduce((a, f) => a + f.amount, 0), 0);
  const ruptureDays = days.filter((d) => d.status === 'rupture').length;
  const daysInOverdraft = days.filter((d) => d.balance < 0).length;
  const daysBelowReserve = days.filter((d) => d.balance < s.minReserve).length;
  const firstRupture = days.find((d) => d.status === 'rupture');

  const byCat = new Map<FlowCategory, number>();
  days.forEach((d) => d.outflows.forEach((f) => byCat.set(f.category as FlowCategory, (byCat.get(f.category as FlowCategory) ?? 0) + f.amount)));
  const outByCategory = CATEGORIES
    .map((c) => ({ id: c.id, label: c.label, amount: round2(byCat.get(c.id) ?? 0), share: totalOut > 0 ? (byCat.get(c.id) ?? 0) / totalOut : 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Bank money is a resource but not income: coverage uses operating receipts only
  const coverage = totalOut > 0 ? (s.openingBalance + allIn - bankIn) / totalOut : 2;
  const grossNeed = Math.max(0, -minBalance);
  const uncoveredNeed = Math.max(0, -(minBalance + overdraftLimit));

  // Solvency index (0-100) = 40 × couverture + 30 × jours sans rupture + 20 × coussin + 10 × autonomie bancaire
  const coverageScore = clamp((coverage - 0.85) / (1.25 - 0.85)) * 40;
  const ruptureScore = clamp(1 - ruptureDays / 5) * 30;
  const cushion = s.minReserve > 0 ? clamp((minBalance + overdraftLimit) / (s.minReserve + overdraftLimit)) : minBalance >= 0 ? 1 : 0;
  const cushionScore = cushion * 20;
  const bankScore = clamp(1 - daysInOverdraft / n) * 10;
  let score = Math.round(coverageScore + ruptureScore + cushionScore + bankScore);
  if (ruptureDays > 0) score = Math.min(score, 39);
  // Paying only thanks to the overdraft is a tense situation, not a comfortable one
  else if (daysInOverdraft > 0) score = Math.min(score, 69);
  const level: SimResult['level'] = score >= 70 ? 'solvable' : score >= 40 ? 'tendu' : 'critique';

  return {
    days, daysInMonth: n, workDaysCount, dailySales: round2(dailySales), turnover: round2(Math.max(0, s.monthlyTurnover) * salesFactor),
    totalExpenses: round2(totalExpenses), openingBalance: s.openingBalance, closingBalance: balance,
    totalIn: round2(allIn), totalOut: round2(totalOut), salesIn: round2(salesIn), bankIn: round2(bankIn),
    minBalance: minBalance === Infinity ? s.openingBalance : minBalance, minBalanceDay, overdraftLimit, overdraftRate, bankCost: round2(bankCost),
    daysInOverdraft, daysBelowReserve, ruptureDays, firstRuptureDay: firstRupture?.day ?? null,
    uncoveredNeed: round2(uncoveredNeed), grossNeed: round2(grossNeed), coverage, outByCategory, deferredToNextMonth: round2(deferredToNextMonth),
    score, scoreParts: { coverage: coverageScore / 40, noRupture: ruptureScore / 30, cushion, bankIndependence: bankScore / 10 }, level,
  };
}

export interface Recommendation {
  depenseId: string;
  label: string;
  category: FlowCategory;
  index: number;
  installments: number;
  amount: number;
  window: [number, number];
  plannedDay: number;
  /** Best day; above the number of days in the month = moved to next month. */
  recommendedDay: number;
  /** ok: above the safety cash; seuil: only by using part of the safety cash; decouvert: needs the overdraft; manque: not enough even with it; reporte: next month. */
  status: 'ok' | 'seuil' | 'decouvert' | 'manque' | 'reporte';
  shortfall: number;
  /** Payment capacity of each day of the window when this payment was placed. */
  capacity: { day: number; value: number }[];
}

/** At an equal deadline, salaries and legal charges are protected before suppliers. */
const PAYMENT_PRIORITY: Record<FlowCategory, number> = {
  salaires: 0, charges_sociales: 1, impots: 2, banque: 3, loyer: 4, fournisseur_gaz: 5, gasoil: 6, autre: 7,
};

/**
 * Best days: payments are placed one by one, the most urgent deadline first (then salaries and legal charges, then the largest amount),
 * on the first day of their window whose payment capacity covers them; the capacity of the following days
 * is then reduced by the amount paid.
 */
export function optimizeSchedule(s: SimScenario): { recommendations: Recommendation[]; days: Record<string, number[]>; result: SimResult } {
  const n = daysIn(s.month);
  const base = simulate(s, { withoutMovable: true });
  const cum = base.days.map((d) => d.balance);
  const reserve = Math.max(0, s.minReserve);
  const limit = base.overdraftLimit;
  const delay = Math.max(0, Math.round(s.levers.supplierDelayDays));
  const capacityAt = (day: number) => Math.min(...cum.slice(day - 1)) - reserve;

  const todo = s.depenses.filter(isMovable).flatMap((dep) => {
    const k = Math.max(1, dep.installments);
    const amount = (dep.monthlyAmount * factorFor(s.levers, dep.category)) / k;
    const label = dep.label || categoryLabel(dep.category);
    return Array.from({ length: k }, (_, i) => ({
      dep, i, k, amount, label,
      window: installmentWindow(dep, i, n, dep.category === 'fournisseur_gaz' ? delay : 0),
    }));
  }).sort((a, b) => a.window[1] - b.window[1] || PAYMENT_PRIORITY[a.dep.category] - PAYMENT_PRIORITY[b.dep.category] || b.amount - a.amount);

  const recommendations: Recommendation[] = [];
  const days: Record<string, number[]> = {};
  todo.forEach(({ dep, i, k, amount, label, window }) => {
    const [ws, we] = window;
    const lastInMonth = Math.min(we, n);
    const capacity: Recommendation['capacity'] = [];
    for (let d = ws; d <= lastInMonth; d++) capacity.push({ day: d, value: round2(capacityAt(d)) });
    let day = capacity.find((c) => c.value >= amount)?.day;
    let status: Recommendation['status'] = 'ok';
    let shortfall = 0;
    if (day === undefined && reserve > 0) {
      day = capacity.find((c) => c.value + reserve >= amount)?.day;
      status = 'seuil';
    }
    if (day === undefined && limit > 0) {
      day = capacity.find((c) => c.value + reserve + limit >= amount)?.day;
      status = 'decouvert';
    }
    if (day === undefined && we > n) {
      day = we;
      status = 'reporte';
    }
    if (day === undefined) {
      day = lastInMonth;
      status = 'manque';
      shortfall = round2(amount - (capacityAt(day) + reserve + limit));
    }
    if (day <= n) for (let t = day; t <= n; t++) cum[t - 1] -= amount;
    (days[dep.id] ??= Array.from({ length: k }, (_, j) => dep.days[j] ?? n))[i] = day;
    recommendations.push({ depenseId: dep.id, label, category: dep.category, index: i, installments: k, amount: round2(amount), window, plannedDay: dep.days[i] ?? n, recommendedDay: day, status, shortfall, capacity });
  });

  return { recommendations, days, result: simulate(s, { days }) };
}
