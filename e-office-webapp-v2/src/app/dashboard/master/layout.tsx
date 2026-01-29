'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';

export default function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const isSuperAdmin = user?.roles?.some((r) => r.name === 'superadmin') ?? false;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isSuperAdmin) {
      router.replace('/dashboard');
      return;
    }
  }, [user, isLoading, isSuperAdmin, router]);

  if (isLoading || !user || !isSuperAdmin) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-[#E5E5E7] rounded animate-pulse mb-4" />
          <div className="h-4 w-96 bg-[#E5E5E7] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
