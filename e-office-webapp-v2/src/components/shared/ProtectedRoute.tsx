'use client';

import { useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
      setHasChecked(true      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (hasChecked && !isChecking && !isLoading && !user) {
      router.replace('/login');
    }
  }, [hasChecked, isChecking, isLoading, user, router]);
  
  if (isChecking || (isLoading && !hasChecked)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F2F2F2]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRole) {
    const userRoles = user.roles?.map((r) => r.name) || [];
    if (!userRoles.includes(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#F2F2F2]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Akses Ditolak</h2>
            <p className="mt-2 text-sm text-gray-600">
              Anda tidak memiliki akses ke halaman ini. Role yang diperlukan: {requiredRole}
            </p>
          </div>
        </div>
      );
    }
  }
  
  return <>{children}</>;
}
