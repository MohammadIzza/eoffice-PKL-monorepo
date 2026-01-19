// Auth hook - Login, logout, user state
import { authService } from '@/services';

export function useAuth() {
  // TODO: Implement with React Query or SWR
  const login = async (email: string, password: string) => {
    return authService.login(email, password);
  };
  
  const logout = async () => {
    return authService.logout();
  };
  
  return {
    login,
    logout,
    // user,
    // isLoading,
    // error
  };
}
