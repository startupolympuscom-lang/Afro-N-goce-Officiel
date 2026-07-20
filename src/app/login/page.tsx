import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUsersStore } from '../../stores/useUsersStore';
import { Truck, Shield, Wrench, Users } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore(s => s.login);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { users, addUser } = useUsersStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const user = await response.json();
        login(user);
        navigate('/dashboard');
      } else {
        const data = await response.json();
        setError(data.error || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0B1120] p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_#2563EB_0%,_transparent_50%)]"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold mb-6">
            <Truck className="w-8 h-8 text-primary" />
            <span>FleetOps</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Gestion de la flotte de la Ste. Afro Négoce
          </h1>
          <p className="text-sidebar-text text-lg max-w-md">
            Optimisez vos coûts, suivez vos véhicules en temps réel et assurez la conformité de votre parc automobile.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="bg-sidebar-2/50 backdrop-blur-sm p-4 rounded-xl border border-sidebar-2 flex gap-4 items-start">
            <div className="p-2 bg-primary/20 text-primary rounded-lg"><Shield className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold">Super Admin</h3>
              <p className="text-sm text-sidebar-text">Accès complet, configuration, audit et gestion des utilisateurs.</p>
            </div>
          </div>
          <div className="bg-sidebar-2/50 backdrop-blur-sm p-4 rounded-xl border border-sidebar-2 flex gap-4 items-start">
            <div className="p-2 bg-success/20 text-success rounded-lg"><Users className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold">Admin</h3>
              <p className="text-sm text-sidebar-text">Vue globale, rapports, budget et gestion des prestataires.</p>
            </div>
          </div>
          <div className="bg-sidebar-2/50 backdrop-blur-sm p-4 rounded-xl border border-sidebar-2 flex gap-4 items-start">
            <div className="p-2 bg-warning/20 text-warning rounded-lg"><Wrench className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold">Chef de Parc</h3>
              <p className="text-sm text-sidebar-text">Gestion opérationnelle: véhicules, chauffeurs, carburant et maintenance.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 text-sm text-sidebar-text/60">
          Conçue par l'incubateur Startup Olympus pour la Ste. Afro Négoce SARL.
        </div>
      </div>

      {/* Right Panel - Login/Signup */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 my-auto"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-text-primary">
              Bienvenue
            </h2>
            <p className="text-text-secondary mt-2">
              Connectez-vous à votre espace FleetOps
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-danger/10 text-danger rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="admin@fleetops.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border bg-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
