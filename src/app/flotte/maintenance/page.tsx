import React, { useState } from 'react';
import { useMaintenanceStore, MaintenanceType, MaintenanceStatus } from '../../../stores/useMaintenanceStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { formatMAD, formatDate } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../../lib/utils';
import { DatePicker } from '../../../components/ui/DatePicker';

export default function MaintenancePage() {
  const { maintenances, addMaintenance, deleteMaintenance } = useMaintenanceStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const user = useAuthStore(s => s.user);
  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [vehiculeId, setVehiculeId] = useState('');
  const [type, setType] = useState<MaintenanceType>('preventive');
  const [description, setDescription] = useState('');
  const [datePrevue, setDatePrevue] = useState('');
  const [kilometrage, setKilometrage] = useState(0);
  const [coutEstime, setCoutEstime] = useState(0);

  const filteredMaintenances = maintenances.filter(m => {
    const vehicule = vehicules.find(v => v.id === m.vehiculeId);
    if (!vehicule) return false;
    const searchString = `${vehicule.immatriculation} ${vehicule.marque} ${m.description}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  const handleAddMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    addMaintenance({
      vehiculeId,
      type,
      description,
      datePrevue: new Date(datePrevue).toISOString(),
      kilometrage,
      coutEstime,
      status: 'planifiee',
      pieces: []
    });
    setIsModalOpen(false);
    // Reset form
    setVehiculeId('');
    setType('preventive');
    setDescription('');
    setDatePrevue('');
    setKilometrage(0);
    setCoutEstime(0);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canManage) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette maintenance ?')) {
      deleteMaintenance(id);
    }
  };

  const getStatusIcon = (status: MaintenanceStatus) => {
    switch (status) {
      case 'terminee': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'en_cours': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'planifiee': return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'annulee': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusLabel = (status: MaintenanceStatus) => {
    switch (status) {
      case 'terminee': return 'Terminée';
      case 'en_cours': return 'En cours';
      case 'planifiee': return 'Planifiée';
      case 'annulee': return 'Annulée';
    }
  };

  const getTypeLabel = (type: MaintenanceType) => {
    switch (type) {
      case 'preventive': return 'Préventive';
      case 'curative': return 'Curative';
      case 'inspection': return 'Inspection';
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Maintenance
          </h1>
          <p className="text-text-secondary mt-1">Suivi des entretiens et réparations</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle maintenance</span>
              <span className="sm:hidden">Nouvelle</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher par véhicule, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-2 transition-colors text-text-primary font-medium">
          <Filter className="w-4 h-4" />
          <span>Filtres</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-sm text-text-secondary">
                <th className="p-4 font-medium">Véhicule</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Date Prévue</th>
                <th className="p-4 font-medium">Coût Estimé</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMaintenances.map((m) => {
                const vehicule = vehicules.find(v => v.id === m.vehiculeId);
                return (
                  <tr key={m.id} className="hover:bg-surface-2/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{vehicule?.immatriculation}</div>
                          <div className="text-xs text-text-secondary">{vehicule?.marque} {vehicule?.modele}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 border border-border text-text-secondary">
                        {getTypeLabel(m.type)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-text-primary max-w-xs truncate" title={m.description}>
                        {m.description}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-text-primary">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        {formatDate(m.datePrevue)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-text-primary">
                        {formatMAD(m.coutEstime)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(m.status)}
                        <span className="text-sm font-medium text-text-primary">
                          {getStatusLabel(m.status)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {canManage && (
                          <button 
                            onClick={(e) => handleDelete(e, m.id)}
                            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-md transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMaintenances.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-secondary">
                    Aucune maintenance trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      <AnimatePresence>
        {isModalOpen && canManage && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface rounded-2xl shadow-2xl z-50 border border-border overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  Nouvelle maintenance
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form id="add-maintenance-form" onSubmit={handleAddMaintenance} className="space-y-5">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Type</label>
                      <select 
                        required
                        value={type}
                        onChange={e => setType(e.target.value as MaintenanceType)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      >
                        <option value="preventive">Préventive</option>
                        <option value="curative">Curative</option>
                        <option value="inspection">Inspection</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date Prévue</label>
                      <DatePicker
                        value={datePrevue}
                        onChange={setDatePrevue}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                    <textarea 
                      required
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ex: Vidange, changement de pneus..."
                      className="w-full p-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Kilométrage actuel</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={kilometrage}
                        onChange={e => setKilometrage(parseInt(e.target.value))}
                        placeholder="Ex: 145000" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Coût Estimé (MAD)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={coutEstime}
                        onChange={e => setCoutEstime(parseFloat(e.target.value))}
                        placeholder="Ex: 1500" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-border bg-surface-2 flex gap-3 justify-end">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="add-maintenance-form"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
