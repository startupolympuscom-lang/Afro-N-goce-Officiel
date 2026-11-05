import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 18;
// Free area of a full-page letterhead image (header rule at 57 mm, footer rule at 272 mm)...
const LETTERHEAD_AREA = { top: 66, bottom: 262 };
// ...and of the header drawn for a company without one.
const DRAWN_AREA = { top: 52, bottom: 270 };

const INK: [number, number, number] = [10, 28, 32];
const MUTED: [number, number, number] = [100, 116, 139];

export interface InvoiceLine {
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceIssuer {
  name: string;
  /** Full A4 letterhead image (public/images/documents); without one a header is drawn. */
  letterheadUrl?: string;
  tagline?: string;
  /** Contact lines for the drawn header. */
  details: string[];
  color: [number, number, number];
  accent: [number, number, number];
}

export interface InvoiceInput {
  issuer: InvoiceIssuer;
  client: { name: string; address?: string; city?: string; ice?: string; code?: string };
  /** Billing period, e.g. "NOVEMBRE 2026". */
  periodLabel: string;
  issuedOn: Date;
  lines: InvoiceLine[];
  total: number;
  fileName: string;
}

// jsPDF's standard fonts cannot draw the narrow no-break space toLocaleString uses: plain spaces only.
export const formatAmount = (value: number) => {
  const [int, dec] = Math.abs(value).toFixed(2).split('.');
  return `${value < 0 ? '-' : ''}${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec}`;
};

const letterheads = new Map<string, Promise<string>>();
function loadLetterhead(url: string) {
  const cached = letterheads.get(url);
  if (cached) return cached;
  const loading = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Papier en-tête introuvable (${res.status})`);
      return res.blob();
    })
    .then((blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    }))
    .catch((error) => {
      letterheads.delete(url);
      throw error;
    });
  letterheads.set(url, loading);
  return loading;
}

function drawHeader(doc: jsPDF, issuer: InvoiceIssuer) {
  const width = PAGE_W - 2 * MARGIN_X;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...issuer.color);
  doc.text(issuer.name, MARGIN_X, 24);
  if (issuer.tagline) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(issuer.tagline, MARGIN_X, 30);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  let y = 17;
  issuer.details.slice(0, 5).forEach((detail) => {
    doc.text(doc.splitTextToSize(detail, 78)[0], PAGE_W - MARGIN_X, y, { align: 'right' });
    y += 4.4;
  });
  doc.setFillColor(...issuer.color);
  doc.rect(MARGIN_X, 41, width * 0.62, 0.9, 'F');
  doc.setFillColor(...issuer.accent);
  doc.rect(MARGIN_X + width * 0.62, 41, width * 0.38, 0.9, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X, 279, PAGE_W - MARGIN_X, 279);
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(issuer.name, PAGE_W / 2, 285, { align: 'center' });
}

export async function buildInvoicePdf(input: InvoiceInput) {
  const { issuer } = input;
  const letterhead = issuer.letterheadUrl ? await loadLetterhead(issuer.letterheadUrl) : null;
  const { top: CONTENT_TOP, bottom: CONTENT_BOTTOM } = letterhead ? LETTERHEAD_AREA : DRAWN_AREA;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const decorated = new Set<number>();
  const decoratePage = () => {
    const page = doc.getCurrentPageInfo().pageNumber;
    if (decorated.has(page)) return;
    decorated.add(page);
    if (letterhead) doc.addImage(letterhead, 'JPEG', 0, 0, PAGE_W, PAGE_H, 'letterhead', 'FAST');
    else drawHeader(doc, issuer);
  };
  decoratePage();

  // Title and dates
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('FACTURE', MARGIN_X, CONTENT_TOP + 6);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Période :', MARGIN_X, CONTENT_TOP + 15);
  doc.text("Date d'édition :", MARGIN_X, CONTENT_TOP + 21);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.text(input.periodLabel, MARGIN_X + 28, CONTENT_TOP + 15);
  doc.text(input.issuedOn.toLocaleDateString('fr-FR'), MARGIN_X + 28, CONTENT_TOP + 21);

  // Client box
  const boxW = 84;
  const boxX = PAGE_W - MARGIN_X - boxW;
  const clientLines = [
    input.client.address,
    input.client.city,
    input.client.ice ? `ICE : ${input.client.ice}` : undefined,
    input.client.code ? `Code client : ${input.client.code}` : undefined,
  ].filter(Boolean) as string[];
  doc.setFontSize(11);
  const nameLines: string[] = doc.splitTextToSize(input.client.name.toUpperCase(), boxW - 10);
  const boxH = 12 + nameLines.length * 5 + clientLines.length * 4.6 + 2;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(boxX, CONTENT_TOP - 2, boxW, boxH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('FACTURÉ À', boxX + 5, CONTENT_TOP + 4);
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text(nameLines, boxX + 5, CONTENT_TOP + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  let y = CONTENT_TOP + 10 + nameLines.length * 5;
  clientLines.forEach((line) => {
    doc.text(doc.splitTextToSize(line, boxW - 10)[0], boxX + 5, y);
    y += 4.6;
  });

  autoTable(doc, {
    startY: Math.max(CONTENT_TOP + 32, CONTENT_TOP + boxH + 8),
    margin: { top: CONTENT_TOP, bottom: PAGE_H - CONTENT_BOTTOM, left: MARGIN_X, right: MARGIN_X },
    head: [['Article', 'Quantité', 'Prix unitaire (MAD)', 'Total (MAD)']],
    body: input.lines.map((line) => [line.label, String(line.quantity), formatAmount(line.unitPrice), formatAmount(line.total)]),
    foot: [[{ content: 'Montant total', colSpan: 3, styles: { halign: 'right' } }, `${formatAmount(input.total)} MAD`]],
    theme: 'grid',
    showHead: 'everyPage',
    showFoot: 'lastPage',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 3, textColor: INK, lineColor: [226, 232, 240], lineWidth: 0.2 },
    headStyles: { fillColor: issuer.color, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fillColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [247, 250, 250] },
    footStyles: { fillColor: [255, 255, 255], textColor: INK, fontStyle: 'bold', fontSize: 11 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 24 },
      2: { halign: 'right', cellWidth: 38 },
      3: { halign: 'right', cellWidth: 38 },
    },
    // Pages added for a long table get the letterhead before anything is drawn on them
    willDrawPage: decoratePage,
  });

  const pageCount = doc.getNumberOfPages();
  if (pageCount > 1) {
    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(`Page ${page} / ${pageCount}`, PAGE_W - MARGIN_X, CONTENT_BOTTOM + 5, { align: 'right' });
    }
  }
  return doc;
}

export async function downloadInvoicePdf(input: InvoiceInput) {
  const doc = await buildInvoicePdf(input);
  doc.save(input.fileName);
}

/** Opens the PDF in a new tab with the print dialog. */
export async function printInvoicePdf(input: InvoiceInput) {
  // Open the tab while the click still counts as a user action, or pop-up blockers stop it
  const tab = window.open('', '_blank');
  try {
    const doc = await buildInvoicePdf(input);
    doc.autoPrint();
    const url = String(doc.output('bloburl'));
    if (tab) tab.location.href = url;
    else window.location.href = url;
  } catch (error) {
    tab?.close();
    throw error;
  }
}
