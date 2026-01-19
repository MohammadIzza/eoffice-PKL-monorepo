// Auth service - Login, logout, register
import { client } from '@/lib/api';

export const authService = {
  login: async (email: string, password: string) => {
    // TODO: Implement login
    return client.public['sign-in'].post({ username: email, password });
  },
  
  logout: async () => {
    // TODO: Implement logout
  },
  
  getMe: async () => {
    // TODO: Implement get current user
  }
};
