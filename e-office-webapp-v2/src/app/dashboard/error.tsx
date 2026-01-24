'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <ErrorDisplay
      title="Terjadi Kesalahan"
      message={error.message || 'Terjadi kesalahan saat memuat dashboard.'}
      onRetry={reset}
    />
  );
}
