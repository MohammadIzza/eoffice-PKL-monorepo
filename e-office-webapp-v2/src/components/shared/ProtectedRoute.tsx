'use client';

import { useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  
  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);
  
  if (!token) {
    return null;
  }
  
  return <>{children}</>;
}
