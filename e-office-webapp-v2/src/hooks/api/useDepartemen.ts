import { useState, useEffect } from 'react';
import { departemenService, type Departemen } from '@/services';

export function useDepartemen() {
	const [departemen, setDepartemen] = useState<Departemen[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDepartemen = async () => {
			setIsLoading(true);
			setError(null);
			
			try {
				const data = await departemenService.getAll();
				setDepartemen(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Gagal memuat departemen';
				setError(errorMessage);
				console.error('Error fetching departemen:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchDepartemen();
	}, []);

	return {
		departemen,
		isLoading,
		error,
		refetch: async () => {
			setIsLoading(true);
			setError(null);
			try {
				const data = await departemenService.getAll();
				setDepartemen(data);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Gagal memuat departemen';
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
	};
}
