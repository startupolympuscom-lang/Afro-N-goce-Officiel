import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chauffeur, Vehicule } from '../../types';

const BRAND_BLUE: [number, number, number] = [11, 92, 156];
const BRAND_GREEN: [number, number, number] = [140, 198, 63];
const MISSING = 'À compléter';

export const formatTonnage = (poids?: number) =>
  poids ? `${poids.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t` : undefined;

export const getChauffeurName = (vehicule: Vehicule, chauffeurs: Chauffeur[]) => {
  const chauffeur = chauffeurs.find(c => c.id === vehicule.chauffeurAssigneId);
  return chauffeur ? `${chauffeur.prenom} ${chauffeur.nom}` : undefined;
};

interface ExportOptions {
  vehicules: Vehicule[];
  chauffeurs: Chauffeur[];
  /** Search text applied to the list, printed on the document when set. */
  filter?: string;
}

// Fleet register: one row per vehicle with its park, plate, driver, acquisition year and tonnage.
export function exportVehiculesPdf({ vehicules, chauffeurs, filter }: ExportOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const today = new Date();

  const rows = [...vehicules]
    .sort((a, b) => (a.parc || '').localeCompare(b.parc || '') || a.immatriculation.localeCompare(b.immatriculation))
    .map((v, i) => [
      String(i + 1),
      v.immatriculation,
      [v.marque, v.modele].filter(Boolean).join(' ') || MISSING,
      v.parc || MISSING,
      getChauffeurName(v, chauffeurs) ?? MISSING,
      v.anneeAcquisition ? String(v.anneeAcquisition) : MISSING,
      formatTonnage(v.poids) ?? MISSING,
    ]);

  const parcCounts = vehicules.reduce<Record<string, number>>((acc, v) => {
    const parc = v.parc || 'Sans parc';
    acc[parc] = (acc[parc] ?? 0) + 1;
    return acc;
  }, {});
  const missingCount = vehicules.filter(v => !v.chauffeurAssigneId || !v.poids || !v.anneeAcquisition || !v.parc).length;

  // Header band
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 30, pageWidth, 1.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AFRO NÉGOCE', margin, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('FleetOps · Gestion de flotte', margin, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LISTE DES VÉHICULES', pageWidth - margin, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Édité le ${today.toLocaleDateString('fr-FR')} à ${today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 20, { align: 'right' });

  // Summary
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${vehicules.length} véhicule${vehicules.length > 1 ? 's' : ''}`, margin, 41);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const summary = Object.entries(parcCounts).map(([parc, count]) => `${parc} : ${count}`).join('   ·   ');
  doc.text(summary, margin + 28, 41);
  let y = 47;
  if (filter) {
    doc.text(`Filtre appliqué : « ${filter} »`, margin, y);
    y += 6;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin, bottom: 18 },
    head: [['N°', 'Immatriculation', 'Marque & modèle', 'Parc', 'Chauffeur assigné', 'Année acq.', 'Tonnage']],
    body: rows,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.4, lineColor: [226, 232, 240], lineWidth: 0.2, textColor: [15, 23, 42], valign: 'middle' },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center', textColor: [148, 163, 184] },
      1: { cellWidth: 29, fontStyle: 'bold' },
      3: { cellWidth: 28 },
      4: { cellWidth: 38 },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.cell.raw === MISSING) {
        data.cell.styles.textColor = [217, 119, 6];
        data.cell.styles.fontStyle = 'italic';
        data.cell.styles.fontSize = 7.5;
      }
    },
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      missingCount > 0 ? `${missingCount} véhicule${missingCount > 1 ? 's' : ''} avec des informations à compléter dans FleetOps` : 'Document généré par FleetOps',
      margin,
      pageHeight - 7
    );
    doc.text(`Page ${page} / ${pageCount}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  doc.save(`vehicules_afro-negoce_${today.toISOString().slice(0, 10)}.pdf`);
}
