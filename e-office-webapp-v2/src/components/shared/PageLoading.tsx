import { LoadingSpinner } from './LoadingSpinner';

interface PageLoadingProps {
  text?: string;
}

export function PageLoading({ text = 'Memuat...' }: PageLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
