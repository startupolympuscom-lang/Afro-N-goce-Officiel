import React, { useState } from 'react';
import { useChargeVariableStore } from '../../../stores/useChargeVariableStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  Plus, 
  Search, 
  Wallet, 
  Trash2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { formatMAD, formatDate } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { DatePicker } from '../../../components/ui/DatePicker';

export default function ChargesVariablesPage() {
  const { charges, addCharge, deleteCharge } = useChargeVariableStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const user = useAuthStore(s => s.user);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  // Form state
  const [vehiculeId, setVehiculeId] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState(0);

  const handleAddCharge = (e: React.FormEvent) => {
    e.preventDefault();
    addCharge({
      vehiculeId,
      date: new Date(date).toISOString(),
      description,
      montant
    });
    setIsDrawerOpen(false);
    // Reset form
    setVehiculeId('');
    setDate('');
    setDescription('');
    setMontant(0);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette charge variable ?')) {
      deleteCharge(id);
    }
  };

  const filteredCharges = charges.filter(c => {
    const vehicule = vehicules.find(veh => veh.id === c.vehiculeId);
    const searchLower = search.toLowerCase();
    return vehicule?.immatriculation.toLowerCase().includes(searchLower) ||
           vehicule?.marque.toLowerCase().includes(searchLower) ||
           c.description.toLowerCase().includes(searchLower);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Charges Variables
          </h1>
          <p className="text-text-secondary mt-1">Suivi des dépenses imprévues par véhicule</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle Charge</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-2/50 rounded-t-xl">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Rechercher par immatriculation ou description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Véhicule</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Montant</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCharges.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-text-secondary">
                    <Wallet className="w-12 h-12 mx-auto text-border-strong mb-4" />
                    <p className="text-lg font-medium text-text-primary">Aucune charge variable enregistrée</p>
                    <p className="text-sm">Créez une nouvelle charge pour commencer le suivi.</p>
                  </td>
                </tr>
              ) : (
                filteredCharges.map(c => {
                  const vehicule = vehicules.find(veh => veh.id === c.vehiculeId);
                  return (
                    <tr key={c.id} className="hover:bg-surface-2/50 transition-colors">
                      <td className="px-6 py-4 text-text-secondary">{formatDate(c.date)}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{vehicule?.immatriculation}</div>
                        <div className="text-text-muted text-xs">{vehicule?.marque} {vehicule?.modele}</div>
                      </td>
                      <td className="px-6 py-4">{c.description}</td>
                      <td className="px-6 py-4 text-right font-medium text-text-primary">{formatMAD(c.montant)}</td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
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
                  <Wallet className="w-5 h-5 text-primary" />
                  Nouvelle Charge Variable
                </h2>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <form id="add-charge-form" onSubmit={handleAddCharge} className="space-y-6">
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
                    <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                    <DatePicker
                      value={date}
                      onChange={setDate}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                    <textarea 
                      required
                      rows={3} 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full p-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" 
                      placeholder="Description de la dépense..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Montant (MAD)</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="0.01"
                      value={montant}
                      onChange={e => setMontant(parseFloat(e.target.value))}
                      placeholder="Ex: 1500.00" 
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
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
                  form="add-charge-form"
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
