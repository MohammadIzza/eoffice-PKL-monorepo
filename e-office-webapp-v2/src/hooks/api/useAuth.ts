import { useEffect } from 'react';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';
import type { User } from '@/types';

export function useAuth() {
  const { user, isLoading, error, setUser, setLoading, setError, checkSession, logout: clearAuth } = useAuthStore();

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { user: loggedInUser, token } = await authService.login(email, password);
      // Use setAuth/setUser/setToken as defined in store. 
      // The store update added setToken, so we can use that or a combined setter if available.
      // Based on my previous edit to store: setAuth(user, token) exists.
      // We need to cast useAuthStore() result or rely on the updated interface
      const store = useAuthStore.getState();
      store.setAuth(loggedInUser, token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login gagal';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
      setLoading(false);
    }
  };

  const verifySession = async (): Promise<void> => {
    await checkSession();
  };

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    verifySession,
  };
}
