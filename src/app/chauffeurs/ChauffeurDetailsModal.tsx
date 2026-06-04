import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Plus, Trash2, CheckCircle2, XCircle, FileText, AlertTriangle } from 'lucide-react';
import { useChauffeurStore } from '../../stores/useChauffeurStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { TypeDocument } from '../../types';
import { formatDate } from '../../lib/formatters';
import { DatePicker } from '../../components/ui/DatePicker';

interface ChauffeurDetailsModalProps {
  chauffeurId: string;
  onClose: () => void;
}

export function ChauffeurDetailsModal({ chauffeurId, onClose }: ChauffeurDetailsModalProps) {
  const { chauffeurs } = useChauffeurStore();
  const { documents, addDocument, deleteDocument } = useDocumentStore();
  
  const chauffeur = chauffeurs.find(c => c.id === chauffeurId);
  const chauffeurDocuments = documents.filter(d => d.entiteId === chauffeurId && d.entiteType === 'chauffeur');

  const [activeTab, setActiveTab] = useState<'documents'>('documents');

  // Document form state
  const [docType, setDocType] = useState<TypeDocument>('permis_conduire');
  const [docRef, setDocRef] = useState('');
  const [docDateEmission, setDocDateEmission] = useState('');
  const [docDateExpiration, setDocDateExpiration] = useState('');
  const [docFichierUrl, setDocFichierUrl] = useState('');

  if (!chauffeur) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docDateEmission || !docDateExpiration) return;

    setIsSubmitting(true);
    try {
      await addDocument({
        entiteId: chauffeurId,
        entiteType: 'chauffeur',
        type: docType,
        reference: docRef,
        dateEmission: docDateEmission,
        dateExpiration: docDateExpiration,
        fichierUrl: docFichierUrl,
      });

      setDocRef('');
      setDocDateEmission('');
      setDocDateExpiration('');
      setDocFichierUrl('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface w-full max-w-3xl rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-border flex items-center justify-between bg-surface-2">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {chauffeur.prenom} {chauffeur.nom}
              </h2>
              <p className="text-sm text-text-secondary mt-1">CIN: {chauffeur.cin}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex border-b border-border px-6 bg-surface-2">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documents ({chauffeurDocuments.length})
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
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
                      <option value="permis_conduire">Permis de conduire</option>
                      <option value="visite_medicale">Visite Médicale</option>
                      <option value="formation_continue">Formation Continue</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-1">Référence (Optionnel)</label>
                    <input
                      type="text"
                      value={docRef}
                      onChange={(e) => setDocRef(e.target.value)}
                      placeholder="Ex: PER-2024-001"
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
                        <th className="px-4 py-3">Référence</th>
                        <th className="px-4 py-3">Expiration</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {chauffeurDocuments.length > 0 ? (
                        chauffeurDocuments.map((doc) => (
                          <tr key={doc.id}>
                            <td className="px-4 py-3 font-medium text-text-primary capitalize">{doc.type.replace('_', ' ')}</td>
                            <td className="px-4 py-3 text-text-secondary">{doc.reference || '-'}</td>
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
    </AnimatePresence>
  );
}
