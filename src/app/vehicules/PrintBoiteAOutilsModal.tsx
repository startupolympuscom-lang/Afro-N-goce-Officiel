import React from 'react';
import { Printer, X, Wrench, CheckCircle2, XCircle, Truck, User, Calendar, ShieldCheck } from 'lucide-react';
import { Vehicule, Chauffeur, OutilBoite } from '../../types';
import { formatDate } from '../../lib/formatters';

interface PrintBoiteAOutilsModalProps {
  vehicule: Vehicule;
  chauffeur?: Chauffeur;
  onClose: () => void;
}

export function PrintBoiteAOutilsModal({ vehicule, chauffeur, onClose }: PrintBoiteAOutilsModalProps) {
  const outillage: OutilBoite[] = vehicule.outillage || [];
  const presents = outillage.filter(o => o.status === 'present');
  const retires = outillage.filter(o => o.status === 'retire');
  const totalQtyPresents = presents.reduce((sum, o) => sum + (o.quantite || 1), 0);

  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 overflow-y-auto print-toolbox-overlay">
      {/* Screen container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        
        {/* Screen Top Action Bar (hidden on print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <Wrench className="w-5 h-5 text-primary" />
            <span>Fiche d'inventaire - Boîte à outils ({vehicule.immatriculation})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-primary hover:bg-primary-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimer la liste
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-8 overflow-y-auto print:p-0 print:overflow-visible font-sans bg-white print-toolbox-sheet">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-5 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                  FO
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    FLEETOPS • AFRO NÉGOCE & CHAKIRINE GAZ
                  </h1>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Direction Logistique & Gestion du Parc Automobile
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-slate-100 border border-slate-300 rounded px-2.5 py-1 text-[11px] font-mono font-bold text-slate-700">
                RÉF: OUT-{vehicule.immatriculation.replace(/[^A-Za-z0-9]/g, '')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Édité le : {todayFormatted}
              </p>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center py-3 bg-slate-100 border border-slate-300 rounded-xl mb-6">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
              FICHE DE CONTRÔLE & D'INVENTAIRE DE LA BOÎTE À OUTILS
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Équipements de bord, outillages mécaniques & accessoires de sécurité
            </p>
          </div>

          {/* Vehicle & Driver Summary Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
            <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] border-b border-slate-200 pb-1.5 mb-2">
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

            <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50">
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase text-[11px] border-b border-slate-200 pb-1.5 mb-2">
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
          <div className="flex items-center gap-4 mb-4 text-xs font-semibold">
            <div className="flex-1 bg-slate-100 border border-slate-300 rounded-lg p-2 text-center">
              <span className="text-slate-500 block text-[10px] uppercase">Total Référencé</span>
              <span className="text-sm font-black text-slate-900">{outillage.length}</span>
            </div>
            <div className="flex-1 bg-emerald-50 border border-emerald-300 rounded-lg p-2 text-center text-emerald-800">
              <span className="text-emerald-600 block text-[10px] uppercase">Présents & Conformes</span>
              <span className="text-sm font-black">{presents.length} ({totalQtyPresents} pcs)</span>
            </div>
            <div className="flex-1 bg-red-50 border border-red-300 rounded-lg p-2 text-center text-red-800">
              <span className="text-red-600 block text-[10px] uppercase">Retirés / Manquants</span>
              <span className="text-sm font-black">{retires.length}</span>
            </div>
          </div>

          {/* Outillage Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 text-white font-bold text-[11px] uppercase">
                <tr>
                  <th className="p-2.5 text-center w-10 border-r border-slate-700">N°</th>
                  <th className="p-2.5 border-r border-slate-700">Désignation de l'équipement / outil</th>
                  <th className="p-2.5 text-center w-16 border-r border-slate-700">Qté</th>
                  <th className="p-2.5 text-center w-28 border-r border-slate-700">Date Ajout</th>
                  <th className="p-2.5 text-center w-28 border-r border-slate-700">État / Statut</th>
                  <th className="p-2.5 text-center w-32 border-r border-slate-700">Contrôle Visuel</th>
                  <th className="p-2.5 text-center w-24">Visa</th>
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
                      <td className="p-2 text-center border-r border-slate-300 text-slate-500 font-medium">
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
                {[...Array(outillage.length > 0 ? 3 : 8)].map((_, i) => (
                  <tr key={`blank-${i}`} className="h-8 bg-white">
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
                    <td className="p-2 text-center border-r border-slate-300 text-slate-300">
                      [ ] Présent &nbsp; [ ] Absent
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 text-slate-300">
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
          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-300 p-3 rounded-xl mb-6 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Engagement & Responsabilité du conducteur :
            </p>
            <p>
              Le conducteur soussigné atteste avoir procédé à l'inventaire contradictoire de la boîte à outils et des équipements de bord du véhicule ci-dessus désigné. Il s'engage formellement à veiller à leur maintien en bon état de propreté et d'intégrité, et à signaler immédiatement tout vol, perte ou détérioration au responsable de parc automobile.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-2">
            <div className="border border-slate-300 rounded-xl p-4 min-h-[120px] flex flex-col justify-between">
              <div>
                <p className="font-bold text-xs text-slate-900 uppercase">
                  Visa & Signature du Conducteur
                </p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  Mention manuscrite "Reçu conforme en bon état"
                </p>
              </div>
              <div className="border-b border-dashed border-slate-300 pt-8"></div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 min-h-[120px] flex flex-col justify-between">
              <div>
                <p className="font-bold text-xs text-slate-900 uppercase">
                  Visa & Cachet Responsable Parc
                </p>
                <p className="text-[10px] text-slate-500 italic mt-0.5">
                  Contrôlé et validé par le service technique
                </p>
              </div>
              <div className="border-b border-dashed border-slate-300 pt-8"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
            FLEETOPS - Système Intégré de Gestion de Flotte Automobile & Logistique • Document à conserver à bord du véhicule
          </div>
        </div>
      </div>

      {/* Embedded print style to isolate sheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .print-toolbox-overlay,
          .print-toolbox-overlay * {
            visibility: visible !important;
          }
          .print-toolbox-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 99999 !important;
          }
          .print-toolbox-sheet {
            padding: 10mm !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
