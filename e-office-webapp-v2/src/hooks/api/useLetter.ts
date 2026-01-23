import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { letterService, type Letter } from '@/services';
import { handleApiError } from '@/lib/api';

export function useLetter(id: string | null) {
	const router = useRouter();
	const [letter, setLetter] = useState<Letter | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isForbidden, setIsForbidden] = useState(false);

	useEffect(() => {
		if (!id) {
			setLetter(null);
			return;
		}

		const fetchLetter = async () => {
			setIsLoading(true);
			setError(null);
			setIsForbidden(false);
			
			try {
				const data = await letterService.getLetterDetail(id);
				setLetter(data);
			} catch (err) {
				const apiError = handleApiError(err);
				const errorMessage = apiError.message || 'Gagal memuat detail surat';
				
				// Check if it's a 403 Forbidden error
				if (apiError.status === 403 || errorMessage.includes('tidak berhak')) {
					setIsForbidden(true);
					setError('Anda tidak berhak mengakses surat ini');
				} else if (apiError.status === 401) {
					// Unauthorized - redirect to login
					router.push('/login');
				} else {
					setError(errorMessage);
				}
				console.error('Error fetching letter:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchLetter();
	}, [id, router]);

	return {
		letter,
		isLoading,
		error,
		isForbidden,
		refetch: async () => {
			if (!id) return;
			
			setIsLoading(true);
			setError(null);
			setIsForbidden(false);
			try {
				const data = await letterService.getLetterDetail(id);
				setLetter(data);
			} catch (err) {
				const apiError = handleApiError(err);
				const errorMessage = apiError.message || 'Gagal memuat detail surat';
				
				if (apiError.status === 403 || errorMessage.includes('tidak berhak')) {
					setIsForbidden(true);
					setError('Anda tidak berhak mengakses surat ini');
				} else {
					setError(errorMessage);
				}
			} finally {
				setIsLoading(false);
			}
		},
	};
}
