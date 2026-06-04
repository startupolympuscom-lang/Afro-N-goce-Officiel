import React, { useState } from 'react';
import { useInfractionStore, InfractionStatus } from '../../../stores/useInfractionStore';
import { useVehiculeStore } from '../../../stores/useVehiculeStore';
import { useChauffeurStore } from '../../../stores/useChauffeurStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Truck,
  User,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';
import { formatMAD, formatDate } from '../../../lib/formatters';
import { motion, AnimatePresence } from 'motion/react';

export default function InfractionsPage() {
  const { infractions, addInfraction, deleteInfraction } = useInfractionStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const chauffeurs = useChauffeurStore(s => s.chauffeurs);
  const user = useAuthStore(s => s.user);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  // Form state
  const [vehiculeId, setVehiculeId] = useState('');
  const [chauffeurId, setChauffeurId] = useState('');
  const [date, setDate] = useState('');
  const [lieu, setLieu] = useState('');
  const [type, setType] = useState('');
  const [montant, setMontant] = useState(0);
  const [pointsRetires, setPointsRetires] = useState(0);
  const [numeroPv, setNumeroPv] = useState('');

  const filteredInfractions = infractions.filter(i => {
    const vehicule = vehicules.find(v => v.id === i.vehiculeId);
    const chauffeur = chauffeurs.find(c => c.id === i.chauffeurId);
    if (!vehicule) return false;
    const searchString = `${vehicule.immatriculation} ${chauffeur?.nom} ${chauffeur?.prenom} ${i.type} ${i.numeroPv}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  const handleAddInfraction = (e: React.FormEvent) => {
    e.preventDefault();
    addInfraction({
      vehiculeId,
      chauffeurId: chauffeurId || undefined,
      date: new Date(date).toISOString(),
      lieu,
      type,
      montant,
      pointsRetires,
      status: 'non_payee',
      numeroPv
    });
    setIsModalOpen(false);
    // Reset form
    setVehiculeId('');
    setChauffeurId('');
    setDate('');
    setLieu('');
    setType('');
    setMontant(0);
    setPointsRetires(0);
    setNumeroPv('');
  };

  const getStatusIcon = (status: InfractionStatus) => {
    switch (status) {
      case 'payee': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'non_payee': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'contestee': return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusLabel = (status: InfractionStatus) => {
    switch (status) {
      case 'payee': return 'Payée';
      case 'non_payee': return 'Non payée';
      case 'contestee': return 'Contestée';
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette infraction ?')) {
      deleteInfraction(id);
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Infractions
          </h1>
          <p className="text-text-secondary mt-1">Suivi des amendes et PV</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Saisir une infraction</span>
              <span className="sm:hidden">Saisir</span>
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
            placeholder="Rechercher par véhicule, chauffeur, n° PV..."
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
                <th className="p-4 font-medium">Chauffeur</th>
                <th className="p-4 font-medium">Date & Lieu</th>
                <th className="p-4 font-medium">Infraction</th>
                <th className="p-4 font-medium">Montant</th>
                <th className="p-4 font-medium">Statut</th>
                {canManage && <th className="p-4 font-medium w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInfractions.map((i) => {
                const vehicule = vehicules.find(v => v.id === i.vehiculeId);
                const chauffeur = chauffeurs.find(c => c.id === i.chauffeurId);
                return (
                  <tr key={i.id} className="hover:bg-surface-2/50 transition-colors group">
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
                      {chauffeur ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{chauffeur.nom} {chauffeur.prenom}</div>
                            <div className="text-xs text-text-secondary">{chauffeur.cin}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-text-muted italic">Non assigné</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-text-primary mb-1">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        {formatDate(i.date)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <MapPin className="w-3 h-3" />
                        {i.lieu}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-text-primary">{i.type}</div>
                      <div className="text-xs text-text-secondary mt-1">
                        {i.numeroPv ? `PV: ${i.numeroPv}` : 'Sans n° PV'}
                        {i.pointsRetires > 0 && ` • -${i.pointsRetires} pts`}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-red-600">
                        {formatMAD(i.montant)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(i.status)}
                        <span className="text-sm font-medium text-text-primary">
                          {getStatusLabel(i.status)}
                        </span>
                      </div>
                    </td>
                    {canManage && (
                      <td className="p-4">
                        <button 
                          onClick={() => handleDelete(i.id)}
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
              {filteredInfractions.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6} className="p-8 text-center text-text-secondary">
                    Aucune infraction trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Infraction Modal */}
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
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Saisir une infraction
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form id="add-infraction-form" onSubmit={handleAddInfraction} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Véhicule</label>
                      <select 
                        required
                        value={vehiculeId}
                        onChange={e => setVehiculeId(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      >
                        <option value="">Sélectionner...</option>
                        {vehicules.map(v => (
                          <option key={v.id} value={v.id}>{v.immatriculation}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Chauffeur (Optionnel)</label>
                      <select 
                        value={chauffeurId}
                        onChange={e => setChauffeurId(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      >
                        <option value="">Sélectionner...</option>
                        {chauffeurs.map(c => (
                          <option key={c.id} value={c.id}>{c.nom} {c.prenom}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Date & Heure</label>
                      <input 
                        type="datetime-local" 
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">N° PV (Optionnel)</label>
                      <input 
                        type="text" 
                        value={numeroPv}
                        onChange={e => setNumeroPv(e.target.value)}
                        placeholder="Ex: PV-2023-001"
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Lieu</label>
                    <input 
                      type="text" 
                      required
                      value={lieu}
                      onChange={e => setLieu(e.target.value)}
                      placeholder="Ex: Autoroute A3, km 45"
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Type d'infraction</label>
                    <input 
                      type="text" 
                      required
                      value={type}
                      onChange={e => setType(e.target.value)}
                      placeholder="Ex: Excès de vitesse"
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Montant (MAD)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        step="0.01"
                        value={montant}
                        onChange={e => setMontant(parseFloat(e.target.value))}
                        placeholder="Ex: 300" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Points retirés</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={pointsRetires}
                        onChange={e => setPointsRetires(parseInt(e.target.value))}
                        placeholder="Ex: 1" 
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
                  form="add-infraction-form"
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors shadow-sm"
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
