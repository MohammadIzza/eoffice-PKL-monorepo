import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function ErrorDisplay({
  title = 'Terjadi Kesalahan',
  message,
  onRetry,
  className,
  variant = 'destructive',
}: ErrorDisplayProps) {
  return (
    <div className={cn('flex items-center justify-center min-h-[400px] p-6', className)}>
      <Alert variant={variant} className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">{message}</AlertDescription>
        {onRetry && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
}
