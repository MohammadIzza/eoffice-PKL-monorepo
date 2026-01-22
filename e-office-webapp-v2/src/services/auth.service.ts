// Auth service - Login, logout, getMe (cookie-based auth)
import { client } from '@/lib/api';
import { handleApiError } from '@/lib/api';
import type { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authService = {
	/**
	 * Login dengan email dan password
   * Cookies akan otomatis di-set oleh backend
	 */
  login: async (email: string, password: string): Promise<{ user: User }> => {
		try {
      const response = await client.public['sign-in'].post({
					username: email,
        password,
			});

      // Eden Treaty response: { data: BetterAuthResponse }
      // Better Auth response structure: { user, token?, ... }
      // Token optional (untuk Bearer auth), tapi kita pakai cookies
      const responseData = response.data as any;
      
      if (responseData && 'user' in responseData) {
        // User dari Better Auth response mungkin belum include roles & mahasiswa/pegawai
        // Jadi kita perlu getMe untuk data lengkap
        const fullUser = await authService.getMe();
        return { user: fullUser };
			}

      // Fallback: jika response tidak punya user, coba getMe
      const meResponse = await authService.getMe();
      return { user: meResponse };
		} catch (error) {
      throw handleApiError(error);
		}
	},

	/**
   * Logout - clear session cookies
   * Pakai custom endpoint /public/sign-out (wrapper untuk Better Auth)
	 */
	logout: async (): Promise<void> => {
		try {
      const response = await client.public['sign-out'].post({});
      
      // Verify response
      if (response.data && typeof response.data === 'object') {
        // Logout successful
        return;
      }
      
      throw new Error('Logout failed: Invalid response');
		} catch (error) {
			// Even if logout fails, clear local state
			console.error('Logout error:', error);
      throw handleApiError(error);
		}
	},

	/**
   * Get current user dari /me endpoint
   * Pakai Eden Treaty untuk consistency
	 */
  getMe: async (): Promise<User> => {
		try {
      const response = await client.me.get();

      if (response.data && typeof response.data === 'object') {
        return response.data as User;
      }

      throw new Error('Invalid response from /me endpoint');
		} catch (error) {
      throw handleApiError(error);
		}
	},
};
