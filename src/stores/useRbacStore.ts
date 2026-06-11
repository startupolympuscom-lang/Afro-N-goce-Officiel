import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { postgresStorage } from '../lib/postgresStorage';
import { DispatchRole } from './useDispatchAuthStore';

export interface RolePermissions {
  view: boolean;
  modify: boolean;
  addEdit: boolean;
  delete: boolean;
  all: boolean;
}

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

interface RbacState {
  permissions: Record<DispatchRole, RolePermissions>;
  accounts: DispatchAccount[];
  updatePermissions: (role: DispatchRole, newPermissions: Partial<RolePermissions>) => void;
  addAccount: (account: DispatchAccount) => void;
  deleteAccount: (id: string) => void;
}

export const useRbacStore = create<RbacState>()(
  persist(
    (set) => ({
      permissions: {
        admin: { view: true, modify: true, addEdit: true, delete: true, all: true },
        driver: { ...defaultPermissions },
        vendeur_comptoir: { ...defaultPermissions },
        comptable: { ...defaultPermissions, modify: true },
        stock_superviseur: { ...defaultPermissions, modify: true, addEdit: true },
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
      updatePermissions: (role, newPermissions) =>
        set((state) => ({
          permissions: {
            ...state.permissions,
            [role]: {
              ...state.permissions[role],
              ...newPermissions,
              ...(newPermissions.all !== undefined && newPermissions.all
                ? { view: true, modify: true, addEdit: true, delete: true }
                : {}),
            },
          },
        })),
      addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
      deleteAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
    }),
    {
      name: 'dispatch-rbac-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
