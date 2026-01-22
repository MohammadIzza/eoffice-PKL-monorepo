// Auth store - User and session state (cookie-based, no token)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
          const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const user = await response.json();
            set({ user, isLoading: false, error: null });
          } else {
            // Session invalid or expired
            set({ user: null, isLoading: false, error: null });
          }
        } catch (error) {
          console.error('Session check failed:', error);
          set({ user: null, isLoading: false, error: 'Failed to check session' });
        }
      },
      logout: () => {
        set({ user: null, isLoading: false, error: null });
        // Cookies will be cleared by backend on sign-out
      },
    }),
    {
      name: 'auth-storage',
      // Only persist user, not loading/error states
      partialize: (state) => ({ user: state.user }),
    }
  )
);
