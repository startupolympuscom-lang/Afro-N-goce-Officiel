/** Companies managed in Afro Dispatch: each one has its own drivers, stock, comptoir and caisse. */
export type CompanyId = 'afro_negoce' | 'chakirine_gaz' | 'bensaid_mek';

export interface DispatchCompany {
  id: CompanyId;
  name: string;
  /** Name used on official documents (payslips, caisse reports). */
  legalName: string;
  /** Short label for badges and compact tables. */
  short: string;
  /** Tailwind classes for the company badge. */
  badge: string;
  /** Chart color. */
  color: string;
  /** Employer CNSS number printed on payslips (empty until provided). */
  cnssEmployeur: string;
}

export const DISPATCH_COMPANIES: DispatchCompany[] = [
  { id: 'afro_negoce', name: 'Afro Négoce', legalName: 'Ste. Afro Négoce', short: 'Afro', badge: 'bg-blue-100 text-blue-800', color: '#0B5CAD', cnssEmployeur: '9764251' },
  { id: 'chakirine_gaz', name: 'Chakirine Gaz', legalName: 'Chakirine Gaz', short: 'Chakirine', badge: 'bg-amber-100 text-amber-800', color: '#87B6E0', cnssEmployeur: '8425163' },
  { id: 'bensaid_mek', name: 'Bensaid Mek Énergie', legalName: 'Bensaid Mek Énergie', short: 'Bensaid Mek', badge: 'bg-teal-100 text-teal-800', color: '#007D73', cnssEmployeur: '' },
];

/** Records saved before companies existed belong to Afro Négoce. */
export const DEFAULT_COMPANY: CompanyId = 'afro_negoce';
export const COMPANY_IDS: CompanyId[] = DISPATCH_COMPANIES.map((c) => c.id);

export const getCompany = (id?: string | null): DispatchCompany =>
  DISPATCH_COMPANIES.find((c) => c.id === id) ?? DISPATCH_COMPANIES[0];
export const companyName = (id?: string | null) => getCompany(id).name;
export const companyShort = (id?: string | null) => getCompany(id).short;
export const companyLegalName = (id?: string | null) => getCompany(id).legalName;
export const companyOf = (id?: string | null): CompanyId => getCompany(id).id;

/** "Afro Négoce, Chakirine Gaz et Bensaid Mek Énergie" */
export const ALL_COMPANIES_LABEL = DISPATCH_COMPANIES.map((c) => c.name)
  .reduce((text, name, i, all) => (i === 0 ? name : `${text}${i === all.length - 1 ? ' et ' : ', '}${name}`), '');
