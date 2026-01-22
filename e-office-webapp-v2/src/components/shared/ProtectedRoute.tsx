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

  useEffect(() => {
    const verifyAuth = async () => {
      // Check session jika user belum ada di store
      if (!user) {
        setIsChecking(true);
        await checkSession();
        setIsChecking(false);
      } else {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [user, checkSession]);

  useEffect(() => {
    // Redirect ke login jika tidak ada user setelah check
    if (!isChecking && !isLoading && !user) {
      router.push('/login');
    }
  }, [isChecking, isLoading, user, router]);

  // Loading state
  if (isChecking || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Check role if required
  if (requiredRole) {
    const userRoles = user.roles.map((r) => r.name);
    if (!userRoles.includes(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
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
