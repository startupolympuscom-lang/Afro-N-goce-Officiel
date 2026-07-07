import React, { useState } from 'react';
import { useMissionStore } from '../../../stores/useMissionStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useChauffeurStore } from '../../../stores/useChauffeurStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  MapPin, 
  Calendar,
  ArrowRight,
  Truck,
  User,
  Briefcase,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LABELS } from '../../../lib/constants';
import { formatDate } from '../../../lib/formatters';
import { StatusMission, TypeChargement } from '../../../types';

export default function MissionsPage() {
  const { missions, addMission, deleteMission } = useMissionStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const chauffeurs = useChauffeurStore(s => s.chauffeurs);
  const user = useAuthStore(s => s.user);
  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [depart, setDepart] = useState('');
  const [destination, setDestination] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [dateRetour, setDateRetour] = useState('');
  const [vehiculeId, setVehiculeId] = useState('');
  const [chauffeurId, setChauffeurId] = useState('');
  const [typeChargement, setTypeChargement] = useState<TypeChargement>('autre');
  const [distanceEstimee, setDistanceEstimee] = useState(0);

  const filteredMissions = missions.filter(m => 
    m.reference.toLowerCase().includes(search.toLowerCase()) ||
    m.depart.toLowerCase().includes(search.toLowerCase()) ||
    m.destination.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: StatusMission) => {
    switch (status) {
      case 'planifiee': return 'bg-info/10 text-info border-info/20';
      case 'en_cours': return 'bg-warning/10 text-warning border-warning/20';
      case 'terminee': return 'bg-success/10 text-success border-success/20';
      case 'annulee': return 'bg-surface-2 text-text-secondary border-border';
      default: return 'bg-surface-2 text-text-secondary border-border';
    }
  };

  const columns: { id: StatusMission; title: string; color: string }[] = [
    { id: 'planifiee', title: 'Planifiée', color: 'bg-info' },
    { id: 'en_cours', title: 'En cours', color: 'bg-warning' },
    { id: 'terminee', title: 'Terminée', color: 'bg-success' },
    { id: 'annulee', title: 'Annulée', color: 'bg-border-strong' },
  ];

  const handleAddMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    addMission({
      vehiculeId,
      chauffeurId,
      depart,
      destination,
      dateDepartPlanifiee: new Date(dateDepart).toISOString(),
      dateRetourPlanifiee: new Date(dateRetour).toISOString(),
      distanceEstimee,
      typeChargement,
      status: 'planifiee'
    });
    setIsModalOpen(false);
    // Reset form
    setDepart('');
    setDestination('');
    setDateDepart('');
    setDateRetour('');
    setVehiculeId('');
    setChauffeurId('');
    setTypeChargement('autre');
    setDistanceEstimee(0);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canManage) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      deleteMission(id);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Missions
            <span className="bg-primary/10 text-primary text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {missions.length}
            </span>
          </h1>
          <p className="text-text-secondary mt-1">Planification et suivi des trajets</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-surface-2 p-1 rounded-lg border border-border flex items-center">
            <button 
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-md transition-colors ${view === 'kanban' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {canManage && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle mission</span>
              <span className="sm:hidden">Nouvelle</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher par référence, ville..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button className="h-10 px-4 border border-border rounded-lg flex items-center gap-2 text-sm font-medium text-text-secondary hover:bg-surface-2 transition-colors">
          <Filter className="w-4 h-4" />
          Filtres
        </button>
      </div>

      {view === 'kanban' ? (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {columns.map(col => {
              const colMissions = filteredMissions.filter(m => m.status === col.id);
              return (
                <div key={col.id} className="w-80 flex flex-col bg-surface-2/50 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${col.color}`} />
                      <h3 className="font-bold text-text-primary">{col.title}</h3>
                    </div>
                    <span className="bg-surface text-text-secondary text-xs font-bold px-2 py-1 rounded-md border border-border">
                      {colMissions.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {colMissions.map(m => {
                      const v = vehicules.find(v => v.id === m.vehiculeId);
                      const c = chauffeurs.find(c => c.id === m.chauffeurId);
                      return (
                        <motion.div 
                          key={m.id}
                          layoutId={m.id}
                          className="bg-surface p-4 rounded-xl border border-border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative group"
                        >
                          {canManage && (
                            <button 
                              onClick={(e) => handleDelete(e, m.id)}
                              className="absolute top-4 right-4 text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-xs font-bold text-text-secondary">{m.reference}</span>
                            {!canManage && (
                              <button className="text-text-muted hover:text-text-primary">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <div className="font-bold text-text-primary">{m.depart}</div>
                            <ArrowRight className="w-4 h-4 text-text-muted" />
                            <div className="font-bold text-text-primary">{m.destination}</div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <Calendar className="w-4 h-4" />
                              {formatDate(m.dateDepartPlanifiee)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <Truck className="w-4 h-4" />
                              {v?.immatriculation || 'Non assigné'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                              <User className="w-4 h-4" />
                              {c ? `${c.prenom} ${c.nom}` : 'Non assigné'}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="bg-surface-2 text-text-secondary px-2 py-1 rounded-md text-xs font-bold border border-border capitalize">
                              {m.typeChargement}
                            </span>
                            <span className="text-xs font-bold text-text-primary">
                              {m.distanceEstimee} km
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">Référence</th>
                  <th className="px-6 py-4">Trajet</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Véhicule & Chauffeur</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMissions.map((m) => {
                  const v = vehicules.find(v => v.id === m.vehiculeId);
                  const c = chauffeurs.find(c => c.id === m.chauffeurId);
                  return (
                    <tr key={m.id} className="hover:bg-surface-2/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-medium text-text-primary">{m.reference}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-medium text-text-primary">
                          {m.depart} <ArrowRight className="w-3 h-3 text-text-muted" /> {m.destination}
                        </div>
                        <div className="text-text-muted text-xs mt-1">{m.distanceEstimee} km • {m.typeChargement}</div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        <div>{formatDate(m.dateDepartPlanifiee)}</div>
                        <div className="text-xs text-text-muted">au {formatDate(m.dateRetourPlanifiee)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-text-primary">{v?.immatriculation}</div>
                        <div className="text-text-muted text-xs">{c?.prenom} {c?.nom}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(m.status)}`}>
                          {LABELS.status[m.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManage && (
                            <button 
                              onClick={(e) => handleDelete(e, m.id)}
                              className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Mission Modal */}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-surface rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Nouvelle mission
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="add-mission-form" onSubmit={handleAddMission} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Départ</label>
                      <input 
                        type="text" 
                        required
                        value={depart}
                        onChange={e => setDepart(e.target.value)}
                        placeholder="Ex: Casablanca" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Destination</label>
                      <input 
                        type="text" 
                        required
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                        placeholder="Ex: Tanger" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date de départ</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={dateDepart}
                        onChange={e => setDateDepart(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date de retour (estimée)</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={dateRetour}
                        onChange={e => setDateRetour(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Véhicule</label>
                      <select 
                        required
                        value={vehiculeId}
                        onChange={e => setVehiculeId(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      >
                        <option value="">Sélectionner un véhicule</option>
                        {vehicules.filter(v => v.status === 'disponible').map(v => (
                          <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque} {v.modele}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Chauffeur</label>
                      <select 
                        required
                        value={chauffeurId}
                        onChange={e => setChauffeurId(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      >
                        <option value="">Sélectionner un chauffeur</option>
                        {chauffeurs.filter(c => c.status === 'actif').map(c => (
                          <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Type de chargement</label>
                      <input 
                        type="text" 
                        required
                        value={typeChargement}
                        onChange={e => setTypeChargement(e.target.value as TypeChargement)}
                        placeholder="Ex: Marchandises générales" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Distance estimée (km)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={distanceEstimee}
                        onChange={e => setDistanceEstimee(parseInt(e.target.value))}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="p-6 border-t border-border bg-surface-2 flex gap-3 mt-auto">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  form="add-mission-form"
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                  Créer la mission
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
