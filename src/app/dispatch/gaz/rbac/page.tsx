import React from 'react';
import { Shield, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useRbacStore } from '../../../../stores/useRbacStore';
import { DispatchRole } from '../../../../stores/useDispatchAuthStore';
import { toast } from 'sonner';

const rolesList: { id: DispatchRole; label: string }[] = [
  { id: 'admin', label: 'Admin Dispatch' },
  { id: 'stock_superviseur', label: 'Stock Superviseur' },
  { id: 'vendeur_comptoir', label: 'Vendeur Comptoir' },
  { id: 'comptable', label: 'Comptable' },
  { id: 'driver', label: 'Chauffeur / Vendeur' },
];

export default function DispatchRbacPage() {
  const { permissions, updatePermissions } = useRbacStore();

  const handleCheckboxChange = (role: DispatchRole, permission: keyof typeof permissions[DispatchRole], checked: boolean) => {
    if (permission === 'all' && checked) {
      updatePermissions(role, { all: true, view: true, modify: true, addEdit: true, delete: true });
    } else if (permission === 'all' && !checked) {
      updatePermissions(role, { all: false });
    } else {
      let isAllNow = false;
      const current = { ...permissions[role], [permission]: checked };
      if (current.view && current.modify && current.addEdit && current.delete) {
        isAllNow = true;
      }
      updatePermissions(role, { [permission]: checked, all: isAllNow });
    }
  };

  const handleSave = () => {
    toast.success('Permissions mises à jour avec succès');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contrôle d'Accès (RBAC)</h1>
          <p className="mt-2 text-slate-500">
            Gérez les permissions d'accès et d'action pour chaque rôle de la plateforme.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Save className="w-5 h-5" />
          Sauvegarder
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Matrice des Permissions
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
                <th className="py-4 px-6 min-w-[200px]">Rôle</th>
                <th className="py-4 px-6 text-center">View (Voir)</th>
                <th className="py-4 px-6 text-center">Modify (Modifier)</th>
                <th className="py-4 px-6 text-center">Add/Edit (Ajouter)</th>
                <th className="py-4 px-6 text-center">Delete (Supprimer)</th>
                <th className="py-4 px-6 text-center bg-indigo-50/50">All of the above</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rolesList.map((role) => (
                <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-900">
                    {role.label}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={permissions[role.id]?.view || false}
                        onChange={(e) => handleCheckboxChange(role.id, 'view', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        disabled={role.id === 'admin'}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={permissions[role.id]?.modify || false}
                        onChange={(e) => handleCheckboxChange(role.id, 'modify', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        disabled={role.id === 'admin'}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={permissions[role.id]?.addEdit || false}
                        onChange={(e) => handleCheckboxChange(role.id, 'addEdit', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        disabled={role.id === 'admin'}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={permissions[role.id]?.delete || false}
                        onChange={(e) => handleCheckboxChange(role.id, 'delete', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-600 cursor-pointer"
                        disabled={role.id === 'admin'}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-6 bg-indigo-50/20">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={permissions[role.id]?.all || false}
                        onChange={(e) => handleCheckboxChange(role.id, 'all', e.target.checked)}
                        className="w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                        disabled={role.id === 'admin'}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
