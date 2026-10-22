import {
  LayoutDashboard,
  Truck,
  Users,
  ShieldCheck,
  Fuel,
  CreditCard,
  Droplet,
  Store,
  Wallet,
  MapPin,
  Wrench,
  CircleDot,
  AlertTriangle,
  Handshake,
  TrendingUp,
  PieChart,
  FileText,
  History,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { Role } from '../../types';

export interface FleetNavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

export interface FleetNavSection {
  title: string;
  items: FleetNavItem[];
}

const ALL: Role[] = ['super_admin', 'admin', 'chef_de_parc'];
const ADMINS: Role[] = ['super_admin', 'admin'];

export const FLEET_NAV: FleetNavSection[] = [
  {
    title: 'Pilotage',
    items: [{ name: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard, roles: ALL }],
  },
  {
    title: 'Parc',
    items: [
      { name: 'Véhicules', path: '/vehicules', icon: Truck, roles: ALL },
      { name: 'Chauffeurs', path: '/chauffeurs', icon: Users, roles: ALL },
      { name: 'Conformité', path: '/conformite', icon: ShieldCheck, roles: ALL },
    ],
  },
  {
    title: 'Flotte',
    items: [
      { name: 'Carburant', path: '/flotte/carburant', icon: Fuel, roles: ALL },
      { name: 'Missions', path: '/flotte/missions', icon: MapPin, roles: ALL },
      { name: 'Maintenance', path: '/flotte/maintenance', icon: Wrench, roles: ALL },
      { name: 'Vidange', path: '/flotte/vidange', icon: Droplet, roles: ALL },
      { name: 'Pneus', path: '/flotte/pneus', icon: CircleDot, roles: ALL },
      { name: 'Infractions', path: '/flotte/infractions', icon: AlertTriangle, roles: ALL },
      { name: 'Magasin & Stock', path: '/flotte/magasin', icon: Store, roles: ALL },
      { name: 'Leasing', path: '/flotte/leasing', icon: CreditCard, roles: ALL },
      { name: 'Charges variables', path: '/flotte/charges-variables', icon: Wallet, roles: ALL },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { name: 'Prestataires', path: '/prestataires', icon: Handshake, roles: ADMINS },
      { name: 'Finance', path: '/finance', icon: TrendingUp, roles: ADMINS },
      { name: 'Budget', path: '/budget', icon: PieChart, roles: ADMINS },
      { name: 'Rapports', path: '/rapports', icon: FileText, roles: ADMINS },
    ],
  },
  {
    title: 'Administration',
    items: [
      { name: 'Audit', path: '/audit', icon: History, roles: ['super_admin'] },
      { name: 'Paramètres', path: '/parametres', icon: Settings, roles: ADMINS },
    ],
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super administrateur',
  admin: 'Administrateur',
  chef_de_parc: 'Chef de parc',
  vendeur_comptoir: 'Vendeur comptoir',
  stock_superviseur: 'Superviseur stock',
};

export const getNavForRole = (role: Role): FleetNavSection[] =>
  FLEET_NAV
    .map((section) => ({ ...section, items: section.items.filter((item) => item.roles.includes(role)) }))
    .filter((section) => section.items.length > 0);

export const findNavEntry = (pathname: string) => {
  for (const section of FLEET_NAV) {
    const item = section.items.find((i) => pathname === i.path || pathname.startsWith(`${i.path}/`));
    if (item) return { section, item };
  }
  return undefined;
};
