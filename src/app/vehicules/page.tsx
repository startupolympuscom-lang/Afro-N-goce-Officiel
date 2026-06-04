import React, { useState, useEffect } from 'react';
import { useVehiculeStore } from '../../stores/useVehiculeStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LABELS } from '../../lib/constants';
import { formatKm } from '../../lib/formatters';
import { VehiculeStatus, ParcVehicule } from '../../types';
import { VehiculeDetailsModal } from './VehiculeDetailsModal';

export default function VehiculesPage() {
  const { vehicules, addVehicule, deleteVehicule, parcs, updateVehicule } = useVehiculeStore();
  const documents = useDocumentStore(s => s.documents);
  const user = useAuthStore(s => s.user);
  const canManage = user?.role === 'super_admin' || user?.role === 'admin';

  useEffect(() => {
    vehicules.forEach(v => {
      if (v.parc && v.parc.toLowerCase().includes('afon')) {
        updateVehicule(v.id, { parc: 'Afro Négoce' });
      }
    });
  }, [vehicules, updateVehicule]);

  const checkMissingDocs = (vehiculeId: string) => {
    const mandatoryVehicleDocs = ['assurance', 'visite_technique', 'vignette', 'carte_grise'];
    const vehiculeDocs = documents.filter(d => d.entiteId === vehiculeId);
    return mandatoryVehicleDocs.filter(type => !vehiculeDocs.some(d => d.type === type));
  };
  
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<string | null>(null);

  // Form state
  const [immatriculation, setImmatriculation] = useState('');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [km, setKm] = useState(0);
  const [parc, setParc] = useState<string>(parcs.length > 0 ? parcs[0].name : 'Afro Négoce');

  const filteredVehicules = vehicules.filter(v => 
    v.immatriculation.toLowerCase().includes(search.toLowerCase()) ||
    v.marque.toLowerCase().includes(search.toLowerCase()) ||
    v.modele.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: VehiculeStatus) => {
    switch (status) {
      case 'disponible': return 'bg-success/10 text-success border-success/20';
      case 'en_mission': return 'bg-info/10 text-info border-info/20';
      case 'en_maintenance': return 'bg-warning/10 text-warning border-warning/20';
      case 'immobilise': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-surface-2 text-text-secondary border-border';
    }
  };

  const getStatusIcon = (status: VehiculeStatus) => {
    switch (status) {
      case 'disponible': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'en_mission': return <Truck className="w-3.5 h-3.5" />;
      case 'en_maintenance': return <Clock className="w-3.5 h-3.5" />;
      case 'immobilise': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const handleAddVehicule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    addVehicule({
      immatriculation,
      marque,
      modele,
      anneeAcquisition: annee,
      poids: 18, // default
      typeMoteur: 'diesel',
      kilometrageActuel: km,
      outillage: [],
      parc
    });
    setIsModalOpen(false);
    // Reset form
    setImmatriculation('');
    setMarque('');
    setModele('');
    setAnnee(new Date().getFullYear());
    setKm(0);
    setParc(parcs.length > 0 ? parcs[0].name : 'Afro Négoce');
  };

  const handleDelete = (id: string) => {
    if (!canManage) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      deleteVehicule(id);
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Parc de véhicules
            <span className="bg-primary/10 text-primary text-sm font-semibold px-2.5 py-0.5 rounded-full">
              {vehicules.length}
            </span>
          </h1>
          <p className="text-text-secondary mt-1">Gérez l'ensemble de votre flotte automobile</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-surface-2 p-1 rounded-lg border border-border flex items-center">
            <button 
              onClick={() => setView('table')}
              className={`p-1.5 rounded-md transition-colors ${view === 'table' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('cards')}
              className={`p-1.5 rounded-md transition-colors ${view === 'cards' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          {canManage && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter un véhicule</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher par immatriculation, marque, modèle..." 
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

      {view === 'table' ? (
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
                <tr>
                  <th className="px-6 py-4">Immatriculation</th>
                  <th className="px-6 py-4">Marque & Modèle</th>
                  <th className="px-6 py-4">Parc</th>
                  <th className="px-6 py-4">Année</th>
                  <th className="px-6 py-4">Kilométrage</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVehicules.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-2/50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-text-primary">{v.immatriculation}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-text-primary">{v.marque}</div>
                        <div className="text-text-muted text-xs">{v.modele}</div>
                        {checkMissingDocs(v.id).length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-danger uppercase mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {checkMissingDocs(v.id).length} Doc(s) manquant(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${v.parc === 'Afro Négoce' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                        {v.parc}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{v.anneeAcquisition}</td>
                    <td className="px-6 py-4 text-text-secondary">{formatKm(v.kilometrageActuel)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(v.status)}`}>
                        {getStatusIcon(v.status)}
                        {LABELS.status[v.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedVehiculeId(v.id)}
                          className="text-sm font-medium text-primary hover:text-primary-hover px-2 py-1"
                        >
                          Gérer
                        </button>
                        {canManage && (
                          <button 
                            onClick={() => handleDelete(v.id)}
                            className="text-text-muted hover:text-danger p-1 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVehicules.length === 0 && (
            <div className="p-12 text-center text-text-secondary">
              <Truck className="w-12 h-12 mx-auto text-border-strong mb-4" />
              <p className="text-lg font-medium text-text-primary">Aucun véhicule trouvé</p>
              <p className="text-sm">Modifiez vos critères de recherche pour voir plus de résultats.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicules.map((v) => (
            <motion.div 
              key={v.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className={`h-2 w-full ${
                v.status === 'disponible' ? 'bg-success' : 
                v.status === 'en_mission' ? 'bg-info' : 
                v.status === 'en_maintenance' ? 'bg-warning' : 'bg-danger'
              }`} />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="font-mono font-bold text-lg text-text-primary">{v.immatriculation}</div>
                    <div className="text-sm text-text-secondary font-medium">{v.marque} {v.modele}</div>
                    {checkMissingDocs(v.id).length > 0 && (
                      <div className="flex items-center gap-1.2 px-2 py-0.5 rounded bg-danger/10 text-danger text-[10px] font-black uppercase mt-1.5 w-fit">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {checkMissingDocs(v.id).length} Doc(s) manquant(s)
                      </div>
                    )}
                  </div>
                  {canManage && (
                    <button 
                      onClick={() => handleDelete(v.id)}
                      className="text-text-muted hover:text-danger transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Parc</span>
                    <span className={`font-medium ${v.parc === 'Afro Négoce' ? 'text-primary' : 'text-warning'}`}>{v.parc}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Année</span>
                    <span className="font-medium text-text-primary">{v.anneeAcquisition}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Kilométrage</span>
                    <span className="font-medium text-text-primary">{formatKm(v.kilometrageActuel)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Moteur</span>
                    <span className="font-medium text-text-primary capitalize">{v.typeMoteur}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(v.status)}`}>
                    {getStatusIcon(v.status)}
                    {LABELS.status[v.status]}
                  </span>
                  <button 
                    onClick={() => setSelectedVehiculeId(v.id)}
                    className="text-sm font-medium text-primary hover:text-primary-hover"
                  >
                    Gérer
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Ajouter un véhicule
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="add-vehicule-form" onSubmit={handleAddVehicule} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Immatriculation</label>
                    <input 
                      type="text" 
                      required
                      value={immatriculation}
                      onChange={e => setImmatriculation(e.target.value.toUpperCase())}
                      placeholder="Ex: 12345-A-7" 
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono uppercase" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Marque</label>
                      <input 
                        type="text" 
                        required
                        value={marque}
                        onChange={e => setMarque(e.target.value)}
                        placeholder="Ex: Volvo" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Modèle</label>
                      <input 
                        type="text" 
                        required
                        value={modele}
                        onChange={e => setModele(e.target.value)}
                        placeholder="Ex: FH 500" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Année</label>
                      <input 
                        type="number" 
                        required
                        min="1980"
                        max={new Date().getFullYear()}
                        value={annee}
                        onChange={e => setAnnee(parseInt(e.target.value))}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Kilométrage initial</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={km}
                        onChange={e => setKm(parseInt(e.target.value))}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Parc</label>
                    <select
                      value={parc}
                      onChange={e => setParc(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                    >
                      {parcs.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
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
                  form="add-vehicule-form"
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {selectedVehiculeId && (
        <VehiculeDetailsModal 
          vehiculeId={selectedVehiculeId} 
          onClose={() => setSelectedVehiculeId(null)} 
        />
      )}
    </div>
  );
}
