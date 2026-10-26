import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Flame, ShoppingCart, ArrowRight, LogOut } from 'lucide-react';
import { useDispatchAuthStore } from '../../../stores/useDispatchAuthStore';
import { BrandMark } from '../../../components/Logo';
import { DISPATCH_ROLE_LABELS } from '../../../components/layout/dispatchNav';

export default function DispatchSelectPage() {
  const navigate = useNavigate();
  const user = useDispatchAuthStore(s => s.user);
  const logout = useDispatchAuthStore(s => s.logout);

  React.useEffect(() => {
    if (!user) {
      navigate('/dispatch/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const openGaz = () => {
    if (user.role === 'admin') navigate('/dispatch/gaz/dashboard');
    else if (user.role === 'comptable') navigate('/dispatch/gaz/compta');
    else if (user.role === 'vendeur_comptoir') navigate('/dispatch/gaz/comptoir/sale');
    else if (user.role === 'stock_superviseur') navigate('/dispatch/gaz/stock');
    else if (user.role === 'caissier') navigate('/dispatch/gaz/caisse');
    else navigate('/dispatch/gaz/driver/sale');
  };

  return (
    <div className="theme-dispatch min-h-screen bg-background text-text-primary flex flex-col">
      <header className="h-16 bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark className="w-9 h-9 rounded-lg" />
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">Afro Dispatch</div>
              <div className="text-xs text-text-muted">Afro Négoce</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-sm font-medium">{user.prenom} {user.nom}</div>
              <div className="text-xs text-text-muted">{DISPATCH_ROLE_LABELS[user.role] ?? user.role}</div>
            </div>
            <button
              onClick={() => { logout(); navigate('/dispatch/login'); }}
              aria-label="Déconnexion"
              title="Déconnexion"
              className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6">
        <div className="max-w-5xl w-full mx-auto">
          <div className="max-w-2xl mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Bonjour, {user.prenom}</h1>
            <p className="text-text-secondary mt-2 text-lg">Choisissez le module sur lequel vous travaillez aujourd'hui.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              onClick={openGaz}
              className="w-full text-left bg-surface rounded-2xl p-7 border border-border shadow-xs hover:shadow-lg hover:border-primary/40 transition-all duration-300 flex flex-col group"
            >
              <span className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <Flame className="w-6 h-6" />
              </span>
              <h2 className="text-xl font-semibold">Produits gaz (GPL)</h2>
              <p className="text-text-secondary mt-2 flex-1">
                Distribution, ventes, stocks et chauffeurs-vendeurs pour les bouteilles Butagaz et les autres gaz conditionnés.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                Ouvrir le module gaz <ArrowRight className="w-4 h-4" />
              </span>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 }}
              aria-disabled="true"
              className="w-full text-left bg-surface/60 rounded-2xl p-7 border border-dashed border-border-strong flex flex-col"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="w-12 h-12 bg-surface-2 text-text-muted rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
                </span>
                <span className="text-xs font-medium text-text-secondary bg-surface-2 border border-border px-2.5 py-1 rounded-full">Bientôt disponible</span>
              </div>
              <h2 className="text-xl font-semibold text-text-secondary">Produits de grande consommation (FMCG)</h2>
              <p className="text-text-muted mt-2 flex-1">
                Distribution des biens de grande consommation. Ce module est en cours de développement.
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
