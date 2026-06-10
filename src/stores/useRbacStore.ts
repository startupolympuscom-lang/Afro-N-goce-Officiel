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

const defaultPermissions: RolePermissions = {
  view: true,
  modify: false,
  addEdit: false,
  delete: false,
  all: false,
};

interface RbacState {
  permissions: Record<DispatchRole, RolePermissions>;
  updatePermissions: (role: DispatchRole, newPermissions: Partial<RolePermissions>) => void;
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
    }),
    {
      name: 'dispatch-rbac-storage',
      storage: createJSONStorage(() => postgresStorage),
    }
  )
);
