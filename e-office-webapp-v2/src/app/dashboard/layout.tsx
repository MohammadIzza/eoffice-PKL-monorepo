'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/layouts/DashboardNavbar';
import PKLSidebar from '@/components/features/pkl/navigation/PKLSidebar';
import { withBasePath } from '@/lib/navigation';
import { useAuthStore } from '@/stores';
import { PageLoading } from '@/components/shared';
import { CompleteProfileModal } from '@/components/features/profile/CompleteProfileModal';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading, checkSession } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      await checkSession();
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        router.push(withBasePath('/login'));
        return;
      }
      setIsChecking(false);
    };

    validateSession();
  }, [checkSession, router]);

  if (isChecking || isLoading) {
    return <PageLoading text="Memeriksa sesi..." />;
  }

  if (!user) {
    return null;
  }

  const handleProfileCompleted = async () => {
    await checkSession();
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <CompleteProfileModal user={user} onCompleted={handleProfileCompleted} />
      <DashboardNavbar onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex min-h-[calc(100vh-64px)] w-full">
        <PKLSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
        <main className="flex-1 overflow-auto animate-fade-in bg-white min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
