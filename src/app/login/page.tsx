import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUsersStore } from '../../stores/useUsersStore';
import { Shield, Wrench, Users, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { BrandMark } from '../../components/Logo';
import { usePageMeta } from '../../lib/seo';

const ROLES = [
  { title: 'Super administrateur', desc: 'Accès complet, configuration, audit et gestion des utilisateurs.', icon: Shield },
  { title: 'Administrateur', desc: 'Vue globale, rapports, budget et gestion des prestataires.', icon: Users },
  { title: 'Chef de parc', desc: 'Gestion opérationnelle : véhicules, chauffeurs, carburant et maintenance.', icon: Wrench },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  usePageMeta({ title: 'Connexion | FleetOps' });
  
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

  const inputClass = 'w-full h-11 px-3.5 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

  return (
    <div className="theme-fleetops min-h-screen flex bg-surface text-text-primary">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] max-w-[640px] bg-sidebar p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/40 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <BrandMark className="w-10 h-10 rounded-lg" />
            <div className="leading-tight">
              <div className="text-lg font-semibold">FleetOps</div>
              <div className="text-sm text-sidebar-text">Afro Négoce</div>
            </div>
          </div>
          <h1 className="mt-16 text-4xl font-bold leading-tight tracking-tight max-w-md">
            La gestion de flotte d'Afro Négoce, en un seul endroit.
          </h1>
          <p className="mt-4 text-sidebar-text text-lg max-w-md">
            Maîtrisez vos coûts, suivez vos véhicules et assurez la conformité de votre parc.
          </p>
        </div>

        <ul className="relative space-y-3">
          {ROLES.map(role => (
            <li key={role.title} className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/10">
              <span className="p-2 rounded-lg bg-white/10 text-white"><role.icon className="w-4 h-4" /></span>
              <div>
                <div className="text-sm font-semibold">{role.title}</div>
                <p className="text-sm text-sidebar-text">{role.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="relative text-xs text-sidebar-text/70">
          Conçue par l'incubateur Startup Olympus pour la Ste. Afro Négoce SARL.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col p-6 sm:p-10 overflow-y-auto">
        <Link to="/" className="inline-flex items-center gap-2 self-start text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Site Afro Négoce
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm m-auto py-10"
        >
          <BrandMark className="lg:hidden w-11 h-11 rounded-lg mb-6" />
          <h2 className="text-2xl font-bold tracking-tight">Connexion</h2>
          <p className="text-text-secondary mt-1.5">Accédez à votre espace FleetOps.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 p-3 rounded-lg border border-danger/20 bg-danger/5 text-danger text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">Adresse e-mail</label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputClass}
                placeholder="prenom.nom@afronegoce.ma"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-text-muted hover:text-text-primary rounded-md transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center shadow-sm disabled:opacity-70"
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
