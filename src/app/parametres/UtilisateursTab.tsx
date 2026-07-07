import React, { useState } from 'react';
import { useUsersStore } from '../../stores/useUsersStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { Plus, Trash2, Shield, User as UserIcon, Mail, Key } from 'lucide-react';
import { Role } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

export function UtilisateursTab() {
  const { users, addUser, deleteUser } = useUsersStore();
  const currentUser = useAuthStore(s => s.user);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('chef_de_parc');
  const [password, setPassword] = useState('');

  const canManage = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: nanoid(),
      nom,
      prenom,
      email,
      password: hashedPassword,
      role,
      avatarInitials: `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase(),
      createdAt: new Date().toISOString()
    };

    addUser(newUser);
    setIsModalOpen(false);
    
    // Reset form
    setNom('');
    setPrenom('');
    setEmail('');
    setRole('chef_de_parc');
    setPassword('');
  };

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrateur';
      case 'chef_de_parc': return 'Chef de Parc';
      default: return r;
    }
  };

  const getRoleColor = (r: Role) => {
    switch (r) {
      case 'super_admin': return 'bg-danger/10 text-danger border-danger/20';
      case 'admin': return 'bg-primary/10 text-primary border-primary/20';
      case 'chef_de_parc': return 'bg-info/10 text-info border-info/20';
      default: return 'bg-surface-2 text-text-secondary border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Utilisateurs & Rôles</h3>
          <p className="text-sm text-text-secondary mt-1">Gérez les accès à l'application</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvel utilisateur</span>
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-sm text-text-secondary">
                <th className="p-4 font-medium">Utilisateur</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Rôle</th>
                <th className="p-4 font-medium">Date d'ajout</th>
                <th className="p-4 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {u.avatarInitials}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{u.prenom} {u.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {u.email}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(u.role)}`}>
                      {getRoleLabel(u.role)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-text-secondary">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4">
                    {canManage && u.id !== currentUser?.id && (
                      <button 
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
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
                  <UserIcon className="w-5 h-5 text-primary" />
                  Nouvel Utilisateur
                </h2>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Prénom</label>
                    <input
                      type="text"
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Nom</label>
                    <input
                      type="text"
                      required
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Rôle</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                    >
                      <option value="chef_de_parc">Chef de Parc</option>
                      <option value="admin">Administrateur</option>
                      {currentUser?.role === 'super_admin' && (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Mot de passe temporaire</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mot de passe pour la première connexion"
                      className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    L'utilisateur devra changer ce mot de passe lors de sa première connexion.
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-text-secondary hover:text-text-primary font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
                  >
                    Créer l'utilisateur
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
