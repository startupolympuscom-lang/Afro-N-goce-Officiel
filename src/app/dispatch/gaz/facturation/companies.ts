import type { DispatchGazDriver, GazSale } from '../../../../stores/useDispatchGazStore';
import type { InvoiceIssuer } from './invoicePdf';
import { DEFAULT_COMPANY, type CompanyId } from '../../../../lib/dispatchCompanies';

export type InvoiceCompanyId = CompanyId;

export interface InvoiceCompany {
  id: InvoiceCompanyId;
  name: string;
  letterheadUrl?: string;
  tagline: string;
  color: [number, number, number];
  accent: [number, number, number];
}

export const INVOICE_COMPANIES: InvoiceCompany[] = [
  {
    id: 'afro_negoce',
    name: 'AFRO Négoce',
    tagline: 'Distribution de gaz et solutions énergétiques',
    color: [14, 108, 208],
    accent: [140, 198, 63],
  },
  {
    id: 'chakirine_gaz',
    name: 'Chakirine Gaz',
    tagline: 'Distribution de gaz',
    color: [180, 83, 9],
    accent: [11, 31, 58],
  },
  {
    id: 'bensaid_mek',
    name: 'Bensaid Mek Énergie',
    letterheadUrl: '/images/documents/papier-en-tete-bensaid-mek.jpg',
    tagline: 'Gaz, énergie et solutions durables',
    color: [0, 125, 115],
    accent: [249, 156, 28],
  },
];

/** Company a sale belongs to: recorded on the sale, else its driver's, Afro Négoce by default. */
export const saleCompany = (sale: GazSale, drivers: DispatchGazDriver[]) =>
  sale.company ?? drivers.find((d) => d.id === sale.driverId)?.company ?? DEFAULT_COMPANY;

export const toIssuer = (company: InvoiceCompany, details: string[]): InvoiceIssuer => ({
  name: company.name,
  letterheadUrl: company.letterheadUrl,
  tagline: company.tagline,
  details,
  color: company.color,
  accent: company.accent,
});
