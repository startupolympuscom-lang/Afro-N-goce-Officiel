import React, { useState } from 'react';
import { usePneuStore, PneuPosition, PneuStatus } from '../../../stores/usePneuStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  CircleDot, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Truck,
  Calendar,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { formatMAD, formatDate, formatKm } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';
import { DatePicker } from '../../../components/ui/DatePicker';
import { TruckTiresGraphic } from './TruckTiresGraphic';

export default function PneusPage() {
  const { pneus, addPneu, deletePneu } = usePneuStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [selectedFilterVehiculeId, setSelectedFilterVehiculeId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  // Form state
  const [vehiculeId, setVehiculeId] = useState('');
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [positions, setPositions] = useState<PneuPosition[]>(['avant_gauche']);
  const [dateMontage, setDateMontage] = useState('');
  const [kilometrageMontage, setKilometrageMontage] = useState(0);
  const [cout, setCout] = useState(0); // cout total

  const filteredPneus = pneus.filter(p => {
    if (selectedFilterVehiculeId && p.vehiculeId !== selectedFilterVehiculeId) return false;
    const vehicule = vehicules.find(v => v.id === p.vehiculeId);
    if (!vehicule) return false;
    const searchString = `${vehicule.immatriculation} ${p.marque} ${p.modele} ${p.dimensions}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  }).sort((a, b) => new Date(b.dateMontage).getTime() - new Date(a.dateMontage).getTime());

  const handleAddPneu = (e: React.FormEvent) => {
    e.preventDefault();
    if (positions.length === 0) return;
    const coutPerTire = cout / positions.length;

    positions.forEach(pos => {
      addPneu({
        vehiculeId,
        marque,
        modele,
        dimensions,
        position: pos,
        dateMontage: new Date(dateMontage).toISOString(),
        kilometrageMontage,
        cout: coutPerTire,
        usureActuelle: 0,
        status: 'neuf'
      });
    });
    
    setIsModalOpen(false);
    // Reset form
    setVehiculeId('');
    setMarque('');
    setModele('');
    setDimensions('');
    setPositions(['avant_gauche']);
    setDateMontage('');
    setKilometrageMontage(0);
    setCout(0);
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'avant_gauche': return 'Avant Gauche';
      case 'avant_droit': return 'Avant Droit';
      case 'arriere_gauche_ext': return 'Arr. Gauche Ext';
      case 'arriere_gauche_int': return 'Arr. Gauche Int';
      case 'arriere_droit_ext': return 'Arr. Droit Ext';
      case 'arriere_droit_int': return 'Arr. Droit Int';
      case 'secours': return 'Secours';
      default: return position;
    }
  };

  const getStatusColor = (status: PneuStatus) => {
    switch (status) {
      case 'neuf': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'bon': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moyen': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'use': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'a_remplacer': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusLabel = (status: PneuStatus) => {
    switch (status) {
      case 'neuf': return 'Neuf';
      case 'bon': return 'Bon état';
      case 'moyen': return 'Moyen';
      case 'use': return 'Usé';
      case 'a_remplacer': return 'À remplacer';
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce pneu ?')) {
      deletePneu(id);
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Gestion des Pneus
          </h1>
          <p className="text-text-secondary mt-1">Suivi de l'usure et des remplacements</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau montage</span>
              <span className="sm:hidden">Nouveau</span>
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
              placeholder="Rechercher par véhicule, marque, dimensions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <select
            value={selectedFilterVehiculeId}
            onChange={(e) => setSelectedFilterVehiculeId(e.target.value)}
            className="px-4 py-2 bg-surface border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary font-medium"
          >
            <option value="">Tous les véhicules</option>
            {vehicules.map(v => (
              <option key={v.id} value={v.id}>{v.immatriculation} - {v.marque}</option>
            ))}
          </select>
        </div>

        {selectedFilterVehiculeId && (
          <TruckTiresGraphic vehiculeId={selectedFilterVehiculeId} />
        )}

        {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-sm text-text-secondary">
                <th className="p-4 font-medium">Véhicule</th>
                <th className="p-4 font-medium">Pneu</th>
                <th className="p-4 font-medium">Position</th>
                <th className="p-4 font-medium">Montage</th>
                <th className="p-4 font-medium">Usure</th>
                <th className="p-4 font-medium">Statut</th>
                {canManage && <th className="p-4 font-medium w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPneus.map((p) => {
                const vehicule = vehicules.find(v => v.id === p.vehiculeId);
                return (
                  <tr key={p.id} className="hover:bg-surface-2/50 transition-colors group">
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
                      <div className="font-medium text-text-primary">{p.marque} {p.modele}</div>
                      <div className="text-xs text-text-secondary">{p.dimensions}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-text-primary">
                        {getPositionLabel(p.position)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-text-primary">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        {formatDate(p.dateMontage)}
                      </div>
                      <div className="text-xs text-text-secondary mt-1">
                        à {formatKm(p.kilometrageMontage)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full max-w-[100px] h-2 bg-surface-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${p.usureActuelle > 80 ? 'bg-red-500' : p.usureActuelle > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${p.usureActuelle}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-text-primary">{p.usureActuelle}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    {canManage && (
                      <td className="p-4">
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredPneus.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="p-8 text-center text-text-secondary">
                    Aucun pneu trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Pneu Modal */}
      <AnimatePresence>
        {isModalOpen && (
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
                  <CircleDot className="w-5 h-5 text-primary" />
                  Nouveau montage
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form id="add-pneu-form" onSubmit={handleAddPneu} className="space-y-5">
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
                      <label className="block text-sm font-medium text-text-primary mb-1">Marque</label>
                      <input 
                        type="text" 
                        required
                        value={marque}
                        onChange={e => setMarque(e.target.value)}
                        placeholder="Ex: Michelin"
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
                        placeholder="Ex: Agilis"
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Dimensions</label>
                      <input 
                        type="text" 
                        required
                        value={dimensions}
                        onChange={e => setDimensions(e.target.value)}
                        placeholder="Ex: 205/65 R16"
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-text-primary mb-2">Positions changées</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {(['avant_gauche', 'avant_droit', 'arriere_gauche_ext', 'arriere_gauche_int', 'arriere_droit_ext', 'arriere_droit_int', 'secours'] as PneuPosition[]).map(pos => (
                          <label key={pos} className="flex items-center gap-2 p-2 rounded border border-border bg-surface-2 cursor-pointer hover:bg-surface transition-colors">
                            <input 
                              type="checkbox"
                              checked={positions.includes(pos)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPositions(prev => [...prev, pos]);
                                } else {
                                  setPositions(prev => prev.filter(p => p !== pos));
                                }
                              }}
                              className="rounded border-border text-primary focus:ring-primary/20"
                            />
                            <span className="text-sm font-medium text-text-primary select-none">{getPositionLabel(pos)}</span>
                          </label>
                        ))}
                      </div>
                      {positions.length === 0 && <p className="text-xs text-danger mt-1">Veuillez sélectionner au moins une position.</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date Montage</label>
                      <DatePicker
                        value={dateMontage}
                        onChange={setDateMontage}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Km Montage</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={kilometrageMontage}
                        onChange={e => setKilometrageMontage(parseInt(e.target.value))}
                        placeholder="Ex: 145000" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Coût Total (MAD)</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="0.01"
                      value={cout}
                      onChange={e => setCout(parseFloat(e.target.value))}
                      placeholder="Ex: 1200" 
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
                    <p className="text-xs text-text-muted mt-1">Sera divisé équitablement entre les {Math.max(1, positions.length)} pneus sélectionnés.</p>
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
                  form="add-pneu-form"
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
