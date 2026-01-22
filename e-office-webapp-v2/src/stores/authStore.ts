import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authService } from '@/services';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  checkSession: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user, error: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
            checkSession: async () => {
              set({ isLoading: true, error: null });
              try {
                const user = await authService.getMe();
                set({ user, isLoading: false, error: null });
              } catch (error) {
                console.error('Session check failed:', error);
                set({ user: null, isLoading: false, error: null });
              }
            },
            logout: () => {
              set({ user: null, isLoading: false, error: null });
            },
    }),
          {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user }),
          }
  )
);
