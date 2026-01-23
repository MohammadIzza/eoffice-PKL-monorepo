import { useState, useEffect } from 'react';
import { dosenService, type DosenPembimbing } from '@/services';

export function useDosenPembimbing(prodiId: string | null) {
	const [dosen, setDosen] = useState<DosenPembimbing[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!prodiId) {
			setDosen([]);
			return;
		}

		const fetchDosen = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const data = await dosenService.getByProdi(prodiId);
				setDosen(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Gagal memuat dosen pembimbing';
				setError(errorMessage);
				console.error('Error fetching dosen pembimbing:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchDosen();
	}, [prodiId]);

	return {
		dosen,
		isLoading,
		error,
		refetch: async () => {
			if (!prodiId) return;
			
			setIsLoading(true);
			setError(null);
			try {
				const data = await dosenService.getByProdi(prodiId);
				setDosen(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Gagal memuat dosen pembimbing';
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
	};
}
