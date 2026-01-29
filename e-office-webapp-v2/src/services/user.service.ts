import { client, handleApiError } from '@/lib/api';

export interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
}

export interface UserListResponse {
	success?: boolean;
	data?: User[];
}

export const userService = {
	getAll: async (): Promise<User[]> => {
		try {
			const response = await client.master.user.all.get();
			
			if (response.data && typeof response.data === 'object') {
				// API returns array directly or { success, data }
				if (Array.isArray(response.data)) {
					return response.data;
				}
				const data = response.data as UserListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /master/user/all endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getById: async (id: string): Promise<User | null> => {
		try {
			const response = await client.master.user[id].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as User;
				return data || null;
			}
			
			throw new Error('Invalid response from /master/user/:id endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	create: async (data: { name: string; email: string }): Promise<void> => {
		try {
			const response = await client.master.user.post(data);
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/user endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	update: async (id: string, data: { name?: string }): Promise<void> => {
		try {
			const response = await client.master.user.patch({ id, ...data });
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/user endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},
};
