import { create } from 'zustand';
import { postgresStorage } from '../lib/postgresStorage';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { User } from '../types';

interface UsersStore {
  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

export const useUsersStore = create<UsersStore>()(
  persist(
    immer((set) => ({
      users: [],
      addUser: (user) => set((state) => {
        state.users.push(user);
      }),
      updateUser: (id, updatedUser) => set((state) => {
        const index = state.users.findIndex(u => u.id === id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updatedUser };
        }
      }),
      deleteUser: (id) => set((state) => {
        state.users = state.users.filter(u => u.id !== id);
      }),
    })),
    { name: 'fleetops-users', storage: createJSONStorage(() => postgresStorage) }
  )
);
