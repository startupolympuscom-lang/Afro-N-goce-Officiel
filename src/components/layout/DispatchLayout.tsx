import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  LogOut,
  Menu,
  X,
  Lock,
  MapPin,
  Navigation,
  Search,
  ChevronDown,
  LayoutGrid,
  Globe,
  Radio,
} from 'lucide-react';
import { useDispatchAuthStore } from '../../stores/useDispatchAuthStore';
import { useDispatchGazStore } from '../../stores/useDispatchGazStore';
import { useRbacStore } from '../../stores/useRbacStore';
import { BrandMark } from '../Logo';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { CommandPalette } from './CommandPalette';
import { DISPATCH_ROLE_LABELS, findDispatchNavEntry, getDispatchNav, type DispatchNavSection } from './dispatchNav';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function DispatchSidebar({ sections, activePath, onNavigate, onClose }: {
  sections: DispatchNavSection[];
  activePath?: string;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <aside className="w-64 h-full bg-sidebar text-sidebar-text flex flex-col border-r border-white/5">
      <div className="h-16 shrink-0 flex items-center justify-between px-5 border-b border-white/5">
        <Link to="/dispatch/select" onClick={onNavigate} className="flex items-center gap-3">
          <BrandMark className="w-9 h-9 rounded-lg shadow-lg shadow-black/20" />
          <div className="leading-tight">
            <div className="text-white font-semibold tracking-tight">Afro Dispatch</div>
            <div className="text-xs text-sidebar-text/70">Afro Négoce</div>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="p-2 -mr-2 text-sidebar-text hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav aria-label="Navigation Afro Dispatch" className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/50">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activePath === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium transition-colors',
                        isActive ? 'bg-white/10 text-white' : 'text-sidebar-text hover:bg-white/5 hover:text-white'
                      )}
                    >
                      {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-afro-green" />}
                      <item.icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-white' : 'text-sidebar-text/70')} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 p-3 border-t border-white/5 space-y-0.5">
        <Link
          to="/dispatch/select"
          onClick={onNavigate}
          className="flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-white/5 hover:text-white transition-colors"
        >
          <LayoutGrid className="w-[18px] h-[18px] text-sidebar-text/70" />
          Changer de module
        </Link>
        <Link
          to="/"
          className="flex items-center gap-3 h-9 px-3 rounded-lg text-[13px] font-medium text-sidebar-text hover:bg-white/5 hover:text-white transition-colors"
        >
          <Globe className="w-[18px] h-[18px] text-sidebar-text/70" />
          Site Afro Négoce
        </Link>
      </div>
    </aside>
  );
}

