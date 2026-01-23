'use client';

import { ReactNode } from 'react';
import DashboardNavbar from '@/components/layouts/DashboardNavbar';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import PKLSidebar from '@/components/features/pkl/navigation/PKLSidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-white">
        <DashboardNavbar />
        <div className="flex min-h-[calc(100vh-64px)] w-full">
          <PKLSidebar />
          <main className="flex-1 overflow-auto animate-fade-in bg-white">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
