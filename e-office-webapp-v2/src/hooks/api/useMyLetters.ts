import { useState, useEffect } from 'react';
import { letterService, type Letter } from '@/services';

export function useMyLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLetters = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await letterService.getMyLetters();
        setLetters(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat daftar surat';
        setError(errorMessage);
        console.error('Error fetching letters:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLetters();
  }, []);

  const hasLetterInProgress = letters.some((l) =>
    ['PENDING', 'PROCESSING', 'REVISION'].includes(l.status)
  );

  return {
    letters,
    isLoading,
    error,
    hasLetterInProgress,
    refetch: async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await letterService.getMyLetters();
        setLetters(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Gagal memuat daftar surat';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
  };
}
