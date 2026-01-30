import { client, handleApiError } from '@/lib/api';

export interface Departemen {
	id: string;
	name: string;
	code: string;
}

export interface DepartemenListResponse {
	success: boolean;
	data: Departemen[];
}

export const departemenService = {
	getAll: async (): Promise<Departemen[]> => {
		try {
			const response = await client.master.departemen.all.get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as DepartemenListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /master/departemen/all endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getById: async (id: string): Promise<Departemen | null> => {
		try {
			const response = await client.master.departemen[id].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as { success: boolean; data: Departemen };
				return data.data || null;
			}
			
			throw new Error('Invalid response from /master/departemen/:id endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	create: async (data: { name: string; code: string }): Promise<void> => {
		try {
			const response = await client.master.departemen.post(data);
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/departemen endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	update: async (id: string, data: { name: string; code: string }): Promise<void> => {
		try {
			const response = await client.master.departemen.patch({ id, ...data });
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/departemen endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			const response = await client.master.departemen[id].delete();
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/departemen endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	}
};
