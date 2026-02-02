import { client, handleApiError } from '@/lib/api';

export interface ProgramStudi {
	id: string;
	name: string;
	code: string;
	departemenId: string | null;
	departemen?: {
		id: string;
		name: string;
		code: string;
	} | null;
}

export interface ProgramStudiListResponse {
	success: boolean;
	data: ProgramStudi[];
}

export const programStudiService = {
	getAll: async (): Promise<ProgramStudi[]> => {
		try {
			const response = await client.master.programStudi.all.get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as ProgramStudiListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /master/programStudi/all endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getById: async (id: string): Promise<ProgramStudi | null> => {
		try {
			const response = await client.master.programStudi[id].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as { success: boolean; data: ProgramStudi };
				return data.data || null;
			}
			
			throw new Error('Invalid response from /master/programStudi/:id endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	create: async (data: { name: string; code: string; departemenId: string }): Promise<void> => {
		try {
			const response = await client.master.programStudi.post(data);
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/programStudi endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	update: async (id: string, data: { name?: string; code?: string; departemenId?: string }): Promise<void> => {
		try {
			const response = await client.master.programStudi.patch({ id, ...data });
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/programStudi endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			const response = await client.master.programStudi[id].delete();
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/programStudi endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},
};
