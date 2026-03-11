import { useState, useEffect, useCallback } from 'react';
import { letterService, type Letter } from '@/services';
import { useRouter } from 'next/navigation';
import { client, handleApiError } from '@/lib/api';
import { withBasePath } from '@/lib/navigation';

export function useMyLetters() {
  const router = useRouter();
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
        const errorData = handleApiError(err);

        if (errorData.status === 401) {
          window.location.href = withBasePath("/login");
          return;
        }

        setError(errorData.message);
        console.error('Error fetching letters:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLetters();
  }, [router]);

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
        const errorData = handleApiError(err);
        if (errorData.status === 401) {
          window.location.href = withBasePath("/login");
          return;
        }
        setError(errorData.message);
      } finally {
        setIsLoading(false);
      }
    },
  };
}
