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

  useEffect(() => {
    const validateSession = async () => {
      await checkSession();
      // Check if user is null after session check
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) {
        // No user found, redirect to login
        router.push(withBasePath('/login'));
        return;
      }
      setIsChecking(false);
    };

    validateSession();
  }, [checkSession, router]);

  // Show loading while checking session
  if (isChecking || isLoading) {
    return <PageLoading text="Memeriksa sesi..." />;
  }

  // If no user after checking, don't render (redirect is happening)
  if (!user) {
    return null;
  }

  const handleProfileCompleted = async () => {
    // Re-fetch user data so mahasiswa/pegawai is populated
    await checkSession();
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <CompleteProfileModal user={user} onCompleted={handleProfileCompleted} />
      <DashboardNavbar />
      <div className="flex min-h-[calc(100vh-64px)] w-full">
        <PKLSidebar />
        <main className="flex-1 overflow-auto animate-fade-in bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
