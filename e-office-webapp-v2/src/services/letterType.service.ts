import { client, handleApiError } from '@/lib/api';

export interface LetterType {
	id: string;
	name: string;
	description?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
	deletedAt?: Date;
}

export interface LetterTypeListResponse {
	success: boolean;
	data: LetterType[];
}

export const letterTypeService = {
	getAll: async (): Promise<LetterType[]> => {
		try {
			const response = await client.master.suratType.all.get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as LetterTypeListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /master/suratType/all endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getById: async (id: string): Promise<LetterType | null> => {
		try {
			const response = await client.master.suratType[id].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as { success: boolean; data: LetterType };
				return data.data || null;
			}
			
			throw new Error('Invalid response from /master/suratType/:id endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	create: async (data: { name: string; description?: string }): Promise<void> => {
		try {
			const response = await client.master.suratType.post(data);
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/suratType endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	update: async (id: string, data: { name?: string; description?: string }): Promise<void> => {
		try {
			const response = await client.master.suratType.patch({ id, ...data });
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/suratType endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			const response = await client.master.suratType[id].delete();
			if (response.error) {
				throw response.error;
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},
};
