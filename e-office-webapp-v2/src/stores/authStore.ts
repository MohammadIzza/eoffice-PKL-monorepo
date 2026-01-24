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
                // Session check failed - this is expected when user is not logged in
                // Don't log as error, just clear state
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
                  errorMessage.includes("Unauthorized") ||
                  errorMessage.includes("tidak berhak") ||
                  errorMessage.includes("session");

                if (!isUnauthorized) {
                  // Only log unexpected errors
                  console.error("Session check failed:", error);
                }

                // Clear user and localStorage on session failure
                set({ user: null, isLoading: false, error: null });
                // Clear localStorage
                if (typeof window !== "undefined") {
                  localStorage.removeItem("auth-storage");
                }
                // Don't throw - let caller check user state instead
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
