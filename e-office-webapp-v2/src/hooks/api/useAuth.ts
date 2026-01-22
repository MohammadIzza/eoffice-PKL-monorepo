// Auth hook - Login, logout, user state (cookie-based, no React Query)
import { useEffect } from 'react';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';
import type { User } from '@/types';

export function useAuth() {
  const { user, isLoading, error, setUser, setLoading, setError, checkSession, logout: clearAuth } = useAuthStore();

  /**
   * Login dengan email dan password
   * Set cookies otomatis, kemudian update user di store
   */
  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { user: loggedInUser } = await authService.login(email, password);
      setUser(loggedInUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login gagal';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout - clear cookies dan local state
   */
  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
      // Continue dengan clear local state even if logout fails
    } finally {
      clearAuth();
      setLoading(false);
    }
  };

  /**
   * Check session - verify user masih logged in
   * Bisa dipanggil manual atau on mount
   */
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
