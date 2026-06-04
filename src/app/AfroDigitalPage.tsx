import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Truck, Package, ArrowRight, Activity, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AfroNegoceLogo, AestheticFlame } from '../components/Logo';

const GridBackground = () => (
  <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1e3a8a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
);

export default function AfroDigitalPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <AfroNegoceLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
              <span className="text-xl font-black tracking-tighter text-blue-950 uppercase font-display">AFRO Négoce</span>
            </Link>
            
            <Link 
              to="/" 
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-40 pb-32 overflow-hidden">
        <GridBackground />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-[0.2em] font-serif italic">Transformation Numérique</span>
              </div>
              <h1 className="text-6xl lg:text-[112px] font-black text-slate-900 leading-[0.85] tracking-tighter mb-10 font-display">
                PORTAIL <br />
                <span className="text-blue-600">AFRO</span> <span className="font-serif italic font-light">digital.</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                Accédez à nos outils de gestion de pointe pour une efficacité opérationnelle maximale.
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* FleetOps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <Link to="/login" className="block group h-full">
                <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50 hover:border-blue-600/20 transition-all duration-300 h-full flex flex-col">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xl shadow-blue-100">
                    <Truck className="w-8 h-8" />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-900 mb-4 tracking-[0.2em] uppercase">FLEETOPS</h2>
                  <p className="text-slate-500 flex-1 mb-10 font-medium leading-relaxed text-lg">
                    Système de gestion de flotte. Suivez vos véhicules, gérez les maintenances, les missions et les dépenses en temps réel.
                  </p>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:translate-x-2 transition-transform">
                    Accéder à FleetOps <ArrowRight className="w-4 h-4 ml-3" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Afro Dispatch */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link to="/dispatch/login" className="block group h-full">
                <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50 hover:border-indigo-600/20 transition-all duration-300 h-full flex flex-col">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xl shadow-indigo-100">
                    <Package className="w-8 h-8" />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-900 mb-4 tracking-[0.2em] uppercase">AFRO DISPATCH</h2>
                  <p className="text-slate-500 flex-1 mb-10 font-medium leading-relaxed text-lg">
                    Gestion des ventes et de la distribution. Gérez vos chauffeurs-vendeurs, vos clients, les prix par zone et suivez les ventes en direct.
                  </p>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-600 group-hover:translate-x-2 transition-transform">
                    Accéder à Afro Dispatch <ArrowRight className="w-4 h-4 ml-3" />
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Master Tracker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Link to="/master-tracker" className="block group h-full">
                <div className="bg-slate-900 rounded-[40px] p-12 border border-slate-800 shadow-2xl shadow-slate-900/50 hover:border-blue-500/50 transition-all duration-300 h-full flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all duration-500" />
                  
                  <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300 shadow-xl shadow-slate-800">
                    <Activity className="w-8 h-8" />
                  </div>
                  <h2 className="text-[10px] font-black text-white mb-4 tracking-[0.2em] uppercase">MASTER TRACKER</h2>
                  <p className="text-slate-400 flex-1 mb-10 font-medium leading-relaxed text-lg">
                    Moteur d'intelligence MT. Dashboard de contrôle global agrégeant les données de FleetOps et Afro Dispatch pour la haute direction.
                  </p>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:translate-x-2 transition-transform">
                    Ouvrir la Control Room <ArrowRight className="w-4 h-4 ml-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
            {/* Admin CMS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link to="/cms" className="block group h-full">
                <div className="bg-white rounded-[40px] p-12 border border-slate-100 shadow-2xl shadow-slate-200/50 hover:border-emerald-600/20 transition-all duration-300 h-full flex flex-col">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xl shadow-emerald-100">
                    <Activity className="w-8 h-8" />
                  </div>
                  <h2 className="text-[10px] font-black text-slate-900 mb-4 tracking-[0.2em] uppercase">ADMIN CMS</h2>
                  <p className="text-slate-500 flex-1 mb-10 font-medium leading-relaxed text-lg">
                    Système de gestion de contenu. Modifiez le site vitrine, gérez la page de notre histoire, ajoutez de nouvelles actualités.
                  </p>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-emerald-600 group-hover:translate-x-2 transition-transform">
                    Accéder au CMS <ArrowRight className="w-4 h-4 ml-3" />
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-900 pt-32 pb-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <Link to="/" className="flex items-center justify-center gap-3 mb-10 group">
            <AfroNegoceLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
            <span className="text-2xl font-black tracking-tighter uppercase font-display">AFRO Négoce</span>
          </Link>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">© 2026 AFRO Négoce. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
