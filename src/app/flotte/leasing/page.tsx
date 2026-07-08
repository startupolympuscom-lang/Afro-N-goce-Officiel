import React, { useState } from 'react';
import { useLeasingStore } from '../../../stores/useLeasingStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  Plus, 
  Search, 
  Download, 
  CreditCard, 
  Trash2,
  FileText,
  Calendar,
  Building,
  Edit2,
  Upload
} from 'lucide-react';
import { formatMAD, formatDate } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { DatePicker } from '../../../components/ui/DatePicker';

export default function LeasingPage() {
  const { contrats, addContrat, updateContrat, deleteContrat } = useLeasingStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const user = useAuthStore(s => s.user);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  // Form state
  const [vehiculeId, setVehiculeId] = useState('');
  const [organisme, setOrganisme] = useState('');
  const [referenceContrat, setReferenceContrat] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [montantTotal, setMontantTotal] = useState(0);
  const [montantMensuel, setMontantMensuel] = useState(0);
  const [dureeMois, setDureeMois] = useState(0);
  const [jourPrelevement, setJourPrelevement] = useState(5);
  const [notes, setNotes] = useState('');
  const [fichierUrl, setFichierUrl] = useState('');

  const resetForm = () => {
    setVehiculeId('');
    setOrganisme('');
    setReferenceContrat('');
    setDateDebut('');
    setDateFin('');
    setMontantTotal(0);
    setMontantMensuel(0);
    setDureeMois(0);
    setJourPrelevement(5);
    setNotes('');
    setFichierUrl('');
    setEditingId(null);
  };

  const handleOpenDrawer = (contrat?: any) => {
    if (contrat) {
      setEditingId(contrat.id);
      setVehiculeId(contrat.vehiculeId);
      setOrganisme(contrat.organisme);
      setReferenceContrat(contrat.referenceContrat);
      setDateDebut(contrat.dateDebut);
      setDateFin(contrat.dateFin);
      setMontantTotal(contrat.montantTotal);
      setMontantMensuel(contrat.montantMensuel);
      setDureeMois(contrat.dureeMois);
      setJourPrelevement(contrat.jourPrelevement);
      setNotes(contrat.notes || '');
      setFichierUrl(contrat.fichierUrl || '');
    } else {
      resetForm();
    }
    setIsDrawerOpen(true);
  };

  const handleAddContrat = (e: React.FormEvent) => {
    e.preventDefault();
    const contratData = {
      vehiculeId,
      organisme,
      referenceContrat,
      dateDebut,
      dateFin,
      montantTotal,
      montantMensuel,
      dureeMois,
      jourPrelevement,
      notes,
      fichierUrl
    };

    if (editingId) {
      updateContrat(editingId, contratData);
    } else {
      addContrat(contratData);
    }
    
    setIsDrawerOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat de leasing ?')) {
      deleteContrat(id);
    }
  };

  const calculateAmortissement = (contrat: any) => {
    const start = new Date(contrat.dateDebut);
    const end = new Date(contrat.dateFin);
    const now = new Date();
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { paye: 0, restant: contrat.montantTotal, moisEcoules: 0, moisRestants: contrat.dureeMois };
    }
    
    if (now < start) return { paye: 0, restant: contrat.montantTotal, moisEcoules: 0, moisRestants: contrat.dureeMois };
    if (now > end) return { paye: contrat.montantTotal, restant: 0, moisEcoules: contrat.dureeMois, moisRestants: 0 };
    
    const moisEcoules = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const paye = moisEcoules * contrat.montantMensuel;
    const restant = contrat.montantTotal - paye;
    
    return {
      paye,
      restant: Math.max(0, restant),
      moisEcoules,
      moisRestants: Math.max(0, contrat.dureeMois - moisEcoules)
    };
  };

  const filteredContrats = contrats.filter(c => {
    const v = vehicules.find(v => v.id === c.vehiculeId);
    const searchLower = search.toLowerCase();
    return (
      c.referenceContrat.toLowerCase().includes(searchLower) ||
      c.organisme.toLowerCase().includes(searchLower) ||
      (v && v.immatriculation.toLowerCase().includes(searchLower))
    );
  });

  const totalLeasing = filteredContrats.reduce((acc, c) => acc + c.montantTotal, 0);
  const totalRestant = filteredContrats.reduce((acc, c) => acc + calculateAmortissement(c).restant, 0);

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Gestion du Leasing
          </h1>
          <p className="text-text-secondary mt-1">Suivi des contrats de leasing et amortissements</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-surface hover:bg-surface-2 text-text-primary border border-border px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>
          {canManage && (
            <button 
              onClick={() => handleOpenDrawer()}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau contrat</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-text-secondary font-medium">Total Leasing</h3>
          </div>
          <div className="text-2xl font-bold text-text-primary">{formatMAD(totalLeasing)}</div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-warning/10 text-warning rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-text-secondary font-medium">Reste à Amortir</h3>
          </div>
          <div className="text-2xl font-bold text-text-primary">{formatMAD(totalRestant)}</div>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-success/10 text-success rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-text-secondary font-medium">Contrats Actifs</h3>
          </div>
          <div className="text-2xl font-bold text-text-primary">{filteredContrats.length}</div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Rechercher par référence, véhicule, organisme..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Référence</th>
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Organisme</th>
                <th className="px-6 py-4">Période</th>
                <th className="px-6 py-4 text-right">Montant Total</th>
                <th className="px-6 py-4 text-right">Amortissement Restant</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContrats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    <CreditCard className="w-12 h-12 mx-auto text-border-strong mb-4" />
                    <p className="text-lg font-medium text-text-primary">Aucun contrat de leasing</p>
                    <p className="text-sm">Créez un nouveau contrat pour commencer le suivi.</p>
                  </td>
                </tr>
              ) : (
                filteredContrats.map(c => {
                  const v = vehicules.find(v => v.id === c.vehiculeId);
                  const amort = calculateAmortissement(c);
                  const pctAmorti = (amort.paye / c.montantTotal) * 100;
                  
                  return (
                    <tr key={c.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          {c.referenceContrat}
                          {c.fichierUrl && (
                            <a href={c.fichierUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-hover" title="Voir le contrat">
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{v?.immatriculation}</div>
                        <div className="text-text-muted text-xs">{v?.marque} {v?.modele}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{c.organisme}</div>
                        <div className="text-text-muted text-xs">Prélèvement le {c.jourPrelevement}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-text-primary">{formatDate(c.dateDebut)} - {formatDate(c.dateFin)}</div>
                        <div className="text-text-muted text-xs">{c.dureeMois} mois</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-text-primary">{formatMAD(c.montantTotal)}</div>
                        <div className="text-text-muted text-xs">{formatMAD(c.montantMensuel)} / mois</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-medium text-warning">{formatMAD(amort.restant)}</div>
                        <div className="w-full bg-surface-2 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pctAmorti}%` }}></div>
                        </div>
                        <div className="text-text-muted text-xs mt-1">{amort.moisRestants} mois restants</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenDrawer(c)}
                                className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col border-l border-border"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  {editingId ? 'Modifier le contrat' : 'Nouveau contrat de leasing'}
                </h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-leasing-form" onSubmit={handleAddContrat} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Véhicule</label>
                    <select 
                      required
                      value={vehiculeId}
                      onChange={e => setVehiculeId(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    >
                      <option value="">Sélectionner un véhicule...</option>
                      {vehicules.map(v => (
                        <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Organisme de leasing</label>
                    <input 
                      type="text" 
                      required
                      value={organisme}
                      onChange={e => setOrganisme(e.target.value)}
                      placeholder="Ex: Wafa Bail, Maghrebail..." 
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Référence du contrat</label>
                    <input 
                      type="text" 
                      required
                      value={referenceContrat}
                      onChange={e => setReferenceContrat(e.target.value)}
                      placeholder="Ex: CT-2024-001" 
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date de début</label>
                      <DatePicker
                        value={dateDebut}
                        onChange={setDateDebut}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date de fin</label>
                      <DatePicker
                        value={dateFin}
                        onChange={setDateFin}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Montant Total (MAD)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={montantTotal}
                        onChange={e => setMontantTotal(parseFloat(e.target.value))}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Mensualité (MAD)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={montantMensuel}
                        onChange={e => setMontantMensuel(parseFloat(e.target.value))}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Durée (Mois)</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={dureeMois}
                        onChange={e => setDureeMois(parseInt(e.target.value))}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Jour de prélèvement</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        max="31"
                        value={jourPrelevement}
                        onChange={e => setJourPrelevement(parseInt(e.target.value))}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Contrat scanné (Optionnel)</label>
                    <div className="relative border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-surface-2 transition-colors cursor-pointer">
                      <input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFichierUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {fichierUrl ? (
                        <div className="flex flex-col items-center">
                          <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                          <p className="text-sm text-primary font-medium">Fichier sélectionné</p>
                          <p className="text-xs text-text-muted mt-1">Cliquez pour modifier</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                          <p className="text-sm text-text-secondary">Cliquez ou glissez pour uploader le contrat PDF</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Notes (optionnel)</label>
                    <textarea 
                      rows={3} 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full p-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" 
                      placeholder="Observations..."
                    ></textarea>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-border bg-surface-2 flex gap-3">
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 h-11 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="add-leasing-form"
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                  {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
