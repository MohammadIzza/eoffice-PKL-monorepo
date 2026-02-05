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
                // Session check failed
                const errObj = error as {
                  status?: number;
                  statusCode?: number;
                  response?: { status?: number };
                  message?: string;
                };
                const status =
                  errObj?.status || errObj?.statusCode || errObj?.response?.status;
                const errorMessage =
                  typeof errObj?.message === "string"
                    ? errObj.message
                    : error instanceof Error
                      ? error.message
                      : String(error);
                
                const isUnauthorized =
                  status === 401 ||
                  status === 403 ||
                  errorMessage.includes("401") ||
                  errorMessage.toLowerCase().includes("unauthorized") ||
                  errorMessage.toLowerCase().includes("tidak berhak") ||
                  errorMessage.toLowerCase().includes("session expired") ||
                  errorMessage.toLowerCase().includes("invalid session");

                if (isUnauthorized) {
                   // Only clear user on clear auth failures
                   set({ user: null, isLoading: false, error: null });
                   if (typeof window !== "undefined") {
                      localStorage.removeItem("auth-storage");
                   }
                } else {
                   // For network errors/server errors, keep the local user state but log warning
                   console.warn("Session background check failed (keeping local state):", errorMessage);
                   set({ isLoading: false }); // Just stops loading, doesn't clear user
                }
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
