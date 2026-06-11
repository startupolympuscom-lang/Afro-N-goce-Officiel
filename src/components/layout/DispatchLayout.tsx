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
  Lock
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
  const { updateTruckLocation, setGpsStatus } = useDispatchGazStore();
  const watchId = useRef<number | null>(null);

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

  React.useEffect(() => {
    if (!user) {
      navigate('/dispatch/login');
      return;
    }

    // GPS Tracking for drivers
    if (user.role === 'driver') {
      if (!("geolocation" in navigator)) {
        setGpsStatus('error', "La géolocalisation n'est pas supportée.");
      } else {
        setGpsStatus('tracking');
        watchId.current = navigator.geolocation.watchPosition(
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
          },
          (error) => {
            console.error("GPS Error:", error);
            setGpsStatus('error', "Erreur GPS: " + error.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    }

    if (user.role === 'driver' && location.pathname.includes('/dashboard')) {
      navigate('/dispatch/gaz/driver/sale');
    }
    if (user.role === 'admin' && location.pathname.includes('/driver/')) {
      navigate('/dispatch/gaz/dashboard');
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [user, location.pathname, navigate, updateTruckLocation, setGpsStatus]);

  const { permissions } = useRbacStore();

  if (!user) {
    return null;
  }

  const rolePermissions = (permissions[user.role] || {}) as any;

  const allNavItems = [
    { name: 'Dashboard', href: '/dispatch/gaz/dashboard', icon: LayoutDashboard, pageId: 'dashboard' },
    { name: 'Live Dispatch', href: '/dispatch/gaz/live', icon: Map, pageId: 'live' },
    { name: 'Stock Chauffeurs', href: '/dispatch/gaz/stock', icon: Package, pageId: 'stock' },
    { name: 'Vente Manuelle', href: '/dispatch/gaz/stock/manual-sale', icon: Flame, pageId: 'manual_sale' },
    { name: 'Driver/Sales Agent', href: '/dispatch/gaz/drivers', icon: Users, pageId: 'drivers' },
    { name: 'Ressources Humaines', href: '/dispatch/gaz/hr', icon: FileText, pageId: 'hr' },
    { name: 'GPL Settings', href: '/dispatch/gaz/settings', icon: Flame, pageId: 'settings' },
    { name: 'Clients', href: '/dispatch/gaz/clients', icon: Building2, pageId: 'clients' },
    { name: 'Caisse', href: '/dispatch/gaz/caisse', icon: Wallet, pageId: 'caisse' },
    { name: 'Commande Gaz', href: '/dispatch/gaz/commande', icon: ShoppingCart, pageId: 'commande' },
    { name: 'Comptabilité Corr.', href: '/dispatch/gaz/compta', icon: FileText, pageId: 'compta' },
    { name: 'Contrôle d\'Accès (RBAC)', href: '/dispatch/gaz/rbac', icon: Shield, pageId: 'rbac' },
    { name: 'Vente Comptoir', href: '/dispatch/gaz/comptoir/sale', icon: Flame, pageId: 'comptoir_sale' },
    { name: 'الحضور اليومي', href: '/dispatch/gaz/driver/pointage', icon: QrCode, pageId: 'driver_pointage' },
    { name: 'بيع جديد', href: '/dispatch/gaz/driver/sale', icon: Flame, pageId: 'driver_sale' },
    { name: 'مبيعاتي', href: '/dispatch/gaz/driver/history', icon: Wallet, pageId: 'driver_history' },
  ];

  const adminNavItems = allNavItems;

  const comptaNavItems = allNavItems.filter(i => ['compta', 'caisse', 'commande', 'stock', 'hr', 'dashboard'].includes(i.pageId));
  const stockNavItems = allNavItems.filter(i => ['stock', 'manual_sale', 'commande'].includes(i.pageId));
  const comptoirNavItems = allNavItems.filter(i => ['comptoir_sale', 'driver_history'].includes(i.pageId));
  const driverNavItems = allNavItems.filter(i => ['driver_pointage', 'driver_sale', 'driver_history'].includes(i.pageId));
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
    // If admin, always show all baseNavItems
    if (user.role === 'admin') return true;
    
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
      <aside className="w-64 bg-[#0B1120] text-slate-300 flex-col hidden md:flex border-r border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/dispatch/select" className="flex items-center gap-3 text-white font-bold text-xl">
            <AfroNegoceLogo className="w-8 h-8" />
            <span>Afro Dispatch</span>
          </Link>
        </div>

        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              {user.prenom.charAt(0)}{user.nom.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.prenom} {user.nom}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-500' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Lock className="w-5 h-5" />
            Mot de passe
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-red-500/20 hover:text-red-400"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:hidden">
          <div className="flex items-center gap-2">
            <AfroNegoceLogo className="w-8 h-8" />
            <span className="font-bold text-slate-900">Afro Dispatch</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0B1120] text-slate-300">
              <div className="absolute top-0 right-0 -mr-12 pt-4">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="h-16 flex items-center px-6 border-b border-slate-800">
                <span className="text-white font-bold text-xl">Afro Dispatch</span>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-600/10 text-blue-500' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
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
    </div>
  );
}
