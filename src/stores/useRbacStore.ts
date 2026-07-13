import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';
import { DispatchRole } from './useDispatchAuthStore';

export type DispatchPage = 
  | 'dashboard' 
  | 'live' 
  | 'stock' 
  | 'manual_sale' 
  | 'drivers' 
  | 'hr' 
  | 'settings' 
  | 'clients' 
  | 'caisse' 
  | 'commande' 
  | 'compta' 
  | 'rbac' 
  | 'comptoir_sale' 
  | 'driver_pointage' 
  | 'driver_sale' 
  | 'facturation'
  | 'standard'
  | 'team'
  | 'rapports'
  | 'driver_history';

export interface RolePermissions {
  view: boolean;
  modify: boolean;
  addEdit: boolean;
  delete: boolean;
  all: boolean;
}

export type PagePermissions = Record<DispatchPage, RolePermissions>;

export interface DispatchAccount {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  role: DispatchRole;
  createdAt: string;
}

const defaultPermissions: RolePermissions = {
  view: true,
  modify: false,
  addEdit: false,
  delete: false,
  all: false,
};

const fullPermissions: RolePermissions = {
  view: true,
  modify: true,
  addEdit: true,
  delete: true,
  all: true,
};

const emptyPermissions: RolePermissions = {
  view: false,
  modify: false,
  addEdit: false,
  delete: false,
  all: false,
};

const defaultPages = (): PagePermissions => ({
  dashboard: { ...emptyPermissions },
  live: { ...emptyPermissions },
  stock: { ...emptyPermissions },
  manual_sale: { ...emptyPermissions },
  drivers: { ...emptyPermissions },
  hr: { ...emptyPermissions },
  settings: { ...emptyPermissions },
  clients: { ...emptyPermissions },
  caisse: { ...emptyPermissions },
  commande: { ...emptyPermissions },
  compta: { ...emptyPermissions },
  rbac: { ...emptyPermissions },
  comptoir_sale: { ...emptyPermissions },
  driver_pointage: { ...emptyPermissions },
  driver_sale: { ...emptyPermissions },
  driver_history: { ...emptyPermissions },
  facturation: { ...emptyPermissions },
  standard: { ...emptyPermissions },
  team: { ...emptyPermissions },
  rapports: { ...emptyPermissions },
});

const adminPages = (): PagePermissions => {
  const pages = defaultPages();
  (Object.keys(pages) as DispatchPage[]).forEach(k => pages[k] = { ...fullPermissions });
  return pages;
};

interface RbacState {
  permissions: Record<DispatchRole, PagePermissions>;
  accounts: DispatchAccount[];
  updatePermissions: (role: DispatchRole, page: DispatchPage, newPermissions: Partial<RolePermissions>) => void;
  addAccount: (account: DispatchAccount) => void;
  deleteAccount: (id: string) => void;
}

export const useRbacStore = create<RbacState>()(
  persist(
    (set) => ({
      permissions: {
        admin: adminPages(),
        driver: { ...defaultPages(), driver_pointage: { ...defaultPermissions }, driver_sale: { ...defaultPermissions }, driver_history: { ...defaultPermissions } },
        vendeur_comptoir: { ...defaultPages(), comptoir_sale: { ...defaultPermissions }, driver_history: { ...defaultPermissions } },
        comptable: { ...defaultPages(), compta: { ...defaultPermissions, modify: true }, caisse: { ...defaultPermissions }, commande: { ...defaultPermissions }, stock: { ...defaultPermissions }, hr: { ...defaultPermissions }, dashboard: { ...defaultPermissions }, rapports: { ...defaultPermissions } },
        stock_superviseur: { ...defaultPages(), stock: { ...defaultPermissions, modify: true, addEdit: true }, manual_sale: { ...defaultPermissions }, commande: { ...defaultPermissions } },
        caissier: { ...defaultPages(), caisse: { ...defaultPermissions, modify: true, addEdit: true } },
      },
      accounts: [
        {
          id: 'admin_1',
          nom: 'Admin',
          prenom: 'System',
          email: 'admin@goce.ma',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      updatePermissions: (role, page, newPermissions) =>
        set((state) => ({
          permissions: {
            ...state.permissions,
            [role]: {
              ...state.permissions[role],
              [page]: {
                ...(state.permissions[role][page] || emptyPermissions),
                ...newPermissions,
                ...(newPermissions.all !== undefined && newPermissions.all
                  ? { view: true, modify: true, addEdit: true, delete: true }
                  : {}),
              }
            },
          },
        })),
      addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
      deleteAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
    }),
    {
      name: 'dispatch-rbac-storage',
      storage: createJSONStorage(() => postgresStorage),
      merge: (persistedState: any, currentState: RbacState) => {
        // Handle migration from old flat role structure to per-page structure
        let mergedPermissions = { ...currentState.permissions };
        
        if (persistedState?.permissions) {
          Object.keys(persistedState.permissions).forEach(role => {
            const r = role as DispatchRole;
            const savedRolePerms = persistedState.permissions[role];
            
            // Checking if the saved state is the old flat structure or new nested structure
            if (savedRolePerms && ('view' in savedRolePerms || 'all' in savedRolePerms)) {
              // Old structure: do not overwrite current pre-configured nested defaults
            } else if (savedRolePerms) {
              // New structure: merge it in safely
              mergedPermissions[r] = {
                ...(mergedPermissions[r] || defaultPages()),
                ...savedRolePerms
              };
            }
          });
        }
        
        return {
          ...currentState,
          ...persistedState,
          permissions: mergedPermissions
        };
      }
    }
  )
);
