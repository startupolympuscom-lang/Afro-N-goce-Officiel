import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../stores/useAuthStore';
import { Role } from '../../types';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  ShieldCheck, 
  Fuel, 
  Wrench, 
  MapPin, 
  CircleDot, 
  AlertTriangle, 
  Store, 
  PieChart, 
  FileText, 
  History, 
  Settings,
  LogOut,
  Droplet,
  Wallet,
  CreditCard,
  Globe,
  TrendingUp,
  X,
  ChevronRight,
  User
} from 'lucide-react';
import { AfroNegoceLogo } from '../Logo';
import { motion, AnimatePresence } from 'motion/react';

type NavItem = {
  name: string;
  path?: string;
  icon: any;
  roles: Role[];
  children?: { name: string; path: string; icon: any; roles: Role[] }[];
};

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'chef_de_parc'] },
  { name: 'Véhicules', path: '/vehicules', icon: Truck, roles: ['super_admin', 'admin', 'chef_de_parc'] },
  { name: 'Chauffeurs', path: '/chauffeurs', icon: Users, roles: ['super_admin', 'admin', 'chef_de_parc'] },
  { name: 'Conformité', path: '/conformite', icon: ShieldCheck, roles: ['super_admin', 'admin', 'chef_de_parc'] },
  { 
    name: 'Flotte', 
    icon: Truck,
    roles: ['super_admin', 'admin', 'chef_de_parc'],
    children: [
      { name: 'Carburant', path: '/flotte/carburant', icon: Fuel, roles: ['super_admin', 'admin', 'chef_de_parc'] },
      { name: 'Leasing', path: '/flotte/leasing', icon: CreditCard, roles: ['super_admin', 'admin', 'chef_de_parc'] },
      { name: 'Vidange', path: '/flotte/vidange', icon: Droplet, roles: ['super_admin', 'admin', 'chef_de_parc'] },
      { name: 'Charges Variables', path: '/flotte/charges-variables', icon: Wallet, roles: ['super_admin', 'admin', 'chef_de_parc'] },
      { name: 'Missions', path: '/flotte/missions', icon: MapPin, roles: ['super_admin', 'admin', 'chef_de_parc'] },
      { name: 'Maintenance', path: '/flotte/maintenance', icon: Wrench, roles: ['super_admin', 'admin', 'chef_de_parc'] },
      { name: 'Pneus', path: '/flotte/pneus', icon: CircleDot, roles: ['super_admin', 'admin', 'chef_de_parc'] },
      { name: 'Infractions', path: '/flotte/infractions', icon: AlertTriangle, roles: ['super_admin', 'admin', 'chef_de_parc'] },
    ]
  },
  { name: 'Prestataires', path: '/prestataires', icon: Store, roles: ['super_admin', 'admin'] },
  { name: 'Finance', path: '/finance', icon: TrendingUp, roles: ['super_admin', 'admin'] },
  { name: 'Budget', path: '/budget', icon: PieChart, roles: ['super_admin', 'admin'] },
  { name: 'Rapports', path: '/rapports', icon: FileText, roles: ['super_admin', 'admin'] },
  { name: 'Audit', path: '/audit', icon: History, roles: ['super_admin'] },
  { name: 'Paramètres', path: '/parametres', icon: Settings, roles: ['super_admin', 'admin'] },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Flotte']);

  if (!user) return null;

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    );
  };

  const filteredNavItems = navItems
    .filter(item => item.roles.includes(user.role))
    .map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => child.roles.includes(user.role))
        };
      }
      return item;
    });

  const SidebarContent = (
    <aside className="w-72 h-full bg-[#0B1120] text-sidebar-text flex flex-col border-r border-white/5 font-sans relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 z-10">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10">
            <AfroNegoceLogo className="w-6 h-6 text-primary shadow-sm" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg tracking-tight">
              FLEETOPS
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sidebar-text/50">Management</span>
          </div>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-2 -mr-2 text-sidebar-text hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Section */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 z-10 custom-scrollbar">
        {/* Global Action */}
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white group"
        >
          <Globe className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
          Portail Client
        </Link>

        {/* Menu Items */}
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const isParentActive = item.children?.some(c => location.pathname.startsWith(c.path));
            const isItemActive = item.path && location.pathname.startsWith(item.path);
            const isExpanded = expandedItems.includes(item.name);

            return (
              <div key={item.name} className="space-y-1">
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all group",
                        isParentActive ? "text-white font-bold" : "hover:bg-white/5 text-sidebar-text hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isParentActive ? "text-primary" : "text-sidebar-text opacity-70 group-hover:opacity-100")} />
                        <span className="tracking-tight">{item.name}</span>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-90", !isParentActive && "opacity-50")} />
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden space-y-1 pl-11"
                        >
                          {item.children.map(child => {
                            const isActive = location.pathname.startsWith(child.path);
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all relative group",
                                  isActive 
                                    ? "text-primary-light font-black" 
                                    : "text-sidebar-text hover:text-white"
                                )}
                              >
                                {isActive && (
                                  <motion.div 
                                    layoutId="nav-pill"
                                    className="absolute left-0 w-1 h-3 bg-primary rounded-full"
                                  />
                                )}
                                <span className={cn("transition-transform group-hover:translate-x-1", isActive ? "translate-x-1" : "")}>
                                  {child.name}
                                </span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to={item.path!}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all group relative",
                      isItemActive 
                        ? "bg-primary text-white font-black shadow-lg shadow-primary/20" 
                        : "hover:bg-white/5 text-sidebar-text hover:text-white"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isItemActive ? "text-white" : "text-sidebar-text opacity-70 group-hover:opacity-100")} />
                    <span className="tracking-tight">{item.name}</span>
                    {isItemActive && (
                      <motion.div 
                        layoutId="nav-bg"
                        className="absolute inset-0 bg-primary rounded-xl -z-10"
                      />
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-white/5 z-10 bg-[#0B1120]/80 backdrop-blur-md">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mb-4 group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-black border border-white/10 group-hover:scale-105 transition-transform">
              {user.prenom?.[0] || user.nom?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-white truncate leading-tight">
                {user.prenom} {user.nom}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-sidebar-text/50 truncate">
                {user.role}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold text-error bg-error/10 hover:bg-error/20 transition-all border border-error/10 hover:border-error/20 group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Déconnexion
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-[300px] max-w-[90vw]"
            >
              {SidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

