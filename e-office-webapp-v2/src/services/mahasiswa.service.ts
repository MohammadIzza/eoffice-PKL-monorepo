import { client, handleApiError } from '@/lib/api';

export interface Mahasiswa {
	id: string;
	nim: string;
	tahunMasuk: string;
	noHp: string;
	alamat: string | null;
	tempatLahir: string | null;
	tanggalLahir: Date | null;
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

export interface MahasiswaListResponse {
	success: boolean;
	data: Mahasiswa[];
}

export const mahasiswaService = {
	getAll: async (): Promise<Mahasiswa[]> => {
		try {
			const response = await client.master.mahasiswa.all.get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as MahasiswaListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /master/mahasiswa/all endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getById: async (id: string): Promise<Mahasiswa | null> => {
		try {
			const response = await client.master.mahasiswa[id].get();
			
			if (response.data && typeof response.data === 'object') {
				return response.data as Mahasiswa;
			}
			
			throw new Error('Invalid response from /master/mahasiswa/:id endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	create: async (data: {
		name: string;
		email: string;
		noHp: string;
		nim: string;
		tahunMasuk: string;
		alamat: string;
		tempatLahir: string;
		tanggalLahir: string;
		departemenId: string;
		programStudiId: string;
	}): Promise<void> => {
		try {
			const response = await client.master.mahasiswa.post(data);
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/mahasiswa endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	update: async (id: string, data: {
		noHp?: string;
		nim?: string;
		tahunMasuk?: string;
		alamat?: string;
		tempatLahir?: string;
		tanggalLahir?: string;
		departemenId?: string;
		programStudiId?: string;
	}): Promise<void> => {
		try {
			const response = await client.master.mahasiswa.patch({ id, ...data });
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/mahasiswa endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			const response = await client.master.mahasiswa[id].delete();
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /master/mahasiswa endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},
};
