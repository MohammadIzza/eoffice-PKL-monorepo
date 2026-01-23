import { useState, useEffect } from 'react';
import { letterService, type Letter } from '@/services';

export function useLetter(id: string | null) {
	const [letter, setLetter] = useState<Letter | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!id) {
			setLetter(null);
			return;
		}

		const fetchLetter = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const data = await letterService.getLetterDetail(id);
				setLetter(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Gagal memuat detail surat';
				setError(errorMessage);
				console.error('Error fetching letter:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchLetter();
	}, [id]);

	return {
		letter,
		isLoading,
		error,
		refetch: async () => {
			if (!id) return;
			
			setIsLoading(true);
			setError(null);
			try {
				const data = await letterService.getLetterDetail(id);
				setLetter(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Gagal memuat detail surat';
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
	};
}
