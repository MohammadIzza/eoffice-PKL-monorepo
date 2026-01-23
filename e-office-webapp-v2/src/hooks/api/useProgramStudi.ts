import { useState, useEffect } from 'react';
import { programStudiService, type ProgramStudi } from '@/services';

export function useProgramStudi() {
	const [programStudi, setProgramStudi] = useState<ProgramStudi[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchProgramStudi = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const data = await programStudiService.getAll();
				setProgramStudi(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Gagal memuat program studi';
				setError(errorMessage);
				console.error('Error fetching program studi:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchProgramStudi();
	}, []);

	return {
		programStudi,
		isLoading,
		error,
		refetch: async () => {
			setIsLoading(true);
			setError(null);
			try {
				const data = await programStudiService.getAll();
				setProgramStudi(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Gagal memuat program studi';
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
	};
}
