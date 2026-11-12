/**
 * Treasury simulation engine (pure functions, no store access).
 * It only computes a what-if month; nothing here reads or writes caisse, stock or sales data.
 */
import type { CompanyId } from './dispatchCompanies';

export type FlowCategory =
  | 'fournisseur_gaz'
  | 'gasoil'
  | 'salaires'
  | 'charges_sociales'
  | 'loyer'
  | 'impots'
  | 'banque'
  | 'autre';

export const CATEGORIES: { id: FlowCategory; label: string }[] = [
  { id: 'fournisseur_gaz', label: 'Fournisseurs gaz' },
  { id: 'gasoil', label: 'Gasoil' },
  { id: 'salaires', label: 'Salaires' },
  { id: 'charges_sociales', label: 'CNSS & charges sociales' },
  { id: 'loyer', label: 'Loyers' },
  { id: 'impots', label: 'Impôts & taxes' },
  { id: 'banque', label: 'Banque (remboursements, agios)' },
  { id: 'autre', label: 'Autres charges variables' },
];
export const categoryLabel = (id: FlowCategory) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export type RowSource = 'manuel' | 'import';

/** One-off payment due on a given day (supplier invoice, salaries, rent, tax...). */
export interface Echeance {
  id: string;
  label: string;
  supplier: string;
  category: FlowCategory;
  amount: number;
  day: number;
  /** Already paid: kept in the list but not simulated. */
  paid?: boolean;
  source?: RowSource;
}

export type Frequency = 'quotidienne' | 'hebdomadaire' | 'mensuelle';

/** Charge repeated during the month (gasoil, supplier deliveries paid on fixed weekdays...). */
export interface ChargeRecurrente {
  id: string;
  label: string;
  category: FlowCategory;
  /** Amount of each occurrence. */
  amount: number;
  frequency: Frequency;
  /** Weekdays (0 = dimanche … 6 = samedi) for weekly charges. */
  weekdays: number[];
  /** Day of month for monthly charges. */
  day: number;
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
  { id: 'decouvert', label: 'Découvert autorisé', help: 'Plafond de solde négatif autorisé ; agios calculés sur les jours débiteurs.' },
  { id: 'facilite_caisse', label: 'Facilité de caisse', help: 'Découvert de courte durée pour les décalages de fin de mois.' },
  { id: 'credit_tresorerie', label: 'Crédit de trésorerie', help: 'Montant versé à une date et remboursé avec intérêts à une autre.' },
  { id: 'escompte', label: "Escompte d'effets / affacturage", help: 'Encaissement anticipé de créances, diminué des intérêts et frais.' },
  { id: 'echeance_pret', label: 'Échéance de prêt / leasing', help: 'Prélèvement bancaire fixe à une date.' },
];
export const bankProductLabel = (id: BankProductType) => BANK_PRODUCT_TYPES.find((t) => t.id === id)?.label ?? id;

export interface BankProduct {
  id: string;
  type: BankProductType;
  label: string;
  /** Limit (découvert, facilité), amount lent, effects discounted, or instalment. */
  amount: number;
  /** Annual interest rate in %. */
  rate: number;
  /** Day the money is available (crédit, escompte) or debited (échéance). */
  day: number;
  /** Repayment day of a crédit de trésorerie. */
  repayDay: number;
  /** Days advanced by an escompte (intérêts = montant × taux × jours / 360). */
  advanceDays: number;
  /** One-off fees in MAD. */
  fees: number;
  enabled: boolean;
  source?: RowSource;
}

/** What-if levers applied on top of the scenario. */
export interface SimLevers {
  /** Change of sales volume, in %. */
  salesPct: number;
  /** Change of gasoil cost, in %. */
  gasoilPct: number;
  /** Change of the other variable charges, in %. */
  variablePct: number;
  /** Extra days negotiated with gas suppliers. */
  supplierDelayDays: number;
}

export const DEFAULT_LEVERS: SimLevers = { salesPct: 0, gasoilPct: 0, variablePct: 0, supplierDelayDays: 0 };

export interface SimScenario {
  month: string;
  company: 'all' | CompanyId;
  /** Cash + bank balance available on the 1st of the month. */
  openingBalance: number;
  /** Safety cash the cashier must keep. */
  minReserve: number;
  /** Average sales per working day (MAD). */
  dailySales: number;
  /** Weekdays with sales (0 = dimanche). */
  workDays: number[];
  /** Share of sales cashed the same day, in %. */
  cashSharePct: number;
  /** Days before credit sales are collected. */
  creditDelayDays: number;
  /** Credit sales of the previous month are collected at the start of this month (steady activity). */
  includePriorCredit: boolean;
  encaissements: EncaissementPrevu[];
  echeances: Echeance[];
  charges: ChargeRecurrente[];
  bankProducts: BankProduct[];
  levers: SimLevers;
  updatedAt?: string;
}

