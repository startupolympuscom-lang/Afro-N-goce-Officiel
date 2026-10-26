import {
  LayoutDashboard,
  BarChart3,
  Radar,
  PhoneCall,
  Store,
  PenLine,
  Building2,
  Receipt,
  Boxes,
  ShoppingCart,
  Truck,
  Wallet,
  Calculator,
  UserCog,
  ListChecks,
  SlidersHorizontal,
  ShieldCheck,
  QrCode,
  Flame,
  History,
  type LucideIcon,
} from 'lucide-react';
import { DispatchRole } from '../../stores/useDispatchAuthStore';

export interface DispatchNavItem {
  pageId: string;
  name: string;
  path: string;
  icon: LucideIcon;
}

export interface DispatchNavSection {
  title: string;
  items: DispatchNavItem[];
}

export const DISPATCH_NAV: DispatchNavSection[] = [
  {
    title: 'Pilotage',
    items: [
      { pageId: 'dashboard', name: 'Tableau de bord', path: '/dispatch/gaz/dashboard', icon: LayoutDashboard },
      { pageId: 'rapports', name: 'Rapports', path: '/dispatch/gaz/rapports', icon: BarChart3 },
      { pageId: 'live', name: 'Suivi en direct', path: '/dispatch/gaz/live', icon: Radar },
    ],
  },
  {
    title: 'Ventes',
    items: [
      { pageId: 'standard', name: 'Standard téléphonique', path: '/dispatch/gaz/standard', icon: PhoneCall },
      { pageId: 'comptoir_sale', name: 'Vente comptoir', path: '/dispatch/gaz/comptoir/sale', icon: Store },
      { pageId: 'manual_sale', name: 'Vente manuelle', path: '/dispatch/gaz/stock/manual-sale', icon: PenLine },
      { pageId: 'clients', name: 'Clients', path: '/dispatch/gaz/clients', icon: Building2 },
      { pageId: 'facturation', name: 'Facturation', path: '/dispatch/gaz/facturation', icon: Receipt },
    ],
  },
  {
    title: 'Stock & flotte',
    items: [
      { pageId: 'stock', name: 'Stocks GPL', path: '/dispatch/gaz/stock', icon: Boxes },
      { pageId: 'commande', name: 'Commandes gaz', path: '/dispatch/gaz/commande', icon: ShoppingCart },
      { pageId: 'drivers', name: 'Chauffeurs-vendeurs', path: '/dispatch/gaz/drivers', icon: Truck },
    ],
  },
  {
    title: 'Finance',
    items: [
      { pageId: 'caisse', name: 'Caisse', path: '/dispatch/gaz/caisse', icon: Wallet },
      { pageId: 'compta', name: 'Comptabilité', path: '/dispatch/gaz/compta', icon: Calculator },
    ],
  },
  {
    title: 'Équipe',
    items: [
      { pageId: 'hr', name: 'Ressources humaines', path: '/dispatch/gaz/hr', icon: UserCog },
      { pageId: 'team', name: 'Équipe & tâches', path: '/dispatch/gaz/team', icon: ListChecks },
    ],
  },
  {
    title: 'Administration',
    items: [
      { pageId: 'settings', name: 'Paramètres GPL', path: '/dispatch/gaz/settings', icon: SlidersHorizontal },
      { pageId: 'rbac', name: "Contrôle d'accès", path: '/dispatch/gaz/rbac', icon: ShieldCheck },
    ],
  },
  {
    title: 'Mon activité',
    items: [
      { pageId: 'driver_pointage', name: 'Pointage', path: '/dispatch/gaz/driver/pointage', icon: QrCode },
      { pageId: 'driver_sale', name: 'Nouvelle vente', path: '/dispatch/gaz/driver/sale', icon: Flame },
      { pageId: 'driver_history', name: 'Mes ventes', path: '/dispatch/gaz/driver/history', icon: History },
    ],
  },
];

export const DISPATCH_ROLE_LABELS: Record<DispatchRole, string> = {
  admin: 'Administrateur',
  driver: 'Chauffeur-vendeur',
  vendeur_comptoir: 'Vendeur comptoir',
  comptable: 'Comptable',
  stock_superviseur: 'Superviseur stock',
  caissier: 'Caissier',
};

// Pages each role can reach before access-control (RBAC) rules apply.
const ROLE_PAGES: Record<Exclude<DispatchRole, 'admin' | 'driver'>, string[]> = {
  comptable: ['compta', 'caisse', 'commande', 'stock', 'hr', 'dashboard', 'facturation', 'rapports'],
  stock_superviseur: ['stock', 'manual_sale', 'commande'],
  vendeur_comptoir: ['comptoir_sale', 'driver_history'],
  caissier: ['caisse'],
};

const DRIVER_PAGES = ['driver_pointage', 'driver_sale', 'driver_history'];

export function getDispatchNav(
  role: DispatchRole,
  rolePermissions: Record<string, { view?: boolean } | undefined>,
  hasPointageToday: boolean,
): DispatchNavSection[] {
  const isAllowed = (pageId: string) => {
    // Admins are redirected away from the driver screens, so those links are not offered to them.
    if (role === 'admin') return !DRIVER_PAGES.includes(pageId);
    if (role === 'driver') return DRIVER_PAGES.includes(pageId) && !(pageId === 'driver_pointage' && hasPointageToday);
    return ROLE_PAGES[role].includes(pageId) && rolePermissions[pageId]?.view === true;
  };
  return DISPATCH_NAV
    .map((section) => ({ ...section, items: section.items.filter((item) => isAllowed(item.pageId)) }))
    .filter((section) => section.items.length > 0);
}

// Longest matching path, so sub-pages (e.g. /hr/pointage, /stock/manual-sale) resolve to the right entry.
export function findDispatchNavEntry(pathname: string) {
  let best: { section: DispatchNavSection; item: DispatchNavItem } | undefined;
  for (const section of DISPATCH_NAV) {
    for (const item of section.items) {
      if ((pathname === item.path || pathname.startsWith(`${item.path}/`)) && (!best || item.path.length > best.item.path.length)) {
        best = { section, item };
      }
    }
  }
  return best;
}