export function DispatchLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useDispatchAuthStore();
  const { updateTruckLocation, setGpsStatus, pointages } = useDispatchGazStore();
  const gpsStatus = useDispatchGazStore(s => s.gpsStatus);
  const watchId = useRef<number | null>(null);
  const simInterval = useRef<number | null>(null);
  const [showGpsModal, setShowGpsModal] = React.useState(user?.role === 'driver');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword, newPassword }),
      });

      if (response.ok) {
        toast.success('Mot de passe modifié avec succès');
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (err) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const enableNativeGps = () => {
    if (!user) return;
    if (!("geolocation" in navigator)) {
      setGpsStatus('error', "La géolocalisation n'est pas supportée par votre navigateur.");
      toast.error("La géolocalisation n'est pas supportée.");
      return;
    }
    
    toast("Demande d'autorisation GPS...");
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        updateTruckLocation({
          driverId: user.id,
          lat: latitude,
          lng: longitude,
          speed: speed ? Math.round(speed * 3.6) : 0,
          lastUpdate: new Date().toISOString()
        });
        setGpsStatus('tracking');
        setShowGpsModal(false);
        toast.success("GPS activé avec succès !");
        
        // Setup continuous watch
        if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
        }
        
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude: lat, longitude: lng, speed: sp } = pos.coords;
            updateTruckLocation({
              driverId: user.id,
              lat,
              lng,
              speed: sp ? Math.round(sp * 3.6) : 0,
              lastUpdate: new Date().toISOString()
            });
            setGpsStatus('tracking');
          },
          (err) => {
            console.error("GPS Watch error:", err);
            setGpsStatus('error', "Erreur GPS: " + err.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      },
      (error) => {
        console.error("GPS Native Error:", error);
        setGpsStatus('error', "Erreur GPS: " + error.message);
        toast.error("Échec de l'activation du GPS : " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const enableSimulatedGps = () => {
    if (!user) return;
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    
    let angle = Math.random() * 2 * Math.PI;
    const baseLat = 33.8935;
    const baseLng = -5.5473;
    
    const updateSim = () => {
      angle += 0.05 + Math.random() * 0.03;
      // circular-ish trajectory in Meknes
      const lat = baseLat + Math.sin(angle) * 0.015;
      const lng = baseLng + Math.cos(angle) * 0.015;
      const speed = Math.floor(25 + Math.random() * 20);
      
      updateTruckLocation({
        driverId: user.id,
        lat,
        lng,
        speed,
        lastUpdate: new Date().toISOString()
      });
    };
    
    updateSim();
    
    if (simInterval.current) {
      clearInterval(simInterval.current);
    }
    simInterval.current = window.setInterval(updateSim, 8500) as any;
    
    setGpsStatus('tracking');
    setShowGpsModal(false);
    toast.success("Simulation GPS active (Suivi Meknès) !");
  };

  React.useEffect(() => {
    if (!user) {
      navigate('/dispatch/login');
      return;
    }

    const hasPointage = useDispatchGazStore.getState().hasPointageToday(user.id);

    if (user.role === 'driver') {
      if (location.pathname.includes('/dashboard')) {
        navigate('/dispatch/gaz/driver/sale');
      }
      if (hasPointage && location.pathname.includes('/driver/pointage')) {
        navigate('/dispatch/gaz/driver/sale');
      }
    }
    if (user.role === 'admin' && location.pathname.includes('/driver/')) {
      navigate('/dispatch/gaz/dashboard');
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      if (simInterval.current !== null) {
        clearInterval(simInterval.current);
      }
    };
  }, [user, location.pathname, navigate, pointages]);

  // Real-time syncing: Auto-refresh store from database immediately on changes
  React.useEffect(() => {
    if (user && user.role !== 'driver') {
      const eventSource = new EventSource('/api/zustand-stream');
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.name === 'dispatch-gaz-storage') {
            useDispatchGazStore.persist.rehydrate();
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error", error);
        // Do NOT close, let browser auto-reconnect
      };

      return () => {
        eventSource.close();
      };
    }
  }, [user]);

  const { permissions } = useRbacStore();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(open => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsUserMenuOpen(false); };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) {
    return null;
  }

  const rolePermissions = (permissions[user.role] || {}) as Record<string, { view?: boolean } | undefined>;
  const hasPointage = useDispatchGazStore.getState().hasPointageToday(user.id);
  const sections = getDispatchNav(user.role, rolePermissions, hasPointage);
  const entry = findDispatchNavEntry(location.pathname);
  const initials = `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/dispatch/login');
  };

  return (
    <div className="theme-dispatch flex h-screen bg-background text-text-primary overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <DispatchSidebar sections={sections} activePath={entry?.item.path} />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute left-0 top-0 bottom-0 max-w-[85vw]"
            >
              <DispatchSidebar
                sections={sections}
                activePath={entry?.item.path}
                onNavigate={() => setIsMobileMenuOpen(false)}
                onClose={() => setIsMobileMenuOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="relative z-30 h-16 shrink-0 bg-surface/90 backdrop-blur border-b border-border flex items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Ouvrir le menu"
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:bg-surface-2 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            {entry ? (
              <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm min-w-0">
                <span className="hidden sm:inline text-text-muted">{entry.section.title}</span>
                <span className="hidden sm:inline text-border-strong">/</span>
                <span className="font-semibold text-text-primary truncate">{entry.item.name}</span>
              </nav>
            ) : (
              <span className="font-semibold text-text-primary">Afro Dispatch</span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user.role === 'driver' && (
              <span
                className={cn(
                  'hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border',
                  gpsStatus === 'tracking' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
                )}
              >
                <Radio className="w-3.5 h-3.5" />
                {gpsStatus === 'tracking' ? 'GPS actif' : 'GPS inactif'}
              </span>
            )}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 h-9 w-56 lg:w-64 px-3 rounded-lg border border-border bg-surface-2 text-sm text-text-muted hover:border-border-strong transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left whitespace-nowrap">Rechercher…</span>
              <kbd className="whitespace-nowrap rounded border border-border bg-surface px-1.5 text-[10px] font-medium">{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>
            <button
              onClick={() => setIsPaletteOpen(true)}
              aria-label="Rechercher une page"
              className="md:hidden p-2 text-text-secondary hover:bg-surface-2 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <div ref={userMenuRef} className="relative pl-2 sm:pl-3 border-l border-border">
              <button
                onClick={() => setIsUserMenuOpen(open => !open)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                className="flex items-center gap-3 rounded-lg p-1 pr-2 hover:bg-surface-2 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs">
                  {initials}
                </span>
                <span className="hidden md:block text-left leading-tight">
                  <span className="block text-sm font-medium text-text-primary">{user.prenom} {user.nom}</span>
                  <span className="block text-xs text-text-muted">{DISPATCH_ROLE_LABELS[user.role] ?? user.role}</span>
                </span>
                <ChevronDown className="hidden md:block w-4 h-4 text-text-muted" />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50"
                  >
                    <div className="px-3 py-2.5 border-b border-border mb-1.5">
                      <div className="text-sm font-semibold text-text-primary truncate">{user.prenom} {user.nom}</div>
                      <div className="text-xs text-text-muted truncate">{user.email}</div>
                    </div>
                    <button
                      onClick={() => { setIsUserMenuOpen(false); setIsPasswordModalOpen(true); }}
                      role="menuitem"
                      className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-text-primary hover:bg-surface-2 transition-colors"
                    >
                      <Lock className="w-4 h-4 text-text-muted" />
                      Modifier le mot de passe
                    </button>
                    <Link
                      to="/dispatch/select"
                      role="menuitem"
                      className="flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-text-primary hover:bg-surface-2 transition-colors"
                    >
                      <LayoutGrid className="w-4 h-4 text-text-muted" />
                      Changer de module
                    </Link>
                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="w-full flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content (isolated so map layers cannot paint over the header menus) */}
        <main className="relative isolate flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">
            {user.role === 'driver' && gpsStatus !== 'tracking' && (
              <div className="mb-6 bg-surface border border-warning/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <span className="p-2 bg-warning/10 rounded-lg text-warning shrink-0">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-semibold text-text-primary text-sm">Géolocalisation inactive</h4>
                    <p className="text-text-secondary text-sm mt-0.5">Le dispatch ne peut pas suivre votre position en temps réel.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={enableNativeGps}
                    className="flex-1 sm:flex-none h-9 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4" /> Activer le GPS
                  </button>
                  <button
                    onClick={enableSimulatedGps}
                    className="flex-1 sm:flex-none h-9 px-4 bg-surface border border-border hover:bg-surface-2 text-text-primary rounded-lg text-sm font-medium transition-colors"
                  >
                    <span className="sm:hidden">Mode démo</span>
                    <span className="hidden sm:inline">Mode démonstration</span>
                  </button>
                </div>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isPaletteOpen && (
          <CommandPalette sections={sections} themeClassName="theme-dispatch" onClose={() => setIsPaletteOpen(false)} />
        )}
      </AnimatePresence>

      {/* Password change */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsPasswordModalOpen(false)} />
          <div className="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-md relative">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Modifier le mot de passe
              </h2>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                aria-label="Fermer"
                className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              <div>
                <label htmlFor="dispatch-current-password" className="block text-sm font-medium text-text-primary mb-1.5">Mot de passe actuel</label>
                <input
                  id="dispatch-current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full h-11 px-3.5 border border-border rounded-lg bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div>
                <label htmlFor="dispatch-new-password" className="block text-sm font-medium text-text-primary mb-1.5">Nouveau mot de passe</label>
                <input
                  id="dispatch-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full h-11 px-3.5 border border-border rounded-lg bg-surface text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="h-10 px-4 text-text-primary text-sm font-medium border border-border hover:bg-surface-2 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Modification…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS activation prompt for drivers */}
      {user.role === 'driver' && showGpsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowGpsModal(false)} />
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden border border-border">
            <div className="bg-sidebar p-6 sm:p-8 text-white relative">
              <button
                onClick={() => setShowGpsModal(false)}
                aria-label="Fermer"
                className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/10">
                <MapPin className="w-6 h-6" />
              </span>
              <h2 className="text-xl font-semibold tracking-tight">Activer la géolocalisation</h2>
              <p className="text-sidebar-text text-sm mt-2">Votre position permet au dispatch de suivre les livraisons en temps réel et d'optimiser les tournées.</p>
            </div>

            <div className="p-6 sm:p-8 space-y-3">
              <button
                type="button"
                onClick={enableNativeGps}
                className="w-full p-4 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors flex items-center justify-between text-left group"
              >
                <div>
                  <div className="text-sm font-semibold">Partager ma position GPS</div>
                  <div className="text-xs text-white/75 mt-0.5">Votre navigateur vous demandera l'autorisation</div>
                </div>
                <Navigation className="w-5 h-5 opacity-80 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={enableSimulatedGps}
                className="w-full p-4 bg-surface hover:bg-surface-2 text-text-primary rounded-xl transition-colors flex items-center justify-between text-left border border-border"
              >
                <div>
                  <div className="text-sm font-semibold">Mode démonstration</div>
                  <div className="text-xs text-text-muted mt-0.5">Simule un trajet à Meknès si le GPS n'est pas disponible</div>
                </div>
                <span className="text-xs bg-surface-2 text-text-secondary px-2 py-1 rounded-md font-medium shrink-0 border border-border">Meknès</span>
              </button>

              <div className="pt-3 flex justify-between items-center gap-4 text-xs text-text-muted">
                <span>Nécessaire pour apparaître en direct sur le suivi.</span>
                <button
                  onClick={() => setShowGpsModal(false)}
                  className="font-medium text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
