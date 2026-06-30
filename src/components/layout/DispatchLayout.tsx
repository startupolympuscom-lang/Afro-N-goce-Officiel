import React, { useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Flame, 
  Building2, 
  Wallet, 
  Map, 
  LogOut,
  Menu,
  X,
  Package,
  FileText,
  Settings,
  QrCode,
  ShoppingCart,
  Shield,
  Lock,
  MapPin,
  Navigation,
  Phone
} from 'lucide-react';
import { useDispatchAuthStore } from '../../stores/useDispatchAuthStore';
import { useDispatchGazStore } from '../../stores/useDispatchGazStore';
import { useRbacStore } from '../../stores/useRbacStore';
import { AfroNegoceLogo } from '../Logo';
import { toast } from 'sonner';

export function DispatchLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
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

  if (!user) {
    return null;
  }

  const rolePermissions = (permissions[user.role] || {}) as any;
  const hasPointage = useDispatchGazStore.getState().hasPointageToday(user.id);

  const allNavItems = [
    { name: 'Dashboard', href: '/dispatch/gaz/dashboard', icon: LayoutDashboard, pageId: 'dashboard' },
    { name: 'Live Dispatch', href: '/dispatch/gaz/live', icon: Map, pageId: 'live' },
    { name: 'Stock Chauffeurs', href: '/dispatch/gaz/stock', icon: Package, pageId: 'stock' },
    { name: 'Vente Manuelle', href: '/dispatch/gaz/stock/manual-sale', icon: Flame, pageId: 'manual_sale' },
    { name: 'Driver/Sales Agent', href: '/dispatch/gaz/drivers', icon: Users, pageId: 'drivers' },
    { name: 'Ressources Humaines', href: '/dispatch/gaz/hr', icon: FileText, pageId: 'hr' },
    { name: 'GPL Settings', href: '/dispatch/gaz/settings', icon: Flame, pageId: 'settings' },
    { name: 'Clients', href: '/dispatch/gaz/clients', icon: Building2, pageId: 'clients' },
    { name: 'Facturation', href: '/dispatch/gaz/facturation', icon: FileText, pageId: 'facturation' },
    { name: 'Caisse', href: '/dispatch/gaz/caisse', icon: Wallet, pageId: 'caisse' },
    { name: 'Commande Gaz', href: '/dispatch/gaz/commande', icon: ShoppingCart, pageId: 'commande' },
    { name: 'Standard (Appels)', href: '/dispatch/gaz/standard', icon: Phone, pageId: 'standard' },
    { name: 'Comptabilité Corr.', href: '/dispatch/gaz/compta', icon: FileText, pageId: 'compta' },
    { name: 'Contrôle d\'Accès (RBAC)', href: '/dispatch/gaz/rbac', icon: Shield, pageId: 'rbac' },
    { name: 'Team / Tâches', href: '/dispatch/gaz/team', icon: Users, pageId: 'team' },
    { name: 'Vente Comptoir', href: '/dispatch/gaz/comptoir/sale', icon: Flame, pageId: 'comptoir_sale' },
    { name: 'Pointage', href: '/dispatch/gaz/driver/pointage', icon: QrCode, pageId: 'driver_pointage' },
    { name: 'Nouvelle Vente', href: '/dispatch/gaz/driver/sale', icon: Flame, pageId: 'driver_sale' },
    { name: 'Mes Ventes', href: '/dispatch/gaz/driver/history', icon: Wallet, pageId: 'driver_history' },
  ];

  const adminNavItems = allNavItems;

  const comptaNavItems = allNavItems.filter(i => ['compta', 'caisse', 'commande', 'stock', 'hr', 'dashboard', 'facturation'].includes(i.pageId));
  const stockNavItems = allNavItems.filter(i => ['stock', 'manual_sale', 'commande'].includes(i.pageId));
  const comptoirNavItems = allNavItems.filter(i => ['comptoir_sale', 'driver_history'].includes(i.pageId));
  
  // Conditionally include pointage if not checked in yet
  const driverNavPages = hasPointage 
    ? ['driver_sale', 'driver_history'] 
    : ['driver_pointage', 'driver_sale', 'driver_history'];
  const driverNavItems = allNavItems.filter(i => driverNavPages.includes(i.pageId));
  const caissierNavItems = allNavItems.filter(i => ['caisse'].includes(i.pageId));

  let baseNavItems = user.role === 'admin' 
    ? adminNavItems 
    : user.role === 'comptable' 
      ? comptaNavItems 
      : user.role === 'stock_superviseur'
        ? stockNavItems
        : user.role === 'vendeur_comptoir'
          ? comptoirNavItems
          : user.role === 'caissier'
            ? caissierNavItems
            : driverNavItems;

  // Now filter the baseNavItems using RBAC rules
  const navItems = baseNavItems.filter(item => {
    // If admin or driver, always show all baseNavItems
    if (user.role === 'admin' || user.role === 'driver') return true;
    
    // Otherwise check view permission
    const pagePerm = rolePermissions[item.pageId as keyof typeof rolePermissions];
    return pagePerm?.view === true;
  });

  const handleLogout = () => {
    logout();
    navigate('/dispatch/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Desktop */}
      <aside className="w-72 bg-[#090E17] text-slate-300 flex-col hidden lg:flex border-r border-slate-800/50 shadow-2xl z-20">
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50 bg-[#090E17]/80 backdrop-blur-md">
          <Link to="/dispatch/select" className="flex items-center gap-3 text-white font-bold text-xl tracking-tight group">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <AfroNegoceLogo className="w-6 h-6 text-white" />
            </div>
            <span>Afro Dispatch</span>
          </Link>
        </div>

        <div className="p-5 border-b border-slate-800/50 bg-gradient-to-b from-[#090E17] to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 border border-white/10">
              {user.prenom.charAt(0)}{user.nom.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.prenom} {user.nom}</p>
              <p className="text-xs font-medium text-blue-400 capitalize truncate mt-0.5">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-5 px-4 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600/15 to-blue-600/5 text-blue-400 border border-blue-500/20 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500 opacity-80'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50 bg-[#090E17]/90 space-y-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-3 px-3.5 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all border border-transparent"
          >
            <Lock className="w-5 h-5 opacity-80" />
            Mot de passe
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-5 h-5 opacity-80 text-red-400" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:hidden sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 group">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
              <AfroNegoceLogo className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Afro Dispatch</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#090E17] text-slate-300 shadow-2xl animate-in slide-in-from-left-full duration-300">
              <div className="absolute top-0 right-0 -mr-12 pt-4">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="h-20 flex items-center px-6 border-b border-slate-800/50 bg-[#090E17]/80 backdrop-blur-md">
                <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                    <AfroNegoceLogo className="w-6 h-6 text-white" />
                  </div>
                  <span>Afro Dispatch</span>
                </div>
              </div>
              
              <div className="p-5 border-b border-slate-800/50 bg-gradient-to-b from-[#090E17] to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 border border-white/10">
                    {user.prenom.charAt(0)}{user.nom.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user.prenom} {user.nom}</p>
                    <p className="text-xs font-medium text-blue-400 capitalize truncate mt-0.5">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gradient-to-r from-blue-600/15 to-blue-600/5 text-blue-400 border border-blue-500/20 shadow-sm' 
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500 opacity-80'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800/50 bg-[#090E17]/90 space-y-2">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex items-center gap-3 px-3.5 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 transition-all border border-transparent"
                >
                  <Lock className="w-5 h-5 opacity-80" />
                  Mot de passe
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3.5 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                >
                  <LogOut className="w-5 h-5 opacity-80 text-red-400" />
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-10">
          {user?.role === 'driver' && gpsStatus !== 'tracking' && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600 shrink-0">
                  <MapPin className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">Géolocalisation Inactive</h4>
                  <p className="text-amber-700 text-xs font-medium mt-0.5">Le répartiteur admin ne peut pas vous voir en direct sur la carte.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button 
                  onClick={enableNativeGps}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" /> Activer GPS
                </button>
                <button 
                  onClick={enableSimulatedGps}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  Simuler trajet (Mode démo)
                </button>
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPasswordModalOpen(false)} />
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                Modifier le mot de passe
              </h2>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Modification...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GPS Activation modal for drivers */}
      {user?.role === 'driver' && showGpsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md" onClick={() => setShowGpsModal(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-8 text-white relative">
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setShowGpsModal(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="w-14 h-14 bg-blue-500/15 rounded-2xl flex items-center justify-center mb-4 text-blue-400 border border-blue-400/20">
                <MapPin className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">📍 Activer votre Géolocalisation</h2>
              <p className="text-slate-300 text-sm mt-2 font-medium">Pour assurer le suivi des livraisons en temps réel et optimiser les trajets sur le Live Dispatch.</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={enableNativeGps}
                  className="w-full p-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 flex items-center justify-between text-left group"
                >
                  <div>
                    <div className="text-base font-bold">📡 Partager ma position GPS</div>
                    <div className="text-xs text-blue-100 font-normal mt-0.5">Demande l'autorisation du navigateur</div>
                  </div>
                  <Navigation className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={enableSimulatedGps}
                  className="w-full p-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl transition-all flex items-center justify-between text-left group border border-slate-200"
                >
                  <div>
                    <div className="text-base text-slate-900 font-bold">🔄 Activer la simulation (Iframe / Démo)</div>
                    <div className="text-xs text-slate-500 font-normal mt-0.5">Pour contourner les blocages ou sandboxing d'iframes</div>
                  </div>
                  <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-semibold shrink-0">Meknès, MAR</span>
                </button>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                <span>* Requis pour s'afficher en direct en tant que livreur</span>
                <button
                  onClick={() => setShowGpsModal(false)}
                  className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Remettre à plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
