import { client, handleApiError } from '@/lib/api';

export interface Pegawai {
	id: string;
	nip: string;
	jabatan: string;
	noHp: string | null;
	userId: string;
	departemenId: string;
	programStudiId: string;
	user?: {
		id: string;
		name: string;
		email: string;
	};
	departemen?: {
		id: string;
		name: string;
		code: string;
	};
	programStudi?: {
		id: string;
		name: string;
		code: string;
	};
}

export interface PegawaiListResponse {
	success: boolean;
	data: Pegawai[];
}

export const pegawaiService = {
	getAll: async (): Promise<Pegawai[]> => {
		try {
			const response = await client.master.pegawai.all.get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as PegawaiListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /master/pegawai/all endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getById: async (id: string): Promise<Pegawai | null> => {
		try {
			const response = await client.master.pegawai[id].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as { success: boolean; data: Pegawai };
				return data.data || null;
			}
			
			throw new Error('Invalid response from /master/pegawai/:id endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	create: async (data: {
		name: string;
		email: string;
		nip: string;
		jabatan: string;
		noHp?: string;
		departemenId: string;
		programStudiId: string;
	}): Promise<void> => {
		try {
			const response = await client.master.pegawai.post(data);
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/pegawai endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	update: async (id: string, data: {
		nip?: string;
		jabatan?: string;
		noHp?: string;
		departemenId?: string;
		programStudiId?: string;
	}): Promise<void> => {
		try {
			const response = await client.master.pegawai.patch({ id, ...data });
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/pegawai endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			const response = await client.master.pegawai[id].delete();
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/pegawai endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},
};
