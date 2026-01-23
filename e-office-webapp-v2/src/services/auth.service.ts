import { client, handleApiError } from '@/lib/api';
import type { User } from '@/types';

export const authService = {
  login: async (email: string, password: string): Promise<{ user: User }> => {
		try {
      const api = client as any;
      const response = await api.public['sign-in'].post({
					username: email,
        password,
			});

      const responseData = response.data as any;
      const fullUser = await authService.getMe();
      return { user: fullUser };
		} catch (error) {
      throw handleApiError(error);
		}
	},

	logout: async (): Promise<void> => {
		try {
      const api = client as any;
      const response = await api.public['sign-out'].post({});
      if (response.data && typeof response.data === 'object') {
        return;
      }
      throw new Error('Logout failed: Invalid response');
		} catch (error) {
			console.error('Logout error:', error);
      throw handleApiError(error);
		}
	},

  getMe: async (): Promise<User> => {
		try {
      const api = client as any;
      const response = await api.me.get();

      if (response.data && typeof response.data === 'object') {
        return response.data as User;
      }

      throw new Error('Invalid response from /me endpoint');
		} catch (error) {
      throw handleApiError(error);
		}
	},
};
