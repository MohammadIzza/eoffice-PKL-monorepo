import { useState, useEffect } from 'react';
import { dosenService, type KoordinatorKaprodi } from '@/services/dosen.service';

export function useKoordinatorKaprodi(prodiId: string | null) {
  const [data, setData] = useState<KoordinatorKaprodi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prodiId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await dosenService.getKoordinatorKaprodi(prodiId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch koordinator and kaprodi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [prodiId]);

  return { data, isLoading, error };
}
