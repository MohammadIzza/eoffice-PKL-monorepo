'use client';

import { useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageLoading } from './PageLoading';
import { ErrorDisplay } from './ErrorDisplay';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, checkSession } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!user && !hasChecked) {
      setIsChecking(true);
      checkSession()
        .then(() => {
          setIsChecking(false);
          setHasChecked(true);
        })
        .catch((error) => {
          console.error('Session check failed:', error);
          setIsChecking(false);
          setHasChecked(true);
        });
    } else if (user) {
      setIsChecking(false);
      setHasChecked(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (hasChecked && !isChecking && !isLoading && !user) {
      router.replace('/login');
    }
  }, [hasChecked, isChecking, isLoading, user, router]);
  
  if (isChecking || (isLoading && !hasChecked)) {
    return <PageLoading text="Memeriksa sesi..." />;
  }

  if (!user) {
    return null;
  }

  if (requiredRole) {
    const userRoles = user.roles?.map((r) => r.name) || [];
    if (!userRoles.includes(requiredRole)) {
      return (
        <ErrorDisplay
          title="Akses Ditolak"
          message={`Anda tidak memiliki akses ke halaman ini. Role yang diperlukan: ${requiredRole}`}
        />
      );
    }
  }
  
  return <>{children}</>;
}
