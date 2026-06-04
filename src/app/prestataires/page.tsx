import React, { useState } from 'react';
import { usePrestataireStore, PrestataireType, PrestataireStatus } from '../../stores/usePrestataireStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  Store, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PrestatairesPage() {
  const { prestataires, addPrestataire, deletePrestataire } = usePrestataireStore();
  const user = useAuthStore(s => s.user);
  const canManage = user?.role === 'super_admin' || user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [nom, setNom] = useState('');
  const [type, setType] = useState<PrestataireType>('garage');
  const [contact, setContact] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [notes, setNotes] = useState('');

  const filteredPrestataires = prestataires.filter(p => {
    const searchString = `${p.nom} ${p.contact} ${p.type}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  const handleAddPrestataire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    addPrestataire({
      nom,
      type,
      contact,
      telephone,
      email,
      adresse,
      notes,
      status: 'actif'
    });
    setIsModalOpen(false);
    // Reset form
    setNom('');
    setType('garage');
    setContact('');
    setTelephone('');
    setEmail('');
    setAdresse('');
    setNotes('');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canManage) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce prestataire ?')) {
      deletePrestataire(id);
    }
  };

  const getTypeLabel = (type: PrestataireType) => {
    switch (type) {
      case 'garage': return 'Garage / Atelier';
      case 'assurance': return 'Assurance';
      case 'carburant': return 'Station Service';
      case 'pneus': return 'Fournisseur Pneus';
      case 'administration': return 'Administration';
      case 'autre': return 'Autre';
    }
  };

  return (
    <div className="space-y-6 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Prestataires
          </h1>
          <p className="text-text-secondary mt-1">Annuaire des fournisseurs et partenaires</p>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouveau prestataire</span>
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
            placeholder="Rechercher par nom, contact, type..."
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
                <th className="p-4 font-medium">Prestataire</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Contact Principal</th>
                <th className="p-4 font-medium">Coordonnées</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPrestataires.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{p.nom}</div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{p.adresse}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-2 border border-border text-text-secondary">
                      {getTypeLabel(p.type)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-text-primary">{p.contact}</div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-text-primary">
                        <Phone className="w-4 h-4 text-text-muted" />
                        {p.telephone}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-primary">
                        <Mail className="w-4 h-4 text-text-muted" />
                        {p.email}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {p.status === 'actif' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium text-text-primary">
                        {p.status === 'actif' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {canManage && (
                        <button 
                          onClick={(e) => handleDelete(e, p.id)}
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
              ))}
              {filteredPrestataires.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-text-secondary">
                    Aucun prestataire trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Prestataire Modal */}
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
                  <Store className="w-5 h-5 text-primary" />
                  Nouveau prestataire
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <form id="add-prestataire-form" onSubmit={handleAddPrestataire} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Nom de l'entreprise</label>
                      <input 
                        type="text" 
                        required
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        placeholder="Ex: Garage Auto Pro"
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Type de service</label>
                      <select 
                        required
                        value={type}
                        onChange={e => setType(e.target.value as PrestataireType)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      >
                        <option value="garage">Garage / Atelier</option>
                        <option value="assurance">Assurance</option>
                        <option value="carburant">Station Service</option>
                        <option value="pneus">Fournisseur Pneus</option>
                        <option value="administration">Administration</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Contact principal</label>
                    <input 
                      type="text" 
                      required
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      placeholder="Ex: Ahmed Benali"
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Téléphone</label>
                      <input 
                        type="tel" 
                        required
                        value={telephone}
                        onChange={e => setTelephone(e.target.value)}
                        placeholder="Ex: +212 6 00 00 00 00"
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Ex: contact@entreprise.ma"
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Adresse complète</label>
                    <input 
                      type="text" 
                      required
                      value={adresse}
                      onChange={e => setAdresse(e.target.value)}
                      placeholder="Ex: 123 Zone Industrielle, Casablanca"
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Notes (optionnel)</label>
                    <textarea 
                      rows={3}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Informations complémentaires..."
                      className="w-full p-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    />
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
                  form="add-prestataire-form"
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
