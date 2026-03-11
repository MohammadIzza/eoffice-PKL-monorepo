import { client, handleApiError } from '@/lib/api';
import type { User } from '@/types';

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    try {
      const api = client as any;
      const response = await api.public['sign-in'].post({
        username: email,
        password,
      });

      if (response.error) {
        throw response.error;
      }

      const responseData = response.data as any;
      const token = responseData.token; // Extract token

      const fullUser = await authService.getMe(token);
      return { user: fullUser, token };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  logout: async (): Promise<void> => {
    try {
      const api = client as any;
      const response = await api.public['sign-out'].post({});

      if (response.error) {
        throw response.error;
      }

      if (response.data && typeof response.data === 'object') {
        return;
      }
      throw new Error('Logout failed: Invalid response');
    } catch (error) {
      console.error('Logout error:', error);
      throw handleApiError(error);
    }
  },

  getMe: async (token?: string): Promise<User> => {
    try {
      const api = client as any;

      if (!token && typeof window !== 'undefined') {
        try {
          const storageStr = localStorage.getItem('auth-storage');
          if (storageStr) {
            const storage = JSON.parse(storageStr);
            token = storage?.state?.token;
          }
        } catch (e) {
          console.error("[AuthService] Error reading storage:", e);
        }
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await api.me.get({
        headers: headers
      });

      if (response.error) {
        throw {
          ...response.error,
          status: response.status,
          message: response.error.value || 'Gagal mengambil data sesi'
        };
      }

      if (response.data && typeof response.data === 'object') {
        return response.data as User;
      }

      throw new Error('Invalid response from /me endpoint');
    } catch (error) {
      throw handleApiError(error);
    }
  },

  updateProfile: async (data: {
    name: string;
    noHp?: string;
    alamat?: string;
    tempatLahir?: string;
    tanggalLahir?: string;
  }): Promise<void> => {
    try {
      const api = client as any;
      const response = await api.me.patch(data);

      if (response.error) {
        throw new Error(response.error.value || 'Gagal memperbarui profil');
      }
    } catch (error) {
      throw handleApiError(error);
    }
  },
};