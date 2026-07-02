import React, { useState } from 'react';
import { useDispatchGazStore, DispatchGazDriver } from '../../../../stores/useDispatchGazStore';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DispatchDriversPage() {
  const { drivers, addDriver, updateDriver, deleteDriver } = useDispatchGazStore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<DispatchGazDriver> & { password?: string }>({
    nom: '', prenom: '', email: '', phone: '', status: 'actif', cnss: '', address: '', cin: '', password: '', company: 'afro_negoce'
  });

  React.useEffect(() => {
    const syncDrivers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const apiUsers = await res.json();
          const dbDrivers = apiUsers.filter((u: any) => u.role === 'driver');
          
          const updatedDrivers = [...drivers];
          let updated = false;

          dbDrivers.forEach((dbD: any) => {
            const exists = updatedDrivers.find(d => d.id === dbD.id || (d.email && d.email === dbD.email));
            if (!exists) {
              updatedDrivers.push({
                id: dbD.id,
                nom: dbD.nom,
                prenom: dbD.prenom,
                email: dbD.email || '',
                phone: '',
                status: 'actif',
                cnss: '',
                address: '',
                cin: '',
              });
              updated = true;
            } else {
              let individualUpdated = false;
              if (exists.nom !== dbD.nom) { exists.nom = dbD.nom; individualUpdated = true; }
              if (exists.prenom !== dbD.prenom) { exists.prenom = dbD.prenom; individualUpdated = true; }
              if (individualUpdated) updated = true;
            }
          });

          if (updated) {
            useDispatchGazStore.setState({ drivers: updatedDrivers });
          }
        }
      } catch (err) {
        console.error('Failed to sync drivers from database:', err);
      }
    };
    syncDrivers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nom && formData.prenom) {
      let createdUserId = Date.now().toString();
      if (formData.email && formData.password) {
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nom: formData.nom,
              prenom: formData.prenom,
              email: formData.email,
              password: formData.password,
              role: 'driver'
            })
          });

          if (!res.ok) {
            const errorData = await res.json();
            toast.error(errorData.error || 'Erreur lors de la création du compte');
            return;
          }

          const createdUser = await res.json();
          createdUserId = createdUser.id;
        } catch (err) {
          console.error(err);
          toast.error('Erreur réseau');
          return;
        }
      }

      addDriver({
        id: createdUserId,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email || '',
        phone: formData.phone || '',
        status: formData.status as 'actif' | 'inactif',
        cnss: formData.cnss || '',
        address: formData.address || '',
        cin: formData.cin || '',
        company: formData.company || 'afro_negoce',
      });
      setIsAdding(false);
      setFormData({ nom: '', prenom: '', email: '', phone: '', status: 'actif', cnss: '', address: '', cin: '', password: '', company: 'afro_negoce' });
      toast.success('Chauffeur ajouté avec succès');
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete user account:', err);
      }
      deleteDriver(id);
      toast.success('Chauffeur supprimé avec succès');
    }
  };

  const [companyFilter, setCompanyFilter] = useState<'all' | 'afro_negoce' | 'chakirine_gaz'>('all');

  const filteredDrivers = drivers.filter(d => {
    if (companyFilter === 'all') return true;
    return d.company === companyFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chauffeurs / Vendeurs</h1>
          <p className="text-sm text-slate-500">Gérez vos chauffeurs par entité (Ste. Afro Négoce & Chakirine Gaz)</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={companyFilter}
            onChange={e => setCompanyFilter(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm font-medium text-slate-700 outline-none"
          >
            <option value="all">Toutes les sociétés</option>
            <option value="afro_negoce">Ste. Afro Négoce</option>
            <option value="chakirine_gaz">Chakirine Gaz</option>
          </select>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter un chauffeur
          </button>
        </div>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Nouveau Chauffeur</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
              <input type="text" required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input type="text" required value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (pour connexion)</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Créer le mot de passe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Société Affiliée</label>
              <select 
                value={formData.company} 
                onChange={e => setFormData({...formData, company: e.target.value as any})} 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white outline-none"
              >
                <option value="afro_negoce">Ste. Afro Négoce</option>
                <option value="chakirine_gaz">Chakirine Gaz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Numéro de CIN</label>
              <input type="text" required value={formData.cin} onChange={e => setFormData({...formData, cin: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Num CNSS</label>
              <input type="text" value={formData.cnss} onChange={e => setFormData({...formData, cnss: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Adresse Domicile</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-medium text-slate-600">Nom & Prénom</th>
              <th className="p-4 font-medium text-slate-600">Société</th>
              <th className="p-4 font-medium text-slate-600">Contact</th>
              <th className="p-4 font-medium text-slate-600">Statut</th>
              <th className="p-4 font-medium text-slate-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map(driver => (
              <tr key={driver.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-medium text-slate-900">{driver.prenom} {driver.nom}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    driver.company === 'chakirine_gaz' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {driver.company === 'chakirine_gaz' ? 'Chakirine Gaz' : 'Ste. Afro Négoce'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="text-sm text-slate-600">{driver.email}</div>
                  <div className="text-sm text-slate-500">{driver.phone}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    driver.status === 'actif' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {driver.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleDeleteDriver(driver.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {drivers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">Aucun chauffeur enregistré.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
