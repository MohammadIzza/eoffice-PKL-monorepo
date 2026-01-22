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
