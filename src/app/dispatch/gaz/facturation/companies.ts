import type { DispatchGazDriver, GazSale } from '../../../../stores/useDispatchGazStore';
import type { InvoiceIssuer } from './invoicePdf';

export type InvoiceCompanyId = 'afro_negoce' | 'chakirine_gaz' | 'bensaid_mek';

export interface InvoiceCompany {
  id: InvoiceCompanyId;
  name: string;
  /** Company whose sales the invoice draws on; null offers every sale (no driver belongs to it). */
  salesOf: 'afro_negoce' | 'chakirine_gaz' | null;
  letterheadUrl?: string;
  tagline: string;
  color: [number, number, number];
  accent: [number, number, number];
}

export const INVOICE_COMPANIES: InvoiceCompany[] = [
  {
    id: 'afro_negoce',
    name: 'AFRO Négoce',
    salesOf: 'afro_negoce',
    tagline: 'Distribution de gaz et solutions énergétiques',
    color: [14, 108, 208],
    accent: [140, 198, 63],
  },
  {
    id: 'chakirine_gaz',
    name: 'Chakirine Gaz',
    salesOf: 'chakirine_gaz',
    tagline: 'Distribution de gaz',
    color: [180, 83, 9],
    accent: [11, 31, 58],
  },
  {
    id: 'bensaid_mek',
    name: 'Bensaid Mek Énergie',
    salesOf: null,
    letterheadUrl: '/images/documents/papier-en-tete-bensaid-mek.jpg',
    tagline: 'Gaz, énergie et solutions durables',
    color: [0, 125, 115],
    accent: [249, 156, 28],
  },
];

/** Company a sale belongs to: recorded on the sale, else its driver's, Afro Négoce by default. */
export const saleCompany = (sale: GazSale, drivers: DispatchGazDriver[]) =>
  sale.company ?? drivers.find((d) => d.id === sale.driverId)?.company ?? 'afro_negoce';

export const toIssuer = (company: InvoiceCompany, details: string[]): InvoiceIssuer => ({
  name: company.name,
  letterheadUrl: company.letterheadUrl,
  tagline: company.tagline,
  details,
  color: company.color,
  accent: company.accent,
});
