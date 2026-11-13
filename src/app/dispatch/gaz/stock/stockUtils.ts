import type { GazBrand, GazPointage, GlobalStockItem, StockActivityLog, StockDispatch, DispatchGazDriver } from '../../../../stores/useDispatchGazStore';
import { companyOf, type CompanyId } from '../../../../lib/dispatchCompanies';

export type CompanyFilter = 'all' | CompanyId;

/** YYYY-MM-DD of a date in the browser's local time. */
export const localDay = (d: Date | string = new Date()) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().split('T')[0];
};

export const sortCats = (cats: string[]) => [...cats].sort((a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b));

/** Every product (brand × category) in settings order, categories sorted by size. */
export const productList = (brands: GazBrand[]) =>
  brands.flatMap((b) => sortCats(b.categories).map((category) => ({ brand: b, brandId: b.id, category, key: `${b.id}|${category}` })));

export const matchesCompany = (filter: CompanyFilter, company?: CompanyId | null) => filter === 'all' || companyOf(company) === filter;

export const findStock = (rows: GlobalStockItem[], brandId: string, category: string, company: CompanyId) =>
  rows.find((g) => g.brandId === brandId && g.category === category && companyOf(g.company) === company);

/** Full bottles still in the truck = loaded − sold (exchange) − sold with deposit. */
export const fullLeft = (d: StockDispatch) => d.quantity - d.sold - (d.soldConsigned || 0);
/** Empties the driver must bring back = bottles sold in exchange for an empty. */
export const emptyExpected = (d: StockDispatch) => d.sold;

export const driverName = (d?: DispatchGazDriver) => (d ? `${d.prenom} ${d.nom}`.trim() : 'Chauffeur supprimé');

/** Same rule as before: a check-in today or in the last 16 hours. */
export const isCheckedIn = (pointages: GazPointage[], driverId: string) => {
  const today = localDay();
  const utcToday = new Date().toISOString().split('T')[0];
  return pointages.some((p) => {
    if (p.driverId !== driverId) return false;
    const hours = (Date.now() - new Date(p.timestamp || p.date).getTime()) / 3_600_000;
    return hours < 16 || p.date === today || p.date === utcToday;
  });
};

export const ACTION_LABELS: Record<StockActivityLog['action'], string> = {
  set_global: 'Ajustement du stock',
  dispatch_driver: 'Chargement chauffeur',
  dispatch_comptoir: 'Envoi au comptoir',
  return_driver: 'Retour chauffeur validé',
  declare_damaged: 'Bouteilles avariées',
  repair_damaged: 'Remise en service',
};

export const quantityText = (a: Pick<StockActivityLog, 'quantityFull' | 'quantityEmpty' | 'quantityDamaged'>) => {
  const parts: string[] = [];
  if (a.quantityFull) parts.push(`${a.quantityFull} pleine(s)`);
  if (a.quantityEmpty) parts.push(`${a.quantityEmpty} vide(s)`);
  if (a.quantityDamaged) parts.push(`${a.quantityDamaged} avariée(s)`);
  return parts.join(' · ') || '—';
};
