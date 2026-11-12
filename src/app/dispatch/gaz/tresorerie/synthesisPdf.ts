import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  isPositiveAndHealthy, projectMonths, stressTests,
  type Recommendation, type SimResult, type SimScenario, type Targets,
} from '../../../../lib/tresorerieSim';
import { companyName } from '../../../../lib/dispatchCompanies';

// jsPDF's standard fonts only know plain spaces and hyphens
const clean = (t: string) => t.replace(/[\u2212\u2013\u2014]/g, '-').replace(/[\u202f\u00a0]/g, ' ');
const mad = (v: number) => {
  const [int, dec] = Math.abs(Math.round(v)).toString().split('.');
  return `${v < 0 ? '-' : ''}${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${dec ? `,${dec}` : ''} MAD`;
};
const monthName = (m: string) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
};
const state = (r: SimResult) => (r.ruptureDays > 0 ? 'Rupture de paiement' : isPositiveAndHealthy(r) ? 'Positive et saine' : 'Tendue');

export interface SynthesisInput {
  scenario: SimScenario;
  scenarioName: string;
  result: SimResult;
  recommendations: Recommendation[];
  targets: Targets | null;
  runs: { name: string; result: SimResult }[];
}

/** One document for management: verdict, levers, scenarios, stress tests, projection and payment dates. */
export function exportSynthesisPdf({ scenario, scenarioName, result: r, recommendations, targets, runs }: SynthesisInput) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ink: [number, number, number] = [15, 23, 42];
  const muted: [number, number, number] = [100, 116, 139];
  let y = 18;
  const title = (text: string) => {
    if (y > 250) { doc.addPage(); y = 18; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...ink);
    doc.text(clean(text), 14, y); y += 2;
  };
  const table = (head: string[], body: (string | number)[][], right: number[] = []) => {
    autoTable(doc, {
      startY: y + 2, head: [head.map(clean)], body: body.map((row) => row.map((cell) => clean(String(cell)))), theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2, textColor: ink, lineColor: [226, 232, 240], lineWidth: 0.2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: Object.fromEntries(right.map((i) => [i, { halign: 'right' as const }])),
      margin: { left: 14, right: 14 },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY) + 8;
  };

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...ink);
  doc.text('Synthèse de trésorerie', 14, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...muted);
  y += 6;
  doc.text(clean(`${monthName(scenario.month)} · ${scenario.company === 'all' ? 'Toutes les sociétés' : companyName(scenario.company)} · Scénario : ${scenarioName} · Édité le ${new Date().toLocaleDateString('fr-FR')}`), 14, y);
  y += 4;
  doc.text('Simulation : ces chiffres ne modifient aucune donnée réelle.', 14, y);
  y += 8;

  title('1. Situation du mois');
  const verdict = r.ruptureDays > 0
    ? `Il manque ${mad(r.uncoveredNeed)} pour tout payer, à partir du ${r.firstRuptureDay}.`
    : r.netFlow < 0 ? `La trésorerie baisse de ${mad(-r.netFlow)} sur le mois (paiements reportés comptés), sans rupture de paiement.`
      : isPositiveAndHealthy(r) ? `Trésorerie positive (+${mad(r.netFlow)}) et caisse saine tout le mois.` : `Trésorerie positive (+${mad(r.netFlow)}) mais caisse tendue.`;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...ink);
  doc.text(doc.splitTextToSize(clean(verdict), 182), 14, y + 4); y += 8;
  table(['Indicateur', 'Montant'], [
    ["Chiffre d'affaires du mois", mad(r.turnover)],
    ['Dépenses du mois', mad(r.totalExpenses)],
    ['Résultat (CA - dépenses)', mad(r.turnover - r.totalExpenses)],
    ['Flux de trésorerie du mois', mad(r.cashFlow)],
    ['Paiements reportés au mois suivant', mad(r.deferredToNextMonth)],
    ['Flux net (paiements reportés comptés)', mad(r.netFlow)],
    ['Solde le 1er / en fin de mois', `${mad(r.openingBalance)} / ${mad(r.closingBalance)}`],
    ['Point le plus bas', `${mad(r.minBalance)} (le ${r.minBalanceDay})`],
    ['Ventes à crédit encaissées le mois prochain', mad(r.creditNextMonth)],
    ['Indice de santé', `${r.score} / 100`],
  ], [1]);

  if (targets && (targets.turnover !== null || targets.expenseCut || targets.cashSharePct !== null || targets.creditDelayDays !== null)) {
    title('2. Pistes pour une trésorerie positive (chacune suffit seule)');
    const rows: string[][] = [];
    if (targets.turnover !== null) rows.push(["Chiffre d'affaires minimum", mad(targets.turnover)]);
    if (targets.expenseCut) rows.push(['Réduction de toutes les dépenses', `${(targets.expenseCut.share * 100).toFixed(1).replace('.', ',')} % (${mad(targets.expenseCut.amount)})`]);
    if (targets.cashSharePct !== null) rows.push(['Part des ventes payées comptant', `${targets.cashSharePct} %`]);
    if (targets.creditDelayDays !== null) rows.push(['Délai maximum des clients à crédit', `${targets.creditDelayDays} jours`]);
    table(['Levier', 'Valeur à atteindre'], rows, [1]);
  }

  if (runs.length > 1) {
    title('3. Comparaison des scénarios');
    table(['Scénario', 'État', 'Flux net', 'Solde fin', 'Point bas', 'Besoin fin.', 'Indice'],
      runs.map((x) => [x.name, state(x.result), mad(x.result.netFlow), mad(x.result.closingBalance), mad(x.result.minBalance), mad(x.result.uncoveredNeed), `${x.result.score}`]), [2, 3, 4, 5, 6]);
  }

  title('4. Tests de résistance');
  table(['Test', 'État', 'Flux net', 'Point bas', 'Besoin fin.'],
    stressTests(scenario).map((t) => [t.label, state(t.result), mad(t.result.netFlow), mad(t.result.minBalance), mad(t.result.uncoveredNeed)]), [2, 3, 4]);

  title('5. Projection sur 3 mois (activité constante)');
  table(['Mois', 'État', 'Flux (caisse)', 'Reporté', 'Point bas', 'Solde fin'],
    projectMonths(scenario, 3).map((m) => [monthName(m.month), state(m.result), mad(m.result.cashFlow), mad(m.result.deferredToNextMonth), mad(m.result.minBalance), mad(m.result.closingBalance)]), [2, 3, 4, 5]);

  title('6. Dates de paiement conseillées');
  const plan = [...recommendations].sort((a, b) => a.recommendedDay - b.recommendedDay).map((x) => [
    x.recommendedDay > r.daysInMonth ? 'Mois suivant' : `${x.recommendedDay}`,
    `${x.label}${x.installments > 1 ? ` (${x.index + 1}/${x.installments})` : ''}`,
    mad(x.amount),
    { ok: 'OK', seuil: 'Entame le seuil', decouvert: 'Avec découvert', manque: `Manque ${mad(x.shortfall)}`, reporte: 'Reporté' }[x.status],
  ]);
  if (plan.length) table(['Jour', 'Dépense', 'Montant', 'Statut'], plan, [2]);
  else { doc.setFontSize(9); doc.text('Aucune échéance à placer.', 14, y + 4); }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); doc.setFontSize(8); doc.setTextColor(...muted);
    doc.text(`Afro Dispatch · Simulation de trésorerie · Page ${p} / ${pages}`, 105, 290, { align: 'center' });
  }
  const slug = scenarioName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'scenario';
  doc.save(`Synthese-tresorerie-${scenario.month}-${slug}.pdf`);
}
