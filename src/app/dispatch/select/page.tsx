import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Flame, ShoppingCart, ArrowRight } from 'lucide-react';
import { useDispatchAuthStore } from '../../../stores/useDispatchAuthStore';

export default function DispatchSelectPage() {
  const navigate = useNavigate();
  const user = useDispatchAuthStore(s => s.user);

  React.useEffect(() => {
    if (!user) {
      navigate('/dispatch/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
          Bonjour, {user.prenom}
        </h2>
        <p className="text-lg text-slate-600">
          Sélectionnez le type de produits que vous souhaitez gérer aujourd'hui.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 px-4">
          {/* Gaz Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button 
              onClick={() => {
                if (user.role === 'admin') navigate('/dispatch/gaz/dashboard');
                else if (user.role === 'comptable') navigate('/dispatch/gaz/compta');
                else if (user.role === 'vendeur_comptoir') navigate('/dispatch/gaz/comptoir/sale');
                else if (user.role === 'stock_superviseur') navigate('/dispatch/gaz/stock');
                else if (user.role === 'caissier') navigate('/dispatch/gaz/caisse');
                else navigate('/dispatch/gaz/driver/sale');
              }}
              className="w-full text-left bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 h-full flex flex-col group"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Flame className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Produits Gaz (GPL)</h3>
              <p className="text-slate-600 flex-1 mb-8">
                Gérez la distribution, les ventes et les chauffeurs pour les produits Butagaz et autres gaz conditionnés.
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                Accéder au module Gaz <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </button>
          </motion.div>

          {/* FCMG Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button 
              onClick={() => alert('Module FCMG en cours de développement')}
              className="w-full text-left bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 h-full flex flex-col group opacity-70 hover:opacity-100"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Produits FMCG</h3>
              <p className="text-slate-600 flex-1 mb-8">
                Gérez la distribution des biens de grande consommation (Fast-Moving Consumer Goods).
              </p>
              <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
                Bientôt disponible <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
