import { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database,
  Globe,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { UtilisateursTab } from './UtilisateursTab';
import { SiteWebTab } from './SiteWebTab';
import { FlotteConfigTab } from './FlotteConfigTab';
import { Truck } from 'lucide-react';

export default function ParametresPage() {
  const user = useAuthStore(s => s.user);
  const tabs = [
    { id: 'profil', label: 'Mon Profil', icon: User },
    { id: 'entreprise', label: 'Entreprise', icon: Globe },
    { id: 'flotte', label: 'Configuration Flotte', icon: Truck },
    { id: 'siteweb', label: 'Site Web', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'utilisateurs', label: 'Utilisateurs & Rôles', icon: Shield },
    { id: 'donnees', label: 'Données & Export', icon: Database },
  ];

  const [activeTab, setActiveTab] = useState('profil');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profil':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Prénom</label>
                  <input type="text" defaultValue={user?.prenom || ''} className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Nom</label>
                  <input type="text" defaultValue={user?.nom || ''} className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                  <input type="email" defaultValue={user?.email || ''} className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="text-lg font-bold text-text-primary mb-4">Mot de passe</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Mot de passe actuel</label>
                  <input type="password" placeholder="••••••••" className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Nouveau mot de passe</label>
                    <input type="password" placeholder="••••••••" className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Confirmer le mot de passe</label>
                    <input type="password" placeholder="••••••••" className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </button>
            </div>
          </div>
        );
      case 'entreprise':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4">Informations de l'entreprise</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Nom de l'entreprise</label>
                  <input type="text" defaultValue="Transport & Logistique SA" className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Numéro SIRET / ICE</label>
                    <input type="text" defaultValue="12345678900012" className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">TVA Intracommunautaire</label>
                    <input type="text" defaultValue="FR12345678901" className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Adresse du siège social</label>
                  <textarea rows={3} defaultValue="123 Avenue des Champs-Élysées&#10;75008 Paris&#10;France" className="w-full p-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" />
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </button>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-lg font-bold text-text-primary mb-4">Préférences de notification</h3>
              <div className="space-y-4">
                {[
                  { id: 'notif-1', label: 'Alertes de maintenance', desc: 'Être notifié quand un véhicule nécessite une révision' },
                  { id: 'notif-2', label: 'Expiration de documents', desc: 'Rappels pour les assurances, visites techniques, etc.' },
                  { id: 'notif-3', label: 'Nouvelles infractions', desc: 'Alerte immédiate lors de la saisie d\'une infraction' },
                  { id: 'notif-4', label: 'Dépassement de budget', desc: 'Alerte si les dépenses dépassent le budget alloué' },
                  { id: 'notif-5', label: 'Rapports hebdomadaires', desc: 'Recevoir un résumé de l\'activité par email' },
                ].map((notif) => (
                  <div key={notif.id} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-surface-2/50">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        id={notif.id}
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 text-primary bg-surface border-border rounded focus:ring-primary/20"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={notif.id} className="font-medium text-text-primary cursor-pointer">
                        {notif.label}
                      </label>
                      <p className="text-sm text-text-secondary mt-1">{notif.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm">
                <Save className="w-4 h-4" />
                Enregistrer les préférences
              </button>
            </div>
          </div>
        );
      case 'utilisateurs':
        return <UtilisateursTab />;
      case 'flotte':
        return <FlotteConfigTab />;
      case 'siteweb':
        return <SiteWebTab />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="w-16 h-16 text-border-strong mb-4" />
            <h2 className="text-xl font-bold text-text-primary mb-2">Configuration {tabs.find(t => t.id === activeTab)?.label.toLowerCase()}</h2>
            <p className="text-text-secondary max-w-md">
              Les options de configuration spécifiques à cette section seront bientôt disponibles.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            Paramètres
          </h1>
          <p className="text-text-secondary mt-1">Configuration de l'application et de votre compte</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-primary' : 'text-text-muted'}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-surface rounded-xl border border-border shadow-sm p-6 lg:p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
