import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wrench, User, Calendar, Plus, Trash2, CheckCircle2, XCircle, FileText, AlertTriangle, Building, AlertCircle, Printer } from 'lucide-react';
import { useVehiculeStore } from '../../stores/useVehiculeStore';
import { useChauffeurStore } from '../../stores/useChauffeurStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { usePrestataireStore } from '../../stores/usePrestataireStore';
import { formatDate } from '../../lib/formatters';
import { TypeDocument } from '../../types';
import { DatePicker } from '../../components/ui/DatePicker';
import { PrintBoiteAOutilsModal } from './PrintBoiteAOutilsModal';

interface VehiculeDetailsModalProps {
  vehiculeId: string;
  onClose: () => void;
}

export function VehiculeDetailsModal({ vehiculeId, onClose }: VehiculeDetailsModalProps) {
  const { getVehiculeById, assignDriver, addEquipement, removeEquipement, updateVehicule, parcs } = useVehiculeStore();
  const chauffeurs = useChauffeurStore(s => s.chauffeurs);
  const { documents, addDocument, deleteDocument } = useDocumentStore();
  const prestataires = usePrestataireStore(s => s.prestataires);
  
  const vehicule = getVehiculeById(vehiculeId);
  const [activeTab, setActiveTab] = useState<'info' | 'chauffeur' | 'outillage' | 'documents'>('info');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Equipement form
  const [nomEquipement, setNomEquipement] = useState('');
  const [quantiteEquipement, setQuantiteEquipement] = useState(1);

  // Document form
  const [docType, setDocType] = useState<TypeDocument>('assurance');
  const [docRef, setDocRef] = useState('');
  const [docDateEmission, setDocDateEmission] = useState('');
  const [docDateExpiration, setDocDateExpiration] = useState('');
  const [docFichierUrl, setDocFichierUrl] = useState('');
  const [docPrestataire, setDocPrestataire] = useState('');
  const [docCout, setDocCout] = useState<number>(0);

  if (!vehicule) return null;

  const handleAssignDriver = (chauffeurId: string) => {
    assignDriver(vehiculeId, chauffeurId || undefined);
  };

  const handleAddEquipement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomEquipement) return;
    addEquipement(vehiculeId, {
      nom: nomEquipement,
      quantite: quantiteEquipement
    });
    setNomEquipement('');
    setQuantiteEquipement(1);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docDateEmission || !docDateExpiration) return;
    
    setIsSubmitting(true);
    try {
      await addDocument({
        entiteId: vehiculeId,
        entiteType: 'vehicule',
        type: docType,
        reference: docRef,
        dateEmission: docDateEmission,
        dateExpiration: docDateExpiration,
        fichierUrl: docFichierUrl,
        prestataire: docPrestataire,
        cout: docCout,
      });
      setDocRef('');
      setDocDateEmission('');
      setDocDateExpiration('');
      setDocFichierUrl('');
      setDocPrestataire('');
      setDocCout(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentChauffeur = chauffeurs.find(c => c.id === vehicule.chauffeurAssigneId);
  const vehiculeDocuments = documents.filter(d => d.entiteId === vehiculeId);

  const mandatoryVehicleDocs: TypeDocument[] = ['assurance', 'visite_technique', 'vignette', (vehicule.isCDC ? 'certificat_circulation' : 'carte_grise')];
  const missingDocs = mandatoryVehicleDocs.filter(type => !vehiculeDocuments.some(d => d.type === type));

  const cdcDocument = vehiculeDocuments.find(d => d.type === 'certificat_circulation');
  const isCDCExpired = cdcDocument?.status === 'expire';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {vehicule.immatriculation}
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                {vehicule.marque} {vehicule.modele}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {missingDocs.length > 0 && (
            <div className="bg-danger/10 border-b border-danger/20 p-3 px-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-danger animate-pulse" />
              <div className="text-xs font-medium text-danger">
                Documents manquants : <span className="font-bold underline">{missingDocs.map(d => d.replace('_', ' ')).join(', ')}</span>. {vehicule.isCDC && isCDCExpired && "Le CDC est expiré, veuillez ajouter la CARTE GRISE."}
              </div>
            </div>
          )}

          {vehicule.isCDC && isCDCExpired && (
            <div className="bg-warning/10 border-b border-warning/20 p-3 px-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div className="text-xs font-medium text-warning">
                Le <span className="font-bold">Certificat de Circulation (CDC)</span> est expiré. Veuillez procéder à l'ajout de la <span className="font-bold underline">Carte Grise</span> définitive.
              </div>
            </div>
          )}

          <div className="flex border-b border-border px-6 pt-4 gap-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'info' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Building className="w-4 h-4" />
              Informations
            </button>
            <button
              onClick={() => setActiveTab('chauffeur')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'chauffeur' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <User className="w-4 h-4" />
              Chauffeur Assigné
            </button>
            <button
              onClick={() => setActiveTab('outillage')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'outillage' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Boîte à outils
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'documents' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div className="bg-surface-2 p-4 rounded-xl border border-border">
                  <h3 className="text-sm font-medium text-text-secondary mb-4">Informations Générales</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Parc d'affectation</label>
                      <select
                        value={vehicule.parc || (parcs.length > 0 ? parcs[0].name : '')}
                        onChange={(e) => updateVehicule(vehicule.id, { parc: e.target.value })}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                      >
                        {parcs.map((p, pIdx) => (
                          <option key={`parc-opt-${p.id || pIdx}-${pIdx}`} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                      <div>
                        <div className="text-sm font-bold text-text-primary">Mode CDC (Certification de Circulation)</div>
                        <div className="text-xs text-text-secondary">Activer si le véhicule est en attente de carte grise définitive</div>
                      </div>
                      <button
                        onClick={() => updateVehicule(vehicule.id, { isCDC: !vehicule.isCDC })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          vehicule.isCDC ? 'bg-primary' : 'bg-border'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            vehicule.isCDC ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chauffeur' && (
              <div className="space-y-6">
                <div className="bg-surface-2 p-4 rounded-xl border border-border">
                  <h3 className="text-sm font-medium text-text-secondary mb-4">Chauffeur Actuel</h3>
                  {currentChauffeur ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {currentChauffeur.prenom[0]}{currentChauffeur.nom[0]}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{currentChauffeur.prenom} {currentChauffeur.nom}</div>
                          <div className="text-sm text-text-secondary">{currentChauffeur.telephone}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAssignDriver('')}
                        className="text-sm font-medium text-danger hover:text-danger-hover"
                      >
                        Désassigner
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-text-muted italic">Aucun chauffeur assigné actuellement.</div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-4">Assigner un nouveau chauffeur</h3>
                  <div className="space-y-2">
                    {chauffeurs.filter(c => c.status === 'actif').map((chauffeur, cIdx) => (
                      <div key={`chauffeur-card-${chauffeur.id || cIdx}-${cIdx}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-2 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-text-secondary font-medium text-sm">
                            {chauffeur.prenom[0]}{chauffeur.nom[0]}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary text-sm">{chauffeur.prenom} {chauffeur.nom}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignDriver(chauffeur.id)}
                          disabled={currentChauffeur?.id === chauffeur.id}
                          className={`text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${
                            currentChauffeur?.id === chauffeur.id
                              ? 'bg-surface-2 text-text-muted cursor-not-allowed'
                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                        >
                          {currentChauffeur?.id === chauffeur.id ? 'Assigné' : 'Assigner'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'outillage' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2 p-4 rounded-xl border border-border">
                  <div>
                    <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary" />
                      Inventaire de la Boîte à Outils
                    </h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {vehicule.outillage?.filter(o => o.status === 'present').length || 0} équipement(s) présent(s) et répertorié(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer shrink-0"
                  >
                    <Printer className="w-4 h-4 text-primary-300" />
                    Imprimer la boîte à outils
                  </button>
                </div>

                <form onSubmit={handleAddEquipement} className="flex gap-3">
                  <input
                    type="text"
                    value={nomEquipement}
                    onChange={(e) => setNomEquipement(e.target.value)}
                    placeholder="Nom de l'équipement (ex: Cric, Gilet jaune...)"
                    className="flex-1 h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    required
                  />
                  <input
                    type="number"
                    min="1"
                    value={quantiteEquipement}
                    onChange={(e) => setQuantiteEquipement(parseInt(e.target.value))}
                    className="w-24 h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    required
                  />
                  <button 
                    type="submit"
                    className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </form>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Équipement</th>
                        <th className="px-4 py-3">Qté</th>
                        <th className="px-4 py-3">Date d'ajout</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {vehicule.outillage?.length > 0 ? (
                        vehicule.outillage.map((eq, eqIdx) => (
                          <tr key={`outil-row-${eq.id || eqIdx}-${eqIdx}`} className={eq.status === 'retire' ? 'bg-surface-2/50 opacity-75' : ''}>
                            <td className="px-4 py-3 font-medium text-text-primary">{eq.nom}</td>
                            <td className="px-4 py-3 text-text-secondary">{eq.quantite}</td>
                            <td className="px-4 py-3 text-text-secondary">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(eq.dateAjout)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {eq.status === 'present' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Présent
                                </span>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
                                    <XCircle className="w-3.5 h-3.5" /> Retiré
                                  </span>
                                  {eq.dateRetrait && (
                                    <span className="text-[10px] text-text-muted">le {formatDate(eq.dateRetrait)}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {eq.status === 'present' && (
                                <button
                                  onClick={() => removeEquipement(vehicule.id, eq.id)}
                                  className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                  title="Retirer l'équipement"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                            Aucun équipement dans la boîte à outils.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <form onSubmit={handleAddDocument} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-1">Type de document</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as TypeDocument)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="assurance">Assurance</option>
                      <option value="visite_technique">Visite Technique</option>
                      <option value="vignette">Vignette</option>
                      {vehicule.isCDC ? (
                        <option value="certificat_circulation">Certification de Circulation (CDC)</option>
                      ) : (
                        <option value="carte_grise">Carte Grise</option>
                      )}
                      {vehicule.isCDC && <option value="carte_grise">Carte Grise (Définitive)</option>}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-1">Référence (Optionnel)</label>
                    <input
                      type="text"
                      value={docRef}
                      onChange={(e) => setDocRef(e.target.value)}
                      placeholder="Ex: ASS-2024-001"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Date d'émission</label>
                    <DatePicker
                      value={docDateEmission}
                      onChange={setDocDateEmission}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Date d'expiration</label>
                    <DatePicker
                      value={docDateExpiration}
                      onChange={setDocDateExpiration}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Administration / Prestataire</label>
                    <select
                      value={docPrestataire}
                      onChange={(e) => setDocPrestataire(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                      <option value="">Sélectionner une administration ou prestataire</option>
                      {prestataires
                        .filter(p => p.status === 'actif')
                        .map((p, pIdx) => (
                          <option key={`prestataire-opt-${p.id || pIdx}-${pIdx}`} value={p.nom}>{p.nom}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Coût (MAD)</label>
                    <input
                      type="number"
                      value={docCout || ''}
                      onChange={(e) => setDocCout(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full h-10 px-3 rounded-lg border border-border bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-1">Document scanné (Optionnel)</label>
                    <div className="relative border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-surface-2 transition-colors cursor-pointer">
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setDocFichierUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {docFichierUrl ? (
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">Fichier prêt</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-text-muted">
                          <FileText className="w-5 h-5" />
                          <span className="text-sm">Cliquez pour uploader (PDF, Image)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex justify-end mt-2">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className={`h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {isSubmitting ? 'Enregistrement...' : 'Ajouter le document'}
                    </button>
                  </div>
                </form>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
                      <tr>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Administration</th>
                        <th className="px-4 py-3 text-right">Coût</th>
                        <th className="px-4 py-3">Expiration</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {vehiculeDocuments.length > 0 ? (
                        vehiculeDocuments.map((doc, docIdx) => (
                          <tr key={`doc-row-${doc.id || docIdx}-${docIdx}`}>
                            <td className="px-4 py-3 font-medium text-text-primary capitalize">
                              <div>{doc.type.replace('_', ' ')}</div>
                              {doc.reference && <div className="text-[10px] text-text-muted">{doc.reference}</div>}
                            </td>
                            <td className="px-4 py-3 text-text-secondary">{doc.prestataire || '-'}</td>
                            <td className="px-4 py-3 text-text-secondary text-right">{doc.cout ? `${doc.cout} MAD` : '-'}</td>
                            <td className="px-4 py-3 text-text-secondary">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(doc.dateExpiration)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {doc.status === 'valide' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-success/10 text-success text-xs font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Valide
                                </span>
                              )}
                              {doc.status === 'expire_bientot' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Expire bientôt
                                </span>
                              )}
                              {doc.status === 'expire' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-danger/10 text-danger text-xs font-medium">
                                  <XCircle className="w-3.5 h-3.5" /> Expiré
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {doc.fichierUrl && (
                                  <a 
                                    href={doc.fichierUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                                    title="Voir le document"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() => deleteDocument(doc.id)}
                                  className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                  title="Supprimer le document"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                            Aucun document enregistré.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {isPrintModalOpen && (
        <PrintBoiteAOutilsModal
          vehicule={vehicule}
          chauffeur={chauffeurs.find(c => c.id === vehicule.chauffeurAssigneId)}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}