export const newScenario = (month: string, company: SimScenario['company']): SimScenario => ({
  month,
  company,
  openingBalance: 0,
  minReserve: 5000,
  dailySales: 0,
  workDays: [1, 2, 3, 4, 5, 6],
  cashSharePct: 70,
  creditDelayDays: 30,
  includePriorCredit: true,
  encaissements: [],
  echeances: [],
  charges: [],
  bankProducts: [],
  levers: { ...DEFAULT_LEVERS },
});

export interface FlowItem {
  label: string;
  category: FlowCategory | 'ventes' | 'encaissement' | 'banque_in';
  amount: number;
  /** Échéance id when the outflow is a one-off due date (used by the payment plan). */
  echeanceId?: string;
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
  /** Money missing on the worst day even after using the overdraft. */
  uncoveredNeed: number;
  /** Money missing on the worst day without any bank help. */
  grossNeed: number;
  /** (Opening balance + receipts) / payments. */
  coverage: number;
  outByCategory: { id: FlowCategory; label: string; amount: number; share: number }[];
  /** Supplier payments pushed past the month by the negotiated delay. */
  deferredToNextMonth: number;
  score: number;
  /** Share (0-1) obtained on each part of the index: coverage /40, no failure /30, cushion /20, bank independence /10. */
  scoreParts: { coverage: number; noRupture: number; cushion: number; bankIndependence: number };
  level: 'solvable' | 'tendu' | 'critique';
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

export const daysIn = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};
const dateOf = (month: string, day: number) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, day);
};

