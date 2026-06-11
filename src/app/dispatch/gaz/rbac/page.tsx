import React, { useState } from 'react';
import { Shield, Save, Users, Plus, Trash2, KeyRound, Activity, X } from 'lucide-react';
import { useRbacStore, DispatchAccount } from '../../../../stores/useRbacStore';
import { useDispatchGazStore } from '../../../../stores/useDispatchGazStore';
import { DispatchRole } from '../../../../stores/useDispatchAuthStore';
import { toast } from 'sonner';

const rolesList: { id: DispatchRole; label: string }[] = [
  { id: 'admin', label: 'Admin Dispatch' },
  { id: 'stock_superviseur', label: 'Stock Superviseur' },
  { id: 'vendeur_comptoir', label: 'Vendeur Comptoir' },
  { id: 'comptable', label: 'Comptable' },
  { id: 'driver', label: 'Chauffeur / Vendeur' },
  { id: 'caissier', label: 'Caissier' },
];

export default function DispatchRbacPage() {
  const { permissions, updatePermissions, accounts, addAccount, deleteAccount } = useRbacStore();
  const { sales, expenses, paySlips, pointages, addDriver, deleteDriver } = useDispatchGazStore();
  const [activeTab, setActiveTab] = useState<'matrix' | 'accounts'>('matrix');

  // New Account state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccount, setNewAccount] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'driver' as DispatchRole
  });

  const [viewHistoryAccount, setViewHistoryAccount] = useState<DispatchAccount | null>(null);
  const [selectedMatrixRole, setSelectedMatrixRole] = useState<DispatchRole>('driver');

  const pagesList: { id: keyof typeof permissions[DispatchRole]; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'live', label: 'Live Tracking' },
    { id: 'stock', label: 'Stock Chauffeurs' },
    { id: 'manual_sale', label: 'Vente Manuelle' },
    { id: 'drivers', label: 'Chauffeurs' },
    { id: 'hr', label: 'Ressources Humaines' },
    { id: 'settings', label: 'Paramètres' },
    { id: 'clients', label: 'Clients' },
    { id: 'caisse', label: 'Caisse' },
    { id: 'commande', label: 'Commandes' },
    { id: 'compta', label: 'Comptabilité' },
    { id: 'rbac', label: 'Contrôle d\'accès' },
    { id: 'comptoir_sale', label: 'Vente Comptoir' },
    { id: 'driver_pointage', label: 'Pointage Chauffeur' },
    { id: 'driver_sale', label: 'Vente Chauffeur' },
    { id: 'driver_history', label: 'Mes Ventes (Chauffeur)' },
  ];

  const handleCheckboxChange = (page: keyof typeof permissions[DispatchRole], permission: keyof typeof permissions[DispatchRole][typeof page], checked: boolean) => {
    const rolePermissions = permissions[selectedMatrixRole];
    const pagePermissions = rolePermissions[page] || { view: false, modify: false, addEdit: false, delete: false, all: false };
    
    if (permission === 'all' && checked) {
      updatePermissions(selectedMatrixRole, page, { all: true, view: true, modify: true, addEdit: true, delete: true });
    } else if (permission === 'all' && !checked) {
      updatePermissions(selectedMatrixRole, page, { all: false });
    } else {
      let isAllNow = false;
      const current = { ...pagePermissions, [permission]: checked };
      if (current.view && current.modify && current.addEdit && current.delete) {
        isAllNow = true;
      }
      updatePermissions(selectedMatrixRole, page, { [permission]: checked, all: isAllNow });
    }
  };

  const handleSaveMatrix = () => {
    toast.success('Permissions mises à jour avec succès');
  };

  const handeAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccount.nom || !newAccount.prenom || !newAccount.email || !newAccount.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la création du compte');
        return;
      }

      const createdUser = await response.json();

      const newAcc: DispatchAccount = {
        id: createdUser.id,
        nom: newAccount.nom,
        prenom: newAccount.prenom,
        email: newAccount.email,
        role: newAccount.role,
        createdAt: new Date().toISOString()
      };

      addAccount(newAcc);
      
      if (newAccount.role === 'driver') {
        addDriver({
          id: createdUser.id,
          nom: newAccount.nom,
          prenom: newAccount.prenom,
          email: newAccount.email,
          phone: '',
          status: 'actif'
        });
      }

      toast.success('Compte créé avec succès');
      setNewAccount({ nom: '', prenom: '', email: '', password: '', role: 'driver' });
      setShowAddForm(false);
    } catch (err) {
      toast.error('Une erreur est survenue');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contrôle d'Accès (RBAC)</h1>
          <p className="mt-2 text-slate-500">
            Gérez les permissions d'accès et les comptes utilisateurs de la plateforme.
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'matrix' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            Matrice des Permissions
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'accounts' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Comptes Utilisateurs
          </button>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              Matrice des Permissions par Page
            </h2>
            <div className="flex items-center gap-4">
              <select
                value={selectedMatrixRole}
                onChange={(e) => setSelectedMatrixRole(e.target.value as DispatchRole)}
                className="rounded-xl border-slate-200 text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500 py-2.5 pl-4 pr-10"
              >
                {rolesList.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>

              <button
                onClick={handleSaveMatrix}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm text-sm font-bold"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                  <th className="py-4 px-6 min-w-[200px]">Page (Vue)</th>
                  <th className="py-4 px-6 text-center">View (Voir)</th>
                  <th className="py-4 px-6 text-center">Modify (Modifier)</th>
                  <th className="py-4 px-6 text-center">Add/Edit (Ajouter)</th>
                  <th className="py-4 px-6 text-center">Delete (Supprimer)</th>
                  <th className="py-4 px-6 text-center bg-indigo-50/50">All of the above</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagesList.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {page.label}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={permissions[selectedMatrixRole]?.[page.id]?.view || false}
                          onChange={(e) => handleCheckboxChange(page.id, 'view', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          disabled={selectedMatrixRole === 'admin'}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={permissions[selectedMatrixRole]?.[page.id]?.modify || false}
                          onChange={(e) => handleCheckboxChange(page.id, 'modify', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          disabled={selectedMatrixRole === 'admin'}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={permissions[selectedMatrixRole]?.[page.id]?.addEdit || false}
                          onChange={(e) => handleCheckboxChange(page.id, 'addEdit', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          disabled={selectedMatrixRole === 'admin'}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={permissions[selectedMatrixRole]?.[page.id]?.delete || false}
                          onChange={(e) => handleCheckboxChange(page.id, 'delete', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-600 cursor-pointer"
                          disabled={selectedMatrixRole === 'admin'}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 bg-indigo-50/20">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={permissions[selectedMatrixRole]?.[page.id]?.all || false}
                          onChange={(e) => handleCheckboxChange(page.id, 'all', e.target.checked)}
                          className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                          disabled={selectedMatrixRole === 'admin'}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Comptes Administrateurs & Employés</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 font-bold transition-all text-sm"
            >
              {showAddForm ? 'Fermer' : <><Plus className="w-4 h-4" /> Ajouter un compte</>}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handeAddAccount} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-500" />
                Créer un nouveau compte d'accès
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                  <input 
                    type="text" 
                    required
                    value={newAccount.prenom}
                    onChange={e => setNewAccount({...newAccount, prenom: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                  <input 
                    type="text" 
                    required
                    value={newAccount.nom}
                    onChange={e => setNewAccount({...newAccount, nom: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email / Identifiant</label>
                  <input 
                    type="email" 
                    required
                    value={newAccount.email}
                    onChange={e => setNewAccount({...newAccount, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe provisoire</label>
                  <input 
                    type="password" 
                    required
                    value={newAccount.password}
                    onChange={e => setNewAccount({...newAccount, password: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Rôle Attribué (RBAC)</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {rolesList.map(role => (
                      <div 
                        key={role.id}
                        onClick={() => setNewAccount({...newAccount, role: role.id})}
                        className={`p-3 border rounded-xl cursor-pointer transition-all text-center ${
                          newAccount.role === role.id 
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}
                      >
                        <div className="text-xs">{role.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                  Enregistrer le compte
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rôle Exécutif</th>
                  <th className="p-4">Créé le</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">
                      {acc.prenom} {acc.nom}
                    </td>
                    <td className="p-4 text-slate-600">{acc.email}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold">
                        {rolesList.find(r => r.id === acc.role)?.label || acc.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(acc.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setViewHistoryAccount(acc)}
                          className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors inline-block"
                          title="Voir l'activité"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        {acc.id !== 'admin_1' && (
                          <button 
                            onClick={async () => {
                              if (window.confirm('Voulez-vous révoquer l\'accès de cet utilisateur ?')) {
                                try {
                                  await fetch(`/api/users/${acc.id}`, { method: 'DELETE' });
                                  deleteAccount(acc.id);
                                  if (acc.role === 'driver') {
                                    deleteDriver(acc.id);
                                  }
                                  toast.success('Le compte a été supprimé');
                                } catch (err) {
                                  toast.error('Erreur lors de la suppression');
                                }
                              }
                            }}
                            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors inline-block"
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
        </div>
      )}

      {/* History Modal */}
      {viewHistoryAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewHistoryAccount(null)} />
          <div className="bg-white mx-auto rounded-3xl shadow-xl w-full max-w-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Activité: {viewHistoryAccount.prenom} {viewHistoryAccount.nom}
                </h2>
                <div className="text-sm font-medium text-slate-500 capitalize">{viewHistoryAccount.role}</div>
              </div>
              <button 
                onClick={() => setViewHistoryAccount(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center text-blue-700">
                  <div className="text-2xl font-black">{sales.filter(s => s.driverId === viewHistoryAccount.id).length}</div>
                  <div className="text-xs font-bold uppercase tracking-wide">Ventes</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center text-emerald-700">
                  <div className="text-2xl font-black">{pointages.filter(p => p.driverId === viewHistoryAccount.id).length}</div>
                  <div className="text-xs font-bold uppercase tracking-wide">Présences</div>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center text-orange-700">
                  <div className="text-2xl font-black">{expenses.filter(e => e.driverId === viewHistoryAccount.id).length}</div>
                  <div className="text-xs font-bold uppercase tracking-wide">Dépenses</div>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center text-purple-700">
                  <div className="text-2xl font-black">{paySlips.filter(p => p.driverId === viewHistoryAccount.id).length}</div>
                  <div className="text-xs font-bold uppercase tracking-wide">Fiches Paie</div>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 mb-4 border-b pb-2">Dernières Activités</h3>
              <div className="space-y-4 text-sm">
                {sales.filter(s => s.driverId === viewHistoryAccount.id).slice(-5).reverse().map(sale => (
                  <div key={sale.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-700 block">Vente Enregistrée</span>
                      <span className="text-slate-500 text-xs">{new Date(sale.date).toLocaleString('fr-FR')}</span>
                    </div>
                    <span className="font-medium text-emerald-600">+{sale.totalPrice} MAD</span>
                  </div>
                ))}
                {sales.filter(s => s.driverId === viewHistoryAccount.id).length === 0 && (
                  <div className="text-slate-500 italic text-center p-4">Aucune vente enregistrée</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
