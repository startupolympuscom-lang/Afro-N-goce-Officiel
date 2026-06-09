import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Truck, Package, Activity, MonitorSmartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AfroNegoceLogo } from '../components/Logo';

const apps = [
  {
    title: 'FleetOps',
    description: 'Système de gestion de flotte. Suivez vos véhicules, gérez les maintenances, les missions et les dépenses en temps réel.',
    icon: Truck,
    link: '/login',
    color: 'bg-blue-600',
  },
  {
    title: 'Afro Dispatch',
    description: 'Gestion des ventes et de la distribution. Gérez vos chauffeurs-vendeurs, vos clients et suivez les ventes en direct.',
    icon: Package,
    link: '/dispatch/login',
    color: 'bg-indigo-600',
  },
  {
    title: 'Master Tracker',
    description: "Moteur d'intelligence. Dashboard de contrôle global agrégeant les données de FleetOps et Afro Dispatch.",
    icon: Activity,
    link: '/master-tracker',
    color: 'bg-slate-900',
  },
  {
    title: 'Admin CMS',
    description: 'Système de gestion de contenu. Modifiez le site vitrine, gérez la page de notre histoire, ajoutez de nouvelles actualités.',
    icon: MonitorSmartphone,
    link: '/cms',
    color: 'bg-emerald-600',
  }
];

export default function AfroDigitalPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-slate-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <AfroNegoceLogo className="w-8 h-8 transition-transform group-hover:scale-105" />
            <span className="font-bold tracking-tight text-slate-900">AFRO Négoce</span>
          </Link>
          
          <Link 
            to="/" 
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="max-w-2xl mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Portail Digital
            </h1>
            <p className="text-lg text-slate-500">
              Accédez à vos outils de gestion et d'administration.
            </p>
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {apps.map((app, index) => {
            const Icon = app.icon;
            return (
              <motion.div
                key={app.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={app.link} className="block group h-full">
                  <div className="p-8 rounded-[24px] border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-300 flex flex-col h-full">
                    <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center text-white mb-8 ${app.color} group-hover:scale-105 transition-transform shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 mb-3">{app.title}</h2>
                    <p className="text-slate-500 leading-relaxed flex-1">
                      {app.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
