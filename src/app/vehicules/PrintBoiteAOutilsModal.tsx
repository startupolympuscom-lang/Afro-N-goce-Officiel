import React, { useState } from 'react';
import { Printer, X, Wrench, CheckCircle2, XCircle, Truck, User, Calendar, ShieldCheck, Check, Compass } from 'lucide-react';
import { Vehicule, Chauffeur, OutilBoite } from '../../types';
import { formatDate } from '../../lib/formatters';

interface PrintBoiteAOutilsModalProps {
  vehicule: Vehicule;
  chauffeur?: Chauffeur;
  onClose: () => void;
}

function escapeHtml(str?: string | number | null): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function PrintBoiteAOutilsModal({ vehicule, chauffeur, onClose }: PrintBoiteAOutilsModalProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const outillage: OutilBoite[] = vehicule.outillage || [];
  const presents = outillage.filter(o => o.status === 'present');
  const retires = outillage.filter(o => o.status === 'retire');
  const totalQtyPresents = presents.reduce((sum, o) => sum + (o.quantite || 1), 0);

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const generatePrintHtml = (): string => {
    const immatClean = escapeHtml(vehicule.immatriculation);
    const marqueModele = escapeHtml(`${vehicule.marque || ''} ${vehicule.modele || ''}`.trim());
    const km = escapeHtml(vehicule.kilometrageActuel ? `${vehicule.kilometrageActuel.toLocaleString()} km` : 'N/A');
    const parc = escapeHtml(vehicule.parc || 'Afro Négoce');
    const typeVehicule = vehicule.poids ? `${vehicule.poids} T` : (vehicule.isCDC ? 'Camion Citerne' : 'Poids Lourd');

    const chauffeurNom = chauffeur ? escapeHtml(`${chauffeur.prenom || ''} ${chauffeur.nom || ''}`.trim()) : 'Non assigné';
    const chauffeurCin = chauffeur?.cin ? escapeHtml(chauffeur.cin) : '-';
    const chauffeurTel = chauffeur?.telephone ? escapeHtml(chauffeur.telephone) : '-';
    const chauffeurPermis = chauffeur ? escapeHtml(`${chauffeur.numeroPermis || 'N/A'} (Cat. ${chauffeur.categoriePermis || 'EC'})`) : '-';

    const tableRows = outillage.length > 0 ? outillage.map((eq, idx) => {
      const isPresent = eq.status === 'present';
      const statusHtml = isPresent
        ? `<span class="badge-present">✔ PRÉSENT</span>`
        : `<span class="badge-retire">✖ RETIRÉ ${eq.dateRetrait ? `(${escapeHtml(formatDate(eq.dateRetrait))})` : ''}</span>`;

      return `
        <tr class="${!isPresent ? 'retire-row' : idx % 2 === 1 ? 'alt' : ''}">
          <td class="center font-mono bold">${idx + 1}</td>
          <td class="bold text-main">${escapeHtml(eq.nom)}</td>
          <td class="center bold text-dark">${escapeHtml(eq.quantite || 1)}</td>
          <td class="center text-muted">${escapeHtml(formatDate(eq.dateAjout))}</td>
          <td class="center">${statusHtml}</td>
          <td class="center text-muted text-sm">[ &nbsp; ] Bon état &nbsp;&nbsp;&nbsp; [ &nbsp; ] Défaillant</td>
          <td class="center text-muted">______</td>
        </tr>
      `;
    }).join('') : `
      <tr>
        <td colspan="7" class="center text-muted" style="padding: 14px;">Aucun outil enregistré numériquement. Renseigner manuellement ci-dessous :</td>
      </tr>
    `;

    // Extra blank rows for manual checks
    const blankCount = Math.max(3, 7 - outillage.length);
    const blankRows = Array.from({ length: blankCount }).map((_, i) => `
      <tr class="blank-row">
        <td class="center text-light">${outillage.length + i + 1}</td>
        <td class="dashed-cell"><span class="text-light">........................................................................................</span></td>
        <td class="center text-light">....</td>
        <td class="center text-light">../../....</td>
        <td class="center text-light">[ &nbsp; ] Présent &nbsp; [ &nbsp; ] Absent</td>
        <td class="center text-light">[ &nbsp; ] Conforme &nbsp; [ &nbsp; ] À remplacer</td>
        <td class="center text-light">______</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Fiche_Inventaire_Boite_Outils_${immatClean}</title>
  <style>
    @page {
      size: landscape;
      margin: 8mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10.5px;
      line-height: 1.35;
    }
    .sheet {
      width: 100%;
      max-width: 280mm;
      margin: 0 auto;
      padding: 4mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-badge {
      width: 34px;
      height: 34px;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 14px;
      border-radius: 6px;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 2px 0 0 0;
    }
    .header-right {
      text-align: right;
    }
    .ref-badge {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 3px 8px;
      font-family: monospace;
      font-weight: 800;
      font-size: 11px;
      color: #1e293b;
    }
    .date-text {
      font-size: 9.5px;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .doc-banner {
      text-align: center;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 10px;
    }
    .doc-title {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0f172a;
      letter-spacing: 0.6px;
      margin: 0;
    }
    .doc-sub {
      font-size: 9.5px;
      color: #475569;
      margin: 2px 0 0 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }
    .info-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #fcfdfe;
    }
    .card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 6px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 2.5px;
    }
    .info-label {
      color: #64748b;
    }
    .info-val {
      font-weight: 600;
      color: #0f172a;
    }
    .kpi-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    .kpi-card {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 8px;
      text-align: center;
      background: #f8fafc;
    }
    .kpi-card.green {
      background: #f0fdf4;
      border-color: #86efac;
      color: #166534;
    }
    .kpi-card.red {
      background: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
    }
    .kpi-label {
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
    }
    .kpi-num {
      font-size: 13px;
      font-weight: 900;
      margin-top: 1px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 10px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9px;
      padding: 5px 7px;
      border: 1px solid #334155;
      text-align: left;
    }
    th.center, td.center {
      text-align: center;
    }
    td {
      padding: 4.5px 7px;
      border: 1px solid #cbd5e1;
      color: #0f172a;
    }
    tr.alt {
      background: #f8fafc;
    }
    tr.retire-row {
      background: #fef2f2;
    }
    tr.blank-row {
      height: 24px;
      background: #ffffff;
    }
    .font-mono {
      font-family: monospace;
    }
    .bold {
      font-weight: 700;
    }
    .text-main {
      color: #0f172a;
    }
    .text-dark {
      color: #1e293b;
    }
    .text-muted {
      color: #64748b;
    }
    .text-light {
      color: #cbd5e1;
    }
    .text-sm {
      font-size: 9px;
    }
    .dashed-cell {
      border-right: 1px solid #cbd5e1;
    }
    .badge-present {
      color: #15803d;
      font-weight: 800;
      font-size: 9.5px;
    }
    .badge-retire {
      color: #b91c1c;
      font-weight: 800;
      font-size: 9.5px;
    }
    .attestation {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.35;
      margin-bottom: 10px;
    }
    .attestation-title {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 8px;
    }
    .sig-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      height: 85px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
    }
    .sig-title {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
    }
    .sig-sub {
      font-size: 8.5px;
      color: #64748b;
      font-style: italic;
      margin-top: 1px;
    }
    .sig-line {
      border-bottom: 1px dashed #cbd5e1;
      padding-top: 24px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 5px;
      text-align: center;
      font-size: 8.5px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="logo-badge">FO</div>
        <div>
          <h1 class="brand-title">FLEETOPS • AFRO NÉGOCE & CHAKIRINE GAZ</h1>
          <p class="brand-sub">Direction Logistique & Gestion du Parc Automobile</p>
        </div>
      </div>
      <div class="header-right">
        <div class="ref-badge">RÉF: OUT-${immatClean.replace(/[^A-Za-z0-9]/g, '')}</div>
        <p class="date-text">Édité le : ${escapeHtml(todayFormatted)} (Format Paysage)</p>
      </div>
    </div>

    <!-- Document Title Banner -->
    <div class="doc-banner">
      <h2 class="doc-title">FICHE DE CONTRÔLE & D'INVENTAIRE DE LA BOÎTE À OUTILS</h2>
      <p class="doc-sub">Équipements de bord, outillages mécaniques & accessoires de sécurité obligatoires</p>
    </div>

    <!-- 2-Column Info Grid -->
    <div class="grid-2">
      <!-- Vehicule Info -->
      <div class="info-card">
        <div class="card-title">🚛 INFORMATIONS VÉHICULE</div>
        <div class="info-row">
          <span class="info-label">Immatriculation :</span>
          <span class="info-val font-mono" style="font-size: 11px;">${immatClean}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Marque & Modèle :</span>
          <span class="info-val">${marqueModele || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Kilométrage Actuel :</span>
          <span class="info-val">${km}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Parc d'attache :</span>
          <span class="info-val">${parc} (${typeVehicule})</span>
        </div>
      </div>

      <!-- Conducteur Info -->
      <div class="info-card">
        <div class="card-title">👤 CONDUCTEUR AFFECTÉ</div>
        <div class="info-row">
          <span class="info-label">Nom & Prénom :</span>
          <span class="info-val" style="font-weight: 700;">${chauffeurNom}</span>
        </div>
        <div class="info-row">
          <span class="info-label">N° CIN :</span>
          <span class="info-val font-mono">${chauffeurCin}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Téléphone :</span>
          <span class="info-val">${chauffeurTel}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Permis de conduire :</span>
          <span class="info-val">${chauffeurPermis}</span>
        </div>
      </div>
    </div>

    <!-- KPI Summary Row -->
    <div class="kpi-row">
      <div class="kpi-card">
        <span class="kpi-label">Total Référencé</span>
        <span class="kpi-num">${outillage.length}</span>
      </div>
      <div class="kpi-card green">
        <span class="kpi-label">Présents & Conformes</span>
        <span class="kpi-num">${presents.length} (${totalQtyPresents} pcs)</span>
      </div>
      <div class="kpi-card red">
        <span class="kpi-label">Retirés / Manquants</span>
        <span class="kpi-num">${retires.length}</span>
      </div>
    </div>

    <!-- Outillage Table -->
    <table>
      <thead>
        <tr>
          <th class="center" style="width: 32px;">N°</th>
          <th>Désignation de l'équipement / outil</th>
          <th class="center" style="width: 48px;">Qté</th>
          <th class="center" style="width: 90px;">Date Ajout</th>
          <th class="center" style="width: 120px;">État / Statut</th>
          <th class="center" style="width: 180px;">Contrôle Visuel</th>
          <th class="center" style="width: 70px;">Visa</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
        ${blankRows}
      </tbody>
    </table>

    <!-- Attestation Text -->
    <div class="attestation">
      <div class="attestation-title">🛡️ Engagement & Responsabilité du conducteur :</div>
      Le conducteur soussigné atteste avoir procédé à l'inventaire contradictoire de la boîte à outils et des équipements de bord du véhicule désigné. Il s'engage formellement à veiller à leur maintien en bon état de propreté et d'intégrité, et à signaler sans délai toute perte, vol ou détérioration au responsable du parc automobile.
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-card">
        <div>
          <div class="sig-title">Visa & Signature du Conducteur</div>
          <div class="sig-sub">Mention manuscrite "Reçu conforme en bon état"</div>
        </div>
        <div class="sig-line"></div>
      </div>

      <div class="sig-card">
        <div>
          <div class="sig-title">Visa & Cachet Responsable Parc Automobile</div>
          <div class="sig-sub">Contrôlé et validé par la Direction Technique & Logistique</div>
        </div>
        <div class="sig-line"></div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      FLEETOPS - Système Intégré de Gestion de Flotte Automobile & Logistique • Document officiel à conserver à bord du véhicule
    </div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    setIsPrinting(true);

    try {
      // Create hidden iframe dedicated to printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        setIsPrinting(false);
        return;
      }

      const htmlContent = generatePrintHtml();
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Trigger print inside the isolated document
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.error('Error invoking print on iframe, falling back to window.print', printErr);
          window.print();
        } finally {
          setIsPrinting(false);
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }
      }, 350);
    } catch (err) {
      console.error('Failed to prepare print iframe', err);
      window.print();
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto print-toolbox-overlay">
      {/* Screen container - Styled in Landscape proportions */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden my-auto flex flex-col max-h-[94vh] print-toolbox-container">
        
        {/* Screen Top Action Bar (hidden on print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-extrabold text-sm sm:text-base">
                  Fiche d'inventaire - Boîte à outils
                </span>
                <span className="font-mono bg-slate-200/80 text-slate-800 text-xs px-2 py-0.5 rounded font-bold">
                  {vehicule.immatriculation}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                  <Compass className="w-3 h-3 rotate-45" /> Format : A4 Paysage (Landscape)
                </span>
                <span className="text-[11px] text-slate-400">
                  {outillage.length} équipement{outillage.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPrinting}
              onClick={handlePrint}
              className="bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? 'Préparation...' : 'Imprimer la fiche (Paysage)'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Preview */}
        <div className="p-6 sm:p-8 overflow-y-auto font-sans bg-white print-toolbox-sheet">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm">
                FO
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  FLEETOPS • AFRO NÉGOCE & CHAKIRINE GAZ
                </h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Direction Logistique & Gestion du Parc Automobile
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-[11px] font-mono font-bold text-slate-800">
                RÉF: OUT-{vehicule.immatriculation.replace(/[^A-Za-z0-9]/g, '')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                Édité le : {todayFormatted} • <span className="font-semibold text-slate-700">Format Paysage</span>
              </p>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="text-center py-2.5 bg-slate-100 border border-slate-300 rounded-xl mb-4">
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
              FICHE DE CONTRÔLE & D'INVENTAIRE DE LA BOÎTE À OUTILS
            </h2>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Équipements de bord, outillages mécaniques & accessoires de sécurité
            </p>
          </div>

          {/* Vehicle & Driver Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/60">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[10px] border-b border-slate-200 pb-1.5 mb-2">
                <Truck className="w-3.5 h-3.5 text-primary" /> Informations Véhicule
              </h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Immatriculation :</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{vehicule.immatriculation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Marque & Modèle :</span>
                  <span className="font-semibold text-slate-800">{vehicule.marque} {vehicule.modele}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kilométrage actuel :</span>
                  <span className="font-bold text-slate-800">{vehicule.kilometrageActuel.toLocaleString()} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parc d'attache :</span>
                  <span className="font-semibold text-slate-800">{vehicule.parc || 'Afro Négoce'}</span>
                </div>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/60">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[10px] border-b border-slate-200 pb-1.5 mb-2">
                <User className="w-3.5 h-3.5 text-primary" /> Conducteur Affecté
              </h3>
              <div className="space-y-1.5">
                {chauffeur ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nom & Prénom :</span>
                      <span className="font-bold text-slate-900">{chauffeur.nom} {chauffeur.prenom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">N° CIN :</span>
                      <span className="font-mono font-semibold text-slate-800">{chauffeur.cin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Téléphone :</span>
                      <span className="font-semibold text-slate-800">{chauffeur.telephone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Permis N° :</span>
                      <span className="font-semibold text-slate-800">{chauffeur.numeroPermis || 'N/A'} (Cat. {chauffeur.categoriePermis || 'EC'})</span>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-slate-500 italic">
                    Aucun chauffeur assigné à ce véhicule pour le moment.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 mb-4 text-xs font-semibold">
            <div className="flex-1 bg-slate-100 border border-slate-300 rounded-lg p-2 text-center">
              <span className="text-slate-500 block text-[9.5px] uppercase">Total Référencé</span>
              <span className="text-sm font-black text-slate-900">{outillage.length}</span>
            </div>
            <div className="flex-1 bg-emerald-50 border border-emerald-300 rounded-lg p-2 text-center text-emerald-800">
              <span className="text-emerald-600 block text-[9.5px] uppercase">Présents & Conformes</span>
              <span className="text-sm font-black">{presents.length} ({totalQtyPresents} pcs)</span>
            </div>
            <div className="flex-1 bg-red-50 border border-red-300 rounded-lg p-2 text-center text-red-800">
              <span className="text-red-600 block text-[9.5px] uppercase">Retirés / Manquants</span>
              <span className="text-sm font-black">{retires.length}</span>
            </div>
          </div>

          {/* Outillage Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 text-white font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-2 text-center w-10 border-r border-slate-700">N°</th>
                  <th className="p-2 border-r border-slate-700">Désignation de l'équipement / outil</th>
                  <th className="p-2 text-center w-14 border-r border-slate-700">Qté</th>
                  <th className="p-2 text-center w-24 border-r border-slate-700">Date Ajout</th>
                  <th className="p-2 text-center w-28 border-r border-slate-700">État / Statut</th>
                  <th className="p-2 text-center w-36 border-r border-slate-700">Contrôle Visuel</th>
                  <th className="p-2 text-center w-20">Visa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {outillage.length > 0 ? (
                  outillage.map((eq, idx) => (
                    <tr key={`outil-row-${eq.id || idx}-${idx}`} className={eq.status === 'retire' ? 'bg-red-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                      <td className="p-2 text-center font-mono font-bold text-slate-500 border-r border-slate-300">
                        {idx + 1}
                      </td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-300">
                        {eq.nom}
                      </td>
                      <td className="p-2 text-center font-black text-slate-800 border-r border-slate-300">
                        {eq.quantite}
                      </td>
                      <td className="p-2 text-center text-slate-600 border-r border-slate-300">
                        {formatDate(eq.dateAjout)}
                      </td>
                      <td className="p-2 text-center border-r border-slate-300">
                        {eq.status === 'present' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> PRÉSENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-red-700">
                            <XCircle className="w-3.5 h-3.5" /> RETIRÉ {eq.dateRetrait ? `(${formatDate(eq.dateRetrait)})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center border-r border-slate-300 text-slate-500 font-medium text-[11px]">
                        [ ] Bon état &nbsp; [ ] À remplacer
                      </td>
                      <td className="p-2 text-center text-slate-400">
                        ______
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500 italic">
                      Aucun équipement enregistré dans le système. Remplir manuellement les lignes ci-dessous :
                    </td>
                  </tr>
                )}

                {/* Additional manual blank rows for manual checks */}
                {[...Array(outillage.length > 0 ? 3 : 6)].map((_, i) => (
                  <tr key={`blank-${i}`} className="h-7 bg-white">
                    <td className="p-2 text-center font-mono text-slate-300 border-r border-slate-300">
                      {outillage.length + i + 1}
                    </td>
                    <td className="p-2 border-r border-slate-300 border-dashed">
                      <span className="text-slate-300">....................................................................</span>
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 text-slate-300">
                      ....
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 text-slate-300">
                      ../../....
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 text-slate-300 text-[10px]">
                      [ ] Présent &nbsp; [ ] Absent
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 text-slate-300 text-[10px]">
                      [ ] Conforme &nbsp; [ ] Défaillant
                    </td>
                    <td className="p-2 text-center text-slate-300">
                      ______
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Attestation text */}
          <div className="text-[10px] text-slate-600 bg-slate-50 border border-slate-300 p-2.5 rounded-xl mb-4 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-0.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Engagement & Responsabilité du conducteur :
            </p>
            <p>
              Le conducteur soussigné atteste avoir procédé à l'inventaire contradictoire de la boîte à outils et des équipements de bord du véhicule ci-dessus désigné. Il s'engage formellement à veiller à leur maintien en bon état de propreté et d'intégrité, et à signaler immédiatement tout vol, perte ou détérioration au responsable de parc automobile.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-1">
            <div className="border border-slate-300 rounded-xl p-3 min-h-[95px] flex flex-col justify-between">
              <div>
                <p className="font-bold text-xs text-slate-900 uppercase">
                  Visa & Signature du Conducteur
                </p>
                <p className="text-[9px] text-slate-500 italic mt-0.5">
                  Mention manuscrite "Reçu conforme en bon état"
                </p>
              </div>
              <div className="border-b border-dashed border-slate-300 pt-6"></div>
            </div>

            <div className="border border-slate-300 rounded-xl p-3 min-h-[95px] flex flex-col justify-between">
              <div>
                <p className="font-bold text-xs text-slate-900 uppercase">
                  Visa & Cachet Responsable Parc
                </p>
                <p className="text-[9px] text-slate-500 italic mt-0.5">
                  Contrôlé et validé par le service technique
                </p>
              </div>
              <div className="border-b border-dashed border-slate-300 pt-6"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400">
            FLEETOPS - Système Intégré de Gestion de Flotte Automobile & Logistique • Document officiel à conserver à bord du véhicule
          </div>
        </div>
      </div>

      {/* Embedded print style to enforce landscape if printed via browser shortcut */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body > *:not(.print-toolbox-overlay) {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          .print-toolbox-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 999999 !important;
          }
          .print-toolbox-container {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            max-height: none !important;
            border-radius: 0 !important;
          }
          .print-toolbox-sheet {
            padding: 4mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
