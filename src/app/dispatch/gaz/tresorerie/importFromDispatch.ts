/**
 * Builds simulation rows from the real data of Afro Dispatch and FleetOps.
 * Read-only: it receives copies of the data and returns new rows, nothing is written back.
 */
import { nanoid } from 'nanoid';
import type { DispatchGazDriver, GazCommande, GazPaySlip, GazSale } from '../../../../stores/useDispatchGazStore';
import type { ApprovisionnementStation, LeasingContrat, TicketCarburant, Vehicule } from '../../../../types';
import type { ChargeVariable } from '../../../../stores/useChargeVariableStore';
import { DEFAULT_COMPANY, getCompany } from '../../../../lib/dispatchCompanies';
import { countDays, daysIn, newDepense, type BankProduct, type Depense, type FlowCategory, type SimScenario } from '../../../../lib/tresorerieSim';

export interface DispatchData {
  sales: GazSale[];
  drivers: DispatchGazDriver[];
  commandes: GazCommande[];
  paySlips: GazPaySlip[];
  tickets: TicketCarburant[];
  stationSupplies: ApprovisionnementStation[];
  leasing: LeasingContrat[];
  variableCharges: ChargeVariable[];
  vehicules: Vehicule[];
}

export interface ImportResult {
  scenario: SimScenario;
  notes: string[];
}

const WINDOW_DAYS = 30;
const fmt = (v: number) => `${Math.round(v).toLocaleString('fr-FR')} MAD`;
const normalize = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function countWeekdays(start: Date, end: Date, weekdays: number[]) {
  let count = 0;
  for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) if (weekdays.includes(d.getDay())) count++;
  return count;
}

