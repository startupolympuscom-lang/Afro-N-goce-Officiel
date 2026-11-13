import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DispatchGazDriver, GazBrand, GlobalStockItem, StockActivityLog, StockDispatch } from '../../../../stores/useDispatchGazStore';
import { DISPATCH_COMPANIES, companyName, companyOf, companyShort } from '../../../../lib/dispatchCompanies';
import { ACTION_LABELS, type CompanyFilter, findStock, fullLeft, localDay, matchesCompany, productList } from './stockUtils';

/** jsPDF's standard fonts only cover Latin-1: replace typographic spaces and dashes. */
const clean = (s: string) => s.replace(/[  ]/g, ' ').replace(/[−–—]/g, '-');

export function generateStockReport(opts: {
  day: string; company: CompanyFilter; brands: GazBrand[]; drivers: DispatchGazDriver[];
  globalStock: GlobalStockItem[]; comptoirStock: GlobalStockItem[]; stockDispatches: StockDispatch[]; stockActivities: StockActivityLog[];
}) {
  const { day, company, brands, drivers, globalStock, comptoirStock, stockDispatches, stockActivities } = opts;
  const doc = new jsPDF();
  const brandName = (id?: string) => brands.find((b) => b.id === id)?.name || id || '-';
  const scope = company === 'all' ? 'Toutes les sociétés' : companyName(company);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport de stock GPL', 14, 20);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(clean(`${scope} - journée du ${new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR')} - édité le ${new Date().toLocaleString('fr-FR')}`), 14, 27);

  // 1. Current stock per company and product.
  const companies = DISPATCH_COMPANIES.filter((c) => company === 'all' || c.id === company);
  const openLoads = stockDispatches.filter((d) => !d.isValidated);
  const stockBody: string[][] = [];
  companies.forEach((c) => productList(brands).forEach((p) => {
    const g = findStock(globalStock, p.brandId, p.category, c.id);
    const k = findStock(comptoirStock, p.brandId, p.category, c.id);
    const truck = openLoads
      .filter((d) => d.brandId === p.brandId && d.category === p.category && companyOf(drivers.find((x) => x.id === d.driverId)?.company) === c.id)
      .reduce((s, d) => s + fullLeft(d), 0);
    const row = [g?.full || 0, g?.empty || 0, k?.full || 0, k?.empty || 0, truck, g?.damaged || 0];
    if (row.some((v) => v !== 0)) stockBody.push([c.short, brandName(p.brandId), p.category, ...row.map(String), String((g?.full || 0) + (k?.full || 0) + truck)]);
  }));
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text('Stock actuel', 14, 38);
  autoTable(doc, {
    startY: 42,
    head: [['Société', 'Marque', 'Produit', 'Dépôt pleines', 'Dépôt vides', 'Comptoir pleines', 'Comptoir vides', 'Camions', 'Avariées', 'Total pleines']],
    body: stockBody.length ? stockBody : [['-', 'Aucun stock', '', '', '', '', '', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 1.6 },
  });

  // 2. Movements of the day.
  const activities = stockActivities.filter((a) => localDay(a.date) === day && matchesCompany(company, a.company));
  const y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 50) + 12;
  doc.setFontSize(12);
  doc.text('Mouvements de la journée', 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [['Heure', 'Opération', 'Société', 'Produit', 'Pleines', 'Vides', 'Avariées', 'Détail']],
    body: activities.length
      ? [...activities].sort((a, b) => a.date.localeCompare(b.date)).map((a) => [
        clean(new Date(a.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })),
        ACTION_LABELS[a.action] || a.action,
        companyShort(a.company),
        `${brandName(a.brandId)} ${a.category || ''}`.trim(),
        a.quantityFull ? String(a.quantityFull) : '',
        a.quantityEmpty ? String(a.quantityEmpty) : '',
        a.quantityDamaged ? String(a.quantityDamaged) : '',
        clean(a.description || ''),
      ])
      : [['', 'Aucun mouvement ce jour', '', '', '', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 1.6 },
  });

  doc.save(`stock-${company === 'all' ? 'toutes-societes' : company}-${day}.pdf`);
}
