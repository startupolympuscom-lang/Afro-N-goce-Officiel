import React, { useState } from 'react';
import { useChauffeurStore } from '../../stores/useChauffeurStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle,
  User,
  Trash2,
  TrendingUp,
  Activity,
  Phone,
  Mail,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LABELS } from '../../lib/constants';
import { ChauffeurStatus, CategoriePermis } from '../../types';
import { ChauffeurDetailsModal } from './ChauffeurDetailsModal';

export default function ChauffeursPage() {
  const { chauffeurs, addChauffeur, deleteChauffeur } = useChauffeurStore();
  const user = useAuthStore(s => s.user);
  const canManage = user?.role === 'super_admin' || user?.role === 'admin';

  const [view, setView] = useState<'table' | 'cards'>('cards');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChauffeurId, setSelectedChauffeurId] = useState<string | null>(null);

  // Form state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [cin, setCin] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [categoriePermis, setCategoriePermis] = useState('B');

  const filteredChauffeurs = chauffeurs.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.prenom.toLowerCase().includes(search.toLowerCase()) ||
    c.cin.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: ChauffeurStatus) => {
    switch (status) {
      case 'actif': return 'bg-success/10 text-success border-success/20';
      case 'conge': return 'bg-warning/10 text-warning border-warning/20';
      case 'suspendu': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-surface-2 text-text-secondary border-border';
    }
  };

  const getStatusIcon = (status: ChauffeurStatus) => {
    switch (status) {
      case 'actif': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'conge': return <Clock className="w-3.5 h-3.5" />;
      case 'suspendu': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-success stroke-success';
    if (score >= 40) return 'text-warning stroke-warning';
    return 'text-danger stroke-danger';
  };

  const handleAddChauffeur = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    addChauffeur({
      nom,
      prenom,
      cin,
      telephone,
      email,
      categoriePermis: categoriePermis as CategoriePermis,
      dateEmbauche: new Date().toISOString(),
    });
    setIsModalOpen(false);
    // Reset form
    setNom('');
    setPrenom('');
    setCin('');
    setTelephone('');
    setEmail('');
    setCategoriePermis('B');
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!canManage) return;
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      deleteChauffeur(id);
    }
  };

  return (
    <div className="space-y-8 relative h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary flex items-center gap-3">
            Chauffeurs
            <span className="bg-primary/10 text-primary text-sm font-bold px-3 py-1 rounded-full">
              {chauffeurs.length}
            </span>
          </h1>
          <p className="text-text-secondary mt-2">Gérez et suivez les performances de votre équipe de conducteurs</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-surface p-1 rounded-xl border border-border flex items-center shadow-sm">
            <button 
              onClick={() => setView('table')}
              className={`p-2 rounded-lg transition-all ${view === 'table' ? 'bg-surface-2 shadow-sm text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'}`}
              title="Vue Liste"
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView('cards')}
              className={`p-2 rounded-lg transition-all ${view === 'cards' ? 'bg-surface-2 shadow-sm text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'}`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          {canManage && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Ajouter un chauffeur</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:border-primary/20 transition-colors cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-secondary">Effectif Total</div>
            <div className="text-2xl font-black text-text-primary">{chauffeurs.length}</div>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:border-success/20 transition-colors cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-secondary">En Activité</div>
            <div className="text-2xl font-black text-text-primary">{chauffeurs.filter(c => c.status === 'actif').length}</div>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:border-warning/20 transition-colors cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-secondary">En Congé</div>
            <div className="text-2xl font-black text-text-primary">{chauffeurs.filter(c => c.status === 'conge').length}</div>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex items-center gap-4 hover:border-info/20 transition-colors cursor-pointer group">
          <div className="w-14 h-14 rounded-2xl bg-info/10 text-info flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-secondary">Score Moyen</div>
            <div className="text-2xl font-black text-text-primary">
              {chauffeurs.length > 0 ? Math.round(chauffeurs.reduce((acc, c) => acc + c.score, 0) / chauffeurs.length) : 0}<span className="text-lg text-text-muted">/100</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface p-2 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, prénom, CIN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-transparent font-medium text-text-primary text-sm focus:outline-none focus:ring-0 placeholder:text-text-muted"
          />
        </div>
        <div className="w-px bg-border hidden sm:block mx-1 my-2"></div>
        <button className="h-12 px-6 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-text-secondary hover:bg-surface-2 transition-colors">
          <Filter className="w-4 h-4" />
          Filtres
        </button>
      </div>

      {view === 'table' ? (
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/60 text-text-secondary font-bold border-b border-border text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-5">Chauffeur</th>
                  <th className="px-6 py-5">CIN</th>
                  <th className="px-6 py-5">Contact</th>
                  <th className="px-6 py-5">Permis</th>
                  <th className="px-6 py-5">Score</th>
                  <th className="px-6 py-5">Statut</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredChauffeurs.map((c) => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-surface-2/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedChauffeurId(c.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {c.prenom[0]}{c.nom[0]}
                        </div>
                        <div>
                          <div className="font-bold text-text-primary group-hover:text-primary transition-colors">{c.prenom} {c.nom}</div>
                          <div className="text-xs text-text-muted mt-0.5">Ajouté le {new Date(c.dateEmbauche).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-text-secondary">{c.cin}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-text-secondary flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{c.telephone}</div>
                        {c.email && <div className="text-xs text-text-muted flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{c.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-surface text-text-primary px-3 py-1 rounded-lg text-xs font-bold border border-border shadow-sm flex items-center w-fit gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-text-muted" />
                        {c.categoriePermis}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-bold flex items-center gap-1 p-1 px-2 rounded-lg bg-surface-2 border border-border w-fit ${getScoreColor(c.score).split(' ')[0]}`}>
                        <TrendingUp className="w-3 h-3" />
                        {c.score}/100
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getStatusColor(c.status)}`}>
                        {getStatusIcon(c.status)}
                        {LABELS.status[c.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canManage && (
                          <button 
                            onClick={(e) => handleDelete(e, c.id)}
                            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors border border-transparent hover:border-danger/20"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredChauffeurs.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-surface-2 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-border shadow-inner">
                <Users className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Aucun chauffeur trouvé</h3>
              <p className="text-text-secondary max-w-sm mx-auto">La liste des chauffeurs est vide ou aucun résultat ne correspond à votre recherche.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredChauffeurs.map((c) => (
            <motion.div 
              key={c.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedChauffeurId(c.id)}
              className="group bg-surface rounded-3xl border border-border shadow-sm overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 flex flex-col relative cursor-pointer"
            >
              {canManage && (
                <button 
                  onClick={(e) => handleDelete(e, c.id)}
                  className="absolute top-4 right-4 p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/5 to-transparent z-0"></div>

              <div className="p-6 flex-1 flex flex-col items-center text-center relative z-10">
                <div className="relative mb-5 mt-2">
                  <div className="w-24 h-24 rounded-3xl rotate-3 group-hover:rotate-6 transition-transform shadow-md bg-primary/10 text-primary flex items-center justify-center font-black text-3xl border-4 border-surface overflow-hidden">
                    <span className="-rotate-3 group-hover:-rotate-6 transition-transform">{c.prenom[0]}{c.nom[0]}</span>
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-surface rounded-2xl shadow-lg border border-border p-1">
                    <svg viewBox="0 0 36 36" className={`w-full h-full ${getScoreColor(c.score)}`}>
                      <path
                        className="stroke-surface-2"
                        strokeWidth="3.5"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="stroke-current"
                        strokeWidth="3.5"
                        strokeDasharray={`${c.score}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-text-primary">
                      {c.score}
                    </div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">{c.prenom} {c.nom}</h3>
                <p className="text-sm font-medium text-text-secondary font-mono mt-1 flex items-center justify-center gap-1"><User className="w-3.5 h-3.5" />{c.cin}</p>
                
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <span className="bg-surface text-text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-border shadow-sm flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-text-muted" /> Permis {c.categoriePermis}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-sm ${getStatusColor(c.status)}`}>
                    {getStatusIcon(c.status)}
                    {LABELS.status[c.status]}
                  </span>
                </div>
              </div>
              
              <div className="border-t border-border bg-surface/50 p-4 flex flex-col gap-3 relative z-10 backdrop-blur-sm">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-muted flex items-center gap-1.5"><Phone className="w-4 h-4" /></span>
                  <span className="font-semibold text-text-primary">{c.telephone}</span>
                </div>
                {c.email && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted flex items-center gap-1.5"><Mail className="w-4 h-4" /></span>
                    <span className="font-semibold text-text-primary truncate ml-4" title={c.email}>{c.email}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border/50 text-center">
                   <span className="text-sm font-black text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">Voir Profil <ChevronRight className="w-4 h-4" /></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Chauffeur Modal */}
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
                  <User className="w-5 h-5 text-primary" />
                  Ajouter un chauffeur
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-md transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form id="add-chauffeur-form" onSubmit={handleAddChauffeur} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Prénom</label>
                      <input 
                        type="text" 
                        required
                        value={prenom}
                        onChange={e => setPrenom(e.target.value)}
                        placeholder="Ex: Ahmed" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Nom</label>
                      <input 
                        type="text" 
                        required
                        value={nom}
                        onChange={e => setNom(e.target.value)}
                        placeholder="Ex: Benali" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">CIN</label>
                      <input 
                        type="text" 
                        required
                        value={cin}
                        onChange={e => setCin(e.target.value.toUpperCase())}
                        placeholder="Ex: AB123456" 
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono uppercase" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Catégorie Permis</label>
                      <select 
                        required
                        value={categoriePermis}
                        onChange={e => setCategoriePermis(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                      >
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="EC">EC</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1">Téléphone</label>
                      <input 
                        type="tel" 
                        required
                        value={telephone}
                        onChange={e => setTelephone(e.target.value)}
                        placeholder="Ex: 0612345678" 
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
                        placeholder="Ex: ahmed@example.com" 
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
                  form="add-chauffeur-form"
                  className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {selectedChauffeurId && (
        <ChauffeurDetailsModal
          chauffeurId={selectedChauffeurId}
          onClose={() => setSelectedChauffeurId(null)}
        />
      )}
    </div>
  );
}
