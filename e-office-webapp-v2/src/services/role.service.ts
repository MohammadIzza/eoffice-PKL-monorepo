import { client, handleApiError } from '@/lib/api';

export interface Role {
	id: string;
	name: string;
}

export interface RoleListResponse {
	success: boolean;
	data: Role[];
}

export const roleService = {
	getAll: async (): Promise<Role[]> => {
		try {
			const response = await client.master.role.all.get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as RoleListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /master/role/all endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getById: async (id: string): Promise<Role | null> => {
		try {
			const response = await client.master.role[id].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as { success: boolean; data: Role };
				return data.data || null;
			}
			
			throw new Error('Invalid response from /master/role/:id endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	create: async (data: { name: string }): Promise<void> => {
		try {
			const response = await client.master.role.post(data);
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/role endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	update: async (id: string, data: { name: string }): Promise<void> => {
		try {
			const response = await client.master.role.patch({ id, ...data });
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/role endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			const response = await client.master.role[id].delete();
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/role endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},
};