export function importFromDispatch(base: SimScenario, data: DispatchData, today = new Date()): ImportResult {
  const notes: string[] = [];
  const [y, m] = base.month.split('-').map(Number);
  const monthStart = new Date(y, m - 1, 1);
  const n = daysIn(base.month);
  // Reference period: the last 30 days for the current or a future month, the 30 days before a past month
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const windowEnd = monthStart < currentMonthStart ? new Date(monthStart) : new Date(today);
  windowEnd.setHours(0, 0, 0, 0);
  const windowStart = new Date(windowEnd);
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);
  const from = ymd(windowStart);
  const to = ymd(windowEnd);
  const inWindow = (date?: string) => !!date && date.slice(0, 10) >= from && date.slice(0, 10) < to;
  const periodLabel = `du ${windowStart.toLocaleDateString('fr-FR')} au ${new Date(windowEnd.getTime() - 86400000).toLocaleDateString('fr-FR')}`;

  const all = base.company === 'all';
  const company = all ? null : getCompany(base.company);
  const saleCompany = (s: GazSale) => s.company || data.drivers.find((d) => d.id === s.driverId)?.company || DEFAULT_COMPANY;
  // FleetOps vehicles belong to a company through their park name
  const vehicleOfCompany = (vehiculeId?: string) => {
    if (all) return true;
    const parc = data.vehicules.find((v) => v.id === vehiculeId)?.parc;
    return !!parc && normalize(parc).includes(normalize(company!.short));
  };

  // Keep the rows typed by hand, replace the previous import (empty standard rows are filled in place)
  const scenario: SimScenario = {
    ...base,
    encaissements: base.encaissements.filter((r) => r.source !== 'import'),
    // Rows added by a previous import are rebuilt; standard rows (gaz, gasoil…) are refreshed in place
    depenses: base.depenses.filter((r) => !r.id.startsWith('imp-')).map((r) => ({ ...r })),
    bankProducts: base.bankProducts.filter((r) => r.source !== 'import'),
  };
  const scale = n / WINDOW_DAYS;
  /** Puts the amount on the standard row of the category (same label), else adds a row. */
  const fill = (category: FlowCategory, monthlyAmount: number, patch: Partial<Depense> = {}) => {
    const row = scenario.depenses.find((d) => d.category === category && !d.paid && (!patch.label || d.label === patch.label))
      ?? scenario.depenses.find((d) => d.category === category && !d.paid && d.monthlyAmount === 0);
    if (row) Object.assign(row, { monthlyAmount, source: 'import', ...patch });
    else scenario.depenses.push(newDepense(n, { category, monthlyAmount, source: 'import', ...patch, id: `imp-${nanoid(8)}` }));
  };

  // 1. Sales: average per working day and share paid in cash
  const sales = data.sales.filter((s) => inWindow(s.date) && (all || saleCompany(s) === base.company));
  const salesTotal = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const workDaysInWindow = countWeekdays(windowStart, windowEnd, base.workDays);
  if (salesTotal > 0 && workDaysInWindow > 0) {
    const perDay = salesTotal / workDaysInWindow;
    scenario.monthlyTurnover = Math.round((perDay * countDays(base.month, base.workDays)) / 100) * 100;
    const cash = sales.filter((s) => s.paymentMethod !== 'credit').reduce((sum, s) => sum + s.totalPrice, 0);
    scenario.cashSharePct = Math.round((cash / salesTotal) * 100);
    notes.push(`Chiffre d'affaires : ${fmt(salesTotal)} ${periodLabel}, soit ${fmt(perDay)} par jour travaillé et ${fmt(scenario.monthlyTurnover)} sur le mois simulé ; ${scenario.cashSharePct} % payés comptant.`);
  } else {
    notes.push(`Aucune vente trouvée ${periodLabel} : saisissez le chiffre d'affaires du mois à la main.`);
  }
  // Credit sales already made: the recent ones (inside the credit delay) are expected this month, the older ones are overdue
  const unpaidCredit = data.sales.filter((s) => (all || saleCompany(s) === base.company) && s.paymentMethod === 'credit' && s.status !== 'payé' && s.date.slice(0, 10) < ymd(monthStart));
  const delayStart = new Date(monthStart);
  delayStart.setDate(delayStart.getDate() - Math.max(0, Math.round(base.creditDelayDays)));
  const recent = unpaidCredit.filter((s) => s.date.slice(0, 10) >= ymd(delayStart));
  const overdueTotal = unpaidCredit.filter((s) => s.date.slice(0, 10) < ymd(delayStart)).reduce((sum, s) => sum + s.totalPrice, 0);
  scenario.priorCredit = Math.round(recent.reduce((sum, s) => sum + s.totalPrice, 0));
  notes.push(`Clients à crédit : ${fmt(scenario.priorCredit)} de ventes à crédit des ${Math.round(base.creditDelayDays)} derniers jours du mois précédent, attendus en début de mois.`);
  if (overdueTotal > 0) {
    notes.push(`Créances en retard : ${fmt(overdueTotal)} de ventes à crédit plus anciennes non payées. Ajoutez dans « Autres rentrées d'argent » la part que vous pensez recouvrer ce mois-ci.`);
  }

  // 2. Gas suppliers (orders are not split by company)
  if (all) {
    const bySupplier = new Map<string, number>();
    data.commandes.filter((c) => inWindow(c.date)).forEach((c) => bySupplier.set(c.supplierId || 'Fournisseur gaz', (bySupplier.get(c.supplierId || 'Fournisseur gaz') ?? 0) + c.totalPrice));
    bySupplier.forEach((total, supplier) => {
      fill('fournisseur_gaz', Math.round(total * scale), { supplier, label: 'Paiement gaz' });
      notes.push(`Achats gaz ${supplier} : ${fmt(total)} ${periodLabel}, soit ${fmt(total * scale)} sur le mois (réglés jusqu'ici les lundis et jeudis).`);
    });
    const unpaid = new Map<string, number>();
    data.commandes.filter((c) => c.status === 'non payé' && c.date.slice(0, 10) < ymd(monthStart))
      .forEach((c) => unpaid.set(c.supplierId || 'Fournisseur gaz', (unpaid.get(c.supplierId || 'Fournisseur gaz') ?? 0) + c.totalPrice));
    unpaid.forEach((total, supplier) => {
      scenario.depenses.push(newDepense(n, { id: `imp-${nanoid(8)}`, label: 'Arriérés gaz (commandes non payées)', supplier, category: 'fournisseur_gaz', monthlyAmount: Math.round(total), days: [1], source: 'import' }));
      notes.push(`Arriérés ${supplier} : ${fmt(total)} de commandes non payées, ajoutés comme échéance à placer.`);
    });
  } else {
    notes.push("Les commandes gaz ne sont pas rattachées à une société : saisissez le paiement gaz de cette société à la main.");
  }

  // 3. Gasoil: fuel bought at stations (monthly average) and internal station deliveries (same dates)
  const externalFuel = data.tickets.filter((t) => t.lieu !== 'interne' && inWindow(t.dateHeure || t.createdAt) && vehicleOfCompany(t.vehiculeId));
  const fuelTotal = externalFuel.reduce((sum, t) => sum + (t.coutTotal || 0), 0);
  if (fuelTotal > 0) {
    fill('gasoil', Math.round(fuelTotal * scale), { label: 'Gasoil' });
    notes.push(`Gasoil en station : ${fmt(fuelTotal)} ${periodLabel}, soit ${fmt(fuelTotal * scale)} sur le mois.`);
  }
  const supplies = all ? data.stationSupplies.filter((a) => inWindow(a.date)) : [];
  supplies.forEach((a) => {
    scenario.depenses.push(newDepense(n, {
      id: `imp-${nanoid(8)}`, label: `Approvisionnement station (${Math.round(a.volume)} L)`, supplier: a.fournisseur || 'Fournisseur gasoil', category: 'gasoil',
      monthlyAmount: Math.round(a.coutTotal), days: [Math.min(n, new Date(a.date).getDate())], source: 'import',
    }));
  });
  if (supplies.length) notes.push(`${supplies.length} approvisionnement(s) de la station interne repris comme échéances gasoil.`);
  if (fuelTotal === 0 && supplies.length === 0) notes.push('Aucune dépense de gasoil trouvée dans FleetOps : saisissez le gasoil du mois.');

  // 4. Salaries: last payslips of the company's drivers
  const months = Array.from(new Set(data.paySlips.map((p) => p.month))).filter((mo) => mo < base.month).sort();
  const lastMonth = months[months.length - 1];
  const slips = lastMonth ? data.paySlips.filter((p) => p.month === lastMonth && (all || (data.drivers.find((d) => d.id === p.driverId)?.company || DEFAULT_COMPANY) === base.company)) : [];
  const salaries = slips.reduce((sum, p) => sum + (p.totalCommission || 0), 0);
  if (salaries > 0) {
    fill('salaires', Math.round(salaries), { label: 'Salaires' });
    notes.push(`Salaires : ${fmt(salaries)} d'après les bulletins de ${lastMonth}.`);
  } else {
    notes.push('Aucun bulletin de paie trouvé : saisissez les salaires du mois.');
  }
  notes.push('CNSS et impôts ne sont pas calculés automatiquement : saisissez leurs montants et leurs dates limites.');

  // 5. Leasing contracts running this month (bank instalments)
  data.leasing.filter((c) => c.dateDebut?.slice(0, 7) <= base.month && (!c.dateFin || c.dateFin.slice(0, 7) >= base.month) && vehicleOfCompany(c.vehiculeId))
    .forEach((c) => {
      scenario.bankProducts.push({
        id: nanoid(), type: 'echeance_pret', label: `Leasing ${c.organisme}${c.referenceContrat ? ` (${c.referenceContrat})` : ''}`, amount: Math.round(c.montantMensuel),
        rate: 0, day: Math.min(n, Math.max(1, c.jourPrelevement || 1)), repayDay: n, advanceDays: 0, fees: 0, enabled: true, source: 'import',
      } satisfies BankProduct);
    });

  // 6. Other variable charges of the vehicles (monthly average)
  const variable = data.variableCharges.filter((c) => inWindow(c.date) && vehicleOfCompany(c.vehiculeId));
  const variableTotal = variable.reduce((sum, c) => sum + (c.montant || 0), 0);
  if (variableTotal > 0) {
    fill('autre', Math.round(variableTotal * scale), { label: 'Charges diverses' });
    notes.push(`Charges diverses des véhicules : ${fmt(variableTotal)} ${periodLabel}.`);
  }

  return { scenario, notes };
}
