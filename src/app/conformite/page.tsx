import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Search, 
  Filter, 
  MoreVertical, 
  Download,
  FileText,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useDocumentStore } from '../../stores/useDocumentStore';
import { useVehiculeStore } from '../../stores/useVehiculeStore';
import { useChauffeurStore } from '../../stores/useChauffeurStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { formatDate } from '../../lib/formatters';

export default function ConformitePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'expire' | 'expire_bientot' | 'valide'>('all');
  const { documents, updateDocumentStatuses, deleteDocument } = useDocumentStore();
  const vehicules = useVehiculeStore(s => s.vehicules);
  const chauffeurs = useChauffeurStore(s => s.chauffeurs);
  const user = useAuthStore(s => s.user);

  const canManage = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'chef_de_parc';

  useEffect(() => {
    updateDocumentStatuses();
  }, [updateDocumentStatuses]);

  const getEntiteName = (entiteId: string, entiteType: 'vehicule' | 'chauffeur') => {
    if (entiteType === 'vehicule') {
      const v = vehicules.find(v => v.id === entiteId);
      return v ? `${v.immatriculation} (${v.marque} ${v.modele})` : 'Véhicule inconnu';
    } else {
      const c = chauffeurs.find(c => c.id === entiteId);
      return c ? `${c.prenom} ${c.nom}` : 'Chauffeur inconnu';
    }
  };

  const calculateDaysRemaining = (dateExpiration: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(dateExpiration);
    expDate.setHours(0, 0, 0, 0);
    
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const enrichedDocuments = documents.map(doc => ({
    ...doc,
    entiteName: getEntiteName(doc.entiteId, doc.entiteType),
    joursRestants: calculateDaysRemaining(doc.dateExpiration)
  }));

  const filteredDocuments = enrichedDocuments.filter(d => {
    const matchesSearch = d.entiteName.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase()) ||
      (d.reference && d.reference.toLowerCase().includes(search.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && d.status === statusFilter;
  });

  const stats = [
    { 
      title: 'Documents expirés', 
      value: documents.filter(d => d.status === 'expire').length, 
      icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20' 
    },
    { 
      title: 'Expire dans ≤ 30 jours', 
      value: documents.filter(d => d.status === 'expire_bientot').length, 
      icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' 
    },
    { 
      title: 'Documents valides', 
      value: documents.filter(d => d.status === 'valide').length, 
      icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' 
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valide': return 'bg-success/10 text-success border-success/20';
      case 'expire_bientot': return 'bg-warning/10 text-warning border-warning/20';
      case 'expire': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-surface-2 text-text-secondary border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valide': return 'Valide';
      case 'expire_bientot': return 'Expire bientôt';
      case 'expire': return 'Expiré';
      default: return 'Inconnu';
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      deleteDocument(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Conformité
          </h1>
          <p className="text-text-secondary mt-1">Suivi des documents véhicules et chauffeurs</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="bg-surface hover:bg-surface-2 text-text-primary border border-border px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-surface p-6 rounded-xl border ${stat.border} shadow-sm flex items-center gap-4`}
          >
            <div className={`p-4 rounded-full ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm font-medium text-text-secondary">{stat.title}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher par entité, type de document..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-surface-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted mr-1" />
          <div className="flex bg-surface-2 p-1 rounded-lg border border-border">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                statusFilter === 'all' 
                  ? 'bg-surface text-text-primary shadow-sm' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setStatusFilter('expire')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                statusFilter === 'expire' 
                  ? 'bg-danger text-white shadow-sm' 
                  : 'text-text-muted hover:text-danger'
              }`}
            >
              Expirés
            </button>
            <button
              onClick={() => setStatusFilter('expire_bientot')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                statusFilter === 'expire_bientot' 
                  ? 'bg-warning text-white shadow-sm' 
                  : 'text-text-muted hover:text-warning'
              }`}
            >
              Expire dans 30J
            </button>
            <button
              onClick={() => setStatusFilter('valide')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                statusFilter === 'valide' 
                  ? 'bg-success text-white shadow-sm' 
                  : 'text-text-muted hover:text-success'
              }`}
            >
              Valides
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-text-secondary font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Entité</th>
                <th className="px-6 py-4">Type de document</th>
                <th className="px-6 py-4">Administration / Coût</th>
                <th className="px-6 py-4">Date expiration</th>
                <th className="px-6 py-4">Jours restants</th>
                <th className="px-6 py-4">Statut</th>
                {canManage && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-2/50 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 font-medium text-text-primary">{d.entiteName}</td>
                    <td className="px-6 py-4 text-text-secondary capitalize">{d.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{d.prestataire || '-'}</div>
                      <div className="text-xs text-text-secondary">{d.cout ? `${d.cout} MAD` : d.reference || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{formatDate(d.dateExpiration)}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${
                        d.joursRestants < 0 ? 'text-danger' : 
                        d.joursRestants <= 30 ? 'text-warning' : 'text-success'
                      }`}>
                        {d.joursRestants < 0 ? `Expiré il y a ${Math.abs(d.joursRestants)} jours` : 
                         d.joursRestants <= 30 ? `Expire dans ${d.joursRestants} jours` : 
                         'Valide'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(d.status)}`}>
                        {getStatusLabel(d.status)}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {d.fichierUrl && (
                            <a 
                              href={d.fichierUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                              title="Voir le document"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(d.id);
                            }}
                            className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-text-muted">
                    <FileText className="w-12 h-12 mx-auto text-border-strong mb-4" />
                    <p className="text-lg font-medium text-text-primary">Aucun document trouvé</p>
                    <p className="text-sm mt-1">Ajoutez des documents depuis les fiches véhicules ou chauffeurs.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
