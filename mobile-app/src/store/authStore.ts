import { create } from 'zustand';

import { deleteItem, getItem, setItem } from '@/services/database';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser | null) => Promise<void>;
  signOut: () => Promise<void>;
}

const AUTH_USER_KEY = 'auth_user';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,
  hydrate: async () => {
    if (get().isHydrated) {
      return;
    }

    try {
      const storedUser = await getItem(AUTH_USER_KEY);
      if (storedUser) {
        set({ user: JSON.parse(storedUser) as AuthUser, isHydrated: true });
        return;
      }
    } catch (error) {
      console.warn('Failed to hydrate auth store', error);
    }

    set({ isHydrated: true, user: null });
  },
  setUser: async (user) => {
    if (user) {
      await setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      await deleteItem(AUTH_USER_KEY);
    }

    set({ user });
  },
  signOut: async () => {
    await deleteItem(AUTH_USER_KEY);
    set({ user: null });
  }
}));
