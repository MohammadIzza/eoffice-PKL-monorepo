import { client, handleApiError } from '@/lib/api';

export interface DosenPembimbing {
	id: string;
	name: string;
	email: string;
	nip: string | null;
	programStudi: {
		id: string;
		name: string;
		code: string;
	} | null;
}

export interface DosenListResponse {
	success: boolean;
	data: DosenPembimbing[];
}

export interface KoordinatorKaprodi {
	koordinator: {
		id: string;
		name: string;
		nip: string | null;
	} | null;
	kaprodi: {
		id: string;
		name: string;
		nip: string | null;
	} | null;
}

export interface KoordinatorKaprodiResponse {
	success: boolean;
	data: KoordinatorKaprodi;
}

export const dosenService = {
	getByProdi: async (prodiId: string): Promise<DosenPembimbing[]> => {
		try {
			const response = await (client as any).master.dosen['by-prodi'][prodiId].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as DosenListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /master/dosen/by-prodi/:prodiId endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getKoordinatorKaprodi: async (prodiId: string): Promise<KoordinatorKaprodi> => {
		try {
			const response = await (client as any).master.dosen['koordinator-kaprodi'][prodiId].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as KoordinatorKaprodiResponse;
				return data.data;
			}
			
			throw new Error('Invalid response from /master/dosen/koordinator-kaprodi/:prodiId endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},
};
