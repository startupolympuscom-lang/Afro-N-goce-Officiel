/**
 * Builds simulation rows from the real data of Afro Dispatch and FleetOps.
 * Read-only: it receives copies of the data and returns new rows, nothing is written back.
 */
import { nanoid } from 'nanoid';
import type { DispatchGazDriver, GazCommande, GazPaySlip, GazSale } from '../../../../stores/useDispatchGazStore';
import type { ApprovisionnementStation, LeasingContrat, TicketCarburant, Vehicule } from '../../../../types';
import type { ChargeVariable } from '../../../../stores/useChargeVariableStore';
import { DEFAULT_COMPANY, getCompany } from '../../../../lib/dispatchCompanies';
import { daysIn, type BankProduct, type ChargeRecurrente, type Echeance, type SimScenario } from '../../../../lib/tresorerieSim';

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

  // Keep the rows typed by hand, replace the previous import
  const scenario: SimScenario = {
    ...base,
    encaissements: base.encaissements.filter((r) => r.source !== 'import'),
    echeances: base.echeances.filter((r) => r.source !== 'import'),
    charges: base.charges.filter((r) => r.source !== 'import'),
    bankProducts: base.bankProducts.filter((r) => r.source !== 'import'),
  };

  // 1. Sales: average per working day and share paid in cash
  const sales = data.sales.filter((s) => inWindow(s.date) && (all || saleCompany(s) === base.company));
  const salesTotal = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const workDaysInWindow = countWeekdays(windowStart, windowEnd, base.workDays);
  if (salesTotal > 0 && workDaysInWindow > 0) {
    scenario.dailySales = Math.round(salesTotal / workDaysInWindow / 10) * 10;
    const cash = sales.filter((s) => s.paymentMethod !== 'credit').reduce((sum, s) => sum + s.totalPrice, 0);
    scenario.cashSharePct = Math.round((cash / salesTotal) * 100);
    notes.push(`Ventes ${periodLabel} : ${fmt(salesTotal)}, soit ${fmt(scenario.dailySales)} par jour travaillé, ${scenario.cashSharePct} % au comptant.`);
  } else {
    notes.push(`Aucune vente trouvée ${periodLabel} : saisissez les ventes journalières à la main.`);
  }
  const overdue = data.sales.filter((s) => (all || saleCompany(s) === base.company) && s.paymentMethod === 'credit' && s.status !== 'payé' && s.date.slice(0, 10) < ymd(monthStart));
  const overdueTotal = overdue.reduce((sum, s) => sum + s.totalPrice, 0);
  if (overdueTotal > 0) {
    notes.push(`Créances clients non payées : ${fmt(overdueTotal)}. Ajoutez dans « Encaissements prévus » la part que vous pensez recouvrer ce mois-ci.`);
  }

  // 2. Gas suppliers (orders are not split by company)
  if (all) {
    const bySupplier = new Map<string, number>();
    data.commandes.filter((c) => inWindow(c.date)).forEach((c) => bySupplier.set(c.supplierId || 'Fournisseur gaz', (bySupplier.get(c.supplierId || 'Fournisseur gaz') ?? 0) + c.totalPrice));
    const paymentDays = Math.max(1, countWeekdays(windowStart, windowEnd, [1, 4]));
    bySupplier.forEach((total, supplier) => {
      scenario.charges.push({
        id: nanoid(), label: `Achats gaz - ${supplier}`, category: 'fournisseur_gaz', amount: Math.round(total / paymentDays),
        frequency: 'hebdomadaire', weekdays: [1, 4], day: 1, source: 'import',
      } satisfies ChargeRecurrente);
      notes.push(`Commandes ${supplier} ${periodLabel} : ${fmt(total)}, réglées les lundis et jeudis.`);
    });
    const unpaid = new Map<string, number>();
    data.commandes.filter((c) => c.status === 'non payé' && c.date.slice(0, 10) < ymd(monthStart))
      .forEach((c) => unpaid.set(c.supplierId || 'Fournisseur gaz', (unpaid.get(c.supplierId || 'Fournisseur gaz') ?? 0) + c.totalPrice));
    unpaid.forEach((total, supplier) => {
      scenario.echeances.push({ id: nanoid(), label: 'Commandes non payées (arriérés)', supplier, category: 'fournisseur_gaz', amount: Math.round(total), day: 1, source: 'import' } satisfies Echeance);
      notes.push(`Arriérés ${supplier} : ${fmt(total)} placés au 1er du mois.`);
    });
  } else {
    notes.push("Les commandes gaz ne sont pas rattachées à une société : ajoutez les échéances fournisseurs de cette société dans « Fournisseurs & échéances ».");
  }

  // 3. Gasoil: fuel bought outside (daily average) and internal station deliveries (same dates next month)
  const externalFuel = data.tickets.filter((t) => t.lieu !== 'interne' && inWindow(t.dateHeure || t.createdAt) && vehicleOfCompany(t.vehiculeId));
  const fuelTotal = externalFuel.reduce((sum, t) => sum + (t.coutTotal || 0), 0);
  if (fuelTotal > 0 && workDaysInWindow > 0) {
    scenario.charges.push({ id: nanoid(), label: 'Gasoil stations (moyenne FleetOps)', category: 'gasoil', amount: Math.round(fuelTotal / workDaysInWindow), frequency: 'quotidienne', weekdays: [], day: 1, source: 'import' });
    notes.push(`Gasoil en station ${periodLabel} : ${fmt(fuelTotal)}.`);
  }
  if (all) {
    data.stationSupplies.filter((a) => inWindow(a.date)).forEach((a) => {
      const day = Math.min(n, new Date(a.date).getDate());
      scenario.echeances.push({ id: nanoid(), label: `Approvisionnement station (${Math.round(a.volume)} L)`, supplier: a.fournisseur || 'Fournisseur gasoil', category: 'gasoil', amount: Math.round(a.coutTotal), day, source: 'import' });
    });
  }
  if (fuelTotal === 0 && !(all && data.stationSupplies.some((a) => inWindow(a.date)))) {
    notes.push('Aucune dépense de gasoil trouvée dans FleetOps : ajoutez le gasoil dans « Charges récurrentes ».');
  }

  // 4. Salaries: last payslips of the company's drivers, paid at the end of the month
  const months = Array.from(new Set(data.paySlips.map((p) => p.month))).filter((mo) => mo < base.month).sort();
  const lastMonth = months[months.length - 1];
  if (lastMonth) {
    const slips = data.paySlips.filter((p) => p.month === lastMonth && (all || (data.drivers.find((d) => d.id === p.driverId)?.company || DEFAULT_COMPANY) === base.company));
    const total = slips.reduce((sum, p) => sum + (p.totalCommission || 0), 0);
    if (total > 0) {
      scenario.echeances.push({ id: nanoid(), label: `Salaires chauffeurs (base ${lastMonth})`, supplier: 'Personnel', category: 'salaires', amount: Math.round(total), day: n, source: 'import' });
      notes.push(`Salaires : ${fmt(total)} d'après les bulletins de ${lastMonth}, placés le ${n}. Pensez à la CNSS (avant le 10).`);
    }
  } else {
    notes.push('Aucun bulletin de paie trouvé : ajoutez les salaires et la CNSS dans « Fournisseurs & échéances ».');
  }

  // 5. Leasing contracts running this month (bank instalments)
  data.leasing.filter((c) => c.dateDebut?.slice(0, 7) <= base.month && (!c.dateFin || c.dateFin.slice(0, 7) >= base.month) && vehicleOfCompany(c.vehiculeId))
    .forEach((c) => {
      scenario.bankProducts.push({
        id: nanoid(), type: 'echeance_pret', label: `Leasing ${c.organisme}${c.referenceContrat ? ` (${c.referenceContrat})` : ''}`, amount: Math.round(c.montantMensuel),
        rate: 0, day: Math.min(n, Math.max(1, c.jourPrelevement || 1)), repayDay: n, advanceDays: 0, fees: 0, enabled: true, source: 'import',
      } satisfies BankProduct);
    });

  // 6. Other variable charges of the vehicles (daily average)
  const variable = data.variableCharges.filter((c) => inWindow(c.date) && vehicleOfCompany(c.vehiculeId));
  const variableTotal = variable.reduce((sum, c) => sum + (c.montant || 0), 0);
  if (variableTotal > 0 && workDaysInWindow > 0) {
    scenario.charges.push({ id: nanoid(), label: 'Charges variables véhicules (moyenne FleetOps)', category: 'autre', amount: Math.round(variableTotal / workDaysInWindow), frequency: 'quotidienne', weekdays: [], day: 1, source: 'import' });
    notes.push(`Charges variables véhicules ${periodLabel} : ${fmt(variableTotal)}.`);
  }

  return { scenario, notes };
}
