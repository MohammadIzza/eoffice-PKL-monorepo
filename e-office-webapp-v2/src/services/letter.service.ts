import { client, handleApiError } from '@/lib/api';
import { API_URL } from '@/lib/constants';

export interface SubmitLetterPayload {
	prodiId: string;
	dosenPembimbingUserId: string;
	formData: Record<string, any>;
}

export interface Letter {
	id: string;
	letterTypeId: string;
	createdById: string;
	schema: Record<string, any> | null;
	values: Record<string, any>;
	status: string;
	currentStep: number | null;
	assignedApprovers: Record<string, string> | null;
	documentVersions: Array<{
		version: number;
		storageKey: string | null;
		format: string;
		createdBy: string;
		reason: string;
		timestamp: string;
		isPDF: boolean;
		isEditable: boolean;
	}> | null;
	latestEditableVersion: number | null;
	latestPDFVersion: number | null;
	signedAt: Date | null;
	signatureUrl: string | null;
	letterNumber: string | null;
	createdAt: Date;
	updatedAt: Date;
	letterType?: {
		id: string;
		name: string;
		description: string | null;
	};
	numbering?: {
		id: string;
		numberString: string;
		counter: number;
		date: Date;
	} | null;
	stepHistory?: Array<{
		id: string;
		action: string;
		step: number | null;
		actorUserId: string;
		actorRole: string;
		comment: string | null;
		fromStep: number | null;
		toStep: number | null;
		metadata: Record<string, any> | null;
		createdAt: Date;
		actor?: {
			id: string;
			name: string;
			email: string;
		};
	}>;
	attachments?: Array<{
		id: string;
		filename: string;
		category: string | null;
		uploadedByUserId: string;
		createdAt: Date;
	}>;
	createdBy?: {
		id: string;
		name: string;
		email: string;
	};
}

export interface LetterListResponse {
	success: boolean;
	data: Letter[];
}

export interface LetterDetailResponse {
	success: boolean;
	data: Letter;
}

export interface SubmitLetterResponse {
	success: boolean;
	message: string;
	data: {
		letterId: string;
		status: string;
		currentStep: number | null;
		assignedApprovers: Record<string, string>;
	};
}

export const letterService = {
	getMyLetters: async (): Promise<Letter[]> => {
		try {
			const response = await client.letter.my.get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as LetterListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /letter/my endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getLetterDetail: async (id: string): Promise<Letter> => {
		try {
			const response = await client.letter[id].get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as LetterDetailResponse;
				return data.data;
			}
			
			throw new Error('Invalid response from /letter/:id endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	submitLetter: async (payload: SubmitLetterPayload): Promise<SubmitLetterResponse['data']> => {
		try {
			const response = await client.letter.pkl.submit.post({
				prodiId: payload.prodiId,
				dosenPembimbingUserId: payload.dosenPembimbingUserId,
				formData: payload.formData,
			});
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as SubmitLetterResponse;
				if (data.success && data.data) {
					return data.data;
				}
			}
			
			throw new Error('Invalid response from /letter/pkl/submit endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getQueue: async (activeRole: string): Promise<Letter[]> => {
		try {
			const response = await client.letter.queue.get({
				query: { activeRole },
			});
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as LetterListResponse;
				return data.data || [];
			}
			
			throw new Error('Invalid response from /letter/queue endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	approve: async (id: string, comment?: string, signatureData?: { method: string; data: string }): Promise<void> => {
		try {
			const response = await client.letter[id].approve.post({
				comment,
				signatureData,
			});
			
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /letter/:id/approve endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	reject: async (id: string, comment: string): Promise<void> => {
		try {
			const response = await client.letter[id].reject.post({
				comment,
			});
			
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /letter/:id/reject endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	revise: async (id: string, comment: string): Promise<void> => {
		try {
			const response = await client.letter[id].revise.post({
				comment,
			});
			
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /letter/:id/revise endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	cancel: async (id: string): Promise<void> => {
		try {
			const response = await client.letter[id].cancel.post({});
			
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /letter/:id/cancel endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	selfRevise: async (id: string): Promise<void> => {
		try {
			const response = await client.letter[id]['self-revise'].post({});
			
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /letter/:id/self-revise endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	resubmit: async (id: string, formData: Record<string, any>): Promise<void> => {
		try {
			const response = await client.letter[id].resubmit.post({
				formData,
			});
			
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /letter/:id/resubmit endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getPreview: async (id: string): Promise<{
		version: number;
		format: string;
		isPDF: boolean;
		isEditable: boolean;
		createdBy: string;
		reason: string;
		timestamp: string;
		previewUrl: string;
		expiresIn: number;
	}> => {
		try {
			const response = await client.letter[id].preview.get();
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as any;
				if (data.success && data.data && data.data.preview) {
					return data.data.preview;
				}
			}
			
			throw new Error('Invalid response from /letter/:id/preview endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	getNumberingSuggestion: async (id: string, date?: string): Promise<{
		suggestion: string;
		counter: number;
		date: Date;
	}> => {
		try {
			const response = await client.letter[id].numbering.suggestion.get({
				query: date ? { date } : {},
			});
			
			if (response.data && typeof response.data === 'object') {
				const data = response.data as any;
				if (data.success && data.data) {
					return data.data;
				}
			}
			
			throw new Error('Invalid response from /letter/:id/numbering/suggestion endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},

	assignNumber: async (id: string, numberString: string, date?: string): Promise<void> => {
		try {
			const response = await client.letter[id].numbering.post({
				numberString,
				date,
			});
			
			if (!response.data || typeof response.data !== 'object') {
				throw new Error('Invalid response from /letter/:id/numbering endpoint');
			}
		} catch (error) {
			throw handleApiError(error);
		}
	},

	uploadAttachments: async (
		letterId: string,
		files: File[],
		category?: string,
		replaceExisting?: boolean
	): Promise<{
		letterId: string;
		attachments: Array<{
			id: string;
			filename: string;
			originalName: string;
			category: string | null;
			url: string;
			uploadedAt: Date;
		}>;
		totalUploaded: number;
	}> => {
		try {
			const formData = new FormData();
			files.forEach((file) => {
				formData.append('files', file);
			});
			if (category) {
				formData.append('category', category);
			}
			if (replaceExisting !== undefined) {
				formData.append('replaceExisting', String(replaceExisting));
			}

			const response = await fetch(`${API_URL}/letter/${letterId}/attachments`, {
				method: 'POST',
				body: formData,
				credentials: 'include',
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
				throw new Error(errorData.message || 'Upload failed');
			}

			const data = await response.json();
			if (data.success && data.data) {
				return data.data;
			}

			throw new Error('Invalid response from /letter/:id/attachments endpoint');
		} catch (error) {
			throw handleApiError(error);
		}
	},
};