export function simulate(s: SimScenario): SimResult {
  const n = daysIn(s.month);
  const { levers } = s;
  const salesFactor = 1 + levers.salesPct / 100;
  const cashShare = clamp(s.cashSharePct / 100);
  const dailySales = Math.max(0, s.dailySales) * salesFactor;
  const isWorkDay = (d: Date) => s.workDays.includes(d.getDay());
  const factorFor = (category: FlowCategory) =>
    category === 'gasoil' ? 1 + levers.gasoilPct / 100 : category === 'autre' ? 1 + levers.variablePct / 100 : 1;

  const days: SimDay[] = Array.from({ length: n }, (_, i) => ({
    day: i + 1,
    date: dateOf(s.month, i + 1),
    inflows: [],
    outflows: [],
    totalIn: 0,
    totalOut: 0,
    balance: 0,
    available: 0,
    status: 'ok',
  }));
  const addIn = (day: number, item: FlowItem) => {
    if (day >= 1 && day <= n && item.amount > 0) days[day - 1].inflows.push({ ...item, amount: round2(item.amount) });
  };
  const addOut = (day: number, item: FlowItem) => {
    if (day >= 1 && day <= n && item.amount > 0) days[day - 1].outflows.push({ ...item, amount: round2(item.amount) });
  };

  // Sales: cash part the same day, credit part after the collection delay
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

  // One-off due dates; the negotiated supplier delay can push gas invoices past the month
  let deferredToNextMonth = 0;
  s.echeances.filter((e) => !e.paid).forEach((e) => {
    const day = e.category === 'fournisseur_gaz' ? e.day + Math.max(0, Math.round(levers.supplierDelayDays)) : e.day;
    const amount = e.amount * factorFor(e.category);
    if (day > n) { deferredToNextMonth += amount; return; }
    addOut(Math.max(1, day), { label: e.supplier ? `${e.supplier} - ${e.label}` : e.label, category: e.category, amount, echeanceId: e.id });
  });

  // Recurring charges
  s.charges.forEach((c) => {
    const amount = c.amount * factorFor(c.category);
    days.forEach((d) => {
      const due =
        (c.frequency === 'quotidienne' && isWorkDay(d.date)) ||
        (c.frequency === 'hebdomadaire' && c.weekdays.includes(d.date.getDay())) ||
        (c.frequency === 'mensuelle' && d.day === Math.min(c.day, n));
      if (!due) return;
      if (c.category === 'fournisseur_gaz' && levers.supplierDelayDays > 0) {
        const day = d.day + Math.round(levers.supplierDelayDays);
        if (day > n) { deferredToNextMonth += amount; return; }
        addOut(day, { label: c.label, category: c.category, amount });
        return;
      }
      addOut(d.day, { label: c.label, category: c.category, amount });
    });
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

  const operatingIn = days.reduce((sum, d) => sum + d.totalIn, 0);
  const totalOut = days.reduce((sum, d) => sum + d.totalOut, 0);
  const salesIn = days.reduce((sum, d) => sum + d.inflows.filter((f) => f.category === 'ventes').reduce((a, f) => a + f.amount, 0), 0);
  const ruptureDays = days.filter((d) => d.status === 'rupture').length;
  const daysInOverdraft = days.filter((d) => d.balance < 0).length;
  const daysBelowReserve = days.filter((d) => d.balance < s.minReserve).length;
  const firstRupture = days.find((d) => d.status === 'rupture');

  const byCat = new Map<FlowCategory, number>();
  days.forEach((d) => d.outflows.forEach((f) => {
    const cat = f.category as FlowCategory;
    byCat.set(cat, (byCat.get(cat) ?? 0) + f.amount);
  }));
  const outByCategory = CATEGORIES
    .map((c) => ({ id: c.id, label: c.label, amount: round2(byCat.get(c.id) ?? 0), share: totalOut > 0 ? (byCat.get(c.id) ?? 0) / totalOut : 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Bank money is a resource but not income: coverage uses operating receipts only
  const coverage = totalOut > 0 ? (s.openingBalance + operatingIn - bankIn) / totalOut : 2;
  const grossNeed = Math.max(0, -minBalance);
  const uncoveredNeed = Math.max(0, -(minBalance + overdraftLimit));

  // Solvency index (0-100): coverage of the month, no payment failure, cushion kept, little bank dependency
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
    days,
    daysInMonth: n,
    openingBalance: s.openingBalance,
    closingBalance: balance,
    totalIn: round2(operatingIn),
    totalOut: round2(totalOut),
    salesIn: round2(salesIn),
    bankIn: round2(bankIn),
    minBalance: minBalance === Infinity ? s.openingBalance : minBalance,
    minBalanceDay,
    overdraftLimit,
    overdraftRate,
    bankCost: round2(bankCost),
    daysInOverdraft,
    daysBelowReserve,
    ruptureDays,
    firstRuptureDay: firstRupture?.day ?? null,
    uncoveredNeed: round2(uncoveredNeed),
    grossNeed: round2(grossNeed),
    coverage,
    outByCategory,
    deferredToNextMonth: round2(deferredToNextMonth),
    score,
    scoreParts: { coverage: coverageScore / 40, noRupture: ruptureScore / 30, cushion, bankIndependence: bankScore / 10 },
    level,
  };
}

export interface PaymentMove {
  echeanceId: string;
  label: string;
  amount: number;
  fromDay: number;
  /** null: no date in the month works, the payment must be financed or moved to next month. */
  toDay: number | null;
}

/**
 * Suggests a payment plan: on each day the cashier cannot pay, the largest due date of that day
 * is moved to the first later day where it can be paid without another payment failing earlier.
 */
export function suggestPaymentPlan(s: SimScenario, maxMoves = 12): { moves: PaymentMove[]; result: SimResult } {
  let scenario: SimScenario = { ...s, echeances: s.echeances.map((e) => ({ ...e })) };
  let result = simulate(scenario);
  const moves: PaymentMove[] = [];
  const blocked = new Set<string>();
  for (let i = 0; i < maxMoves && result.firstRuptureDay !== null; i++) {
    const day = result.days[result.firstRuptureDay - 1];
    const candidates = day.outflows
      .filter((f) => f.echeanceId && !blocked.has(f.echeanceId))
      .sort((a, b) => b.amount - a.amount);
    if (candidates.length === 0) break;
    const target = candidates[0];
    const ech = scenario.echeances.find((e) => e.id === target.echeanceId)!;
    const shift = ech.category === 'fournisseur_gaz' ? Math.round(s.levers.supplierDelayDays) : 0;
    let placed: number | null = null;
    for (let t = day.day + 1; t <= result.daysInMonth; t++) {
      const trial: SimScenario = { ...scenario, echeances: scenario.echeances.map((e) => (e.id === ech.id ? { ...e, day: t - shift } : e)) };
      const r = simulate(trial);
      if (r.firstRuptureDay === null || r.firstRuptureDay > t) {
        scenario = trial;
        result = r;
        placed = t;
        break;
      }
    }
    moves.push({ echeanceId: ech.id, label: target.label, amount: target.amount, fromDay: day.day, toDay: placed });
    if (placed === null) {
      // Leave it in place and look at the next problem
      blocked.add(ech.id);
    }
  }
  return { moves, result };
}
