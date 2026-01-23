'use client';

import { ReactNode } from 'react';
import DashboardNavbar from '@/components/layouts/DashboardNavbar';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import PKLSidebar from '@/components/features/pkl/navigation/PKLSidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-[#F2F2F2]">
        <DashboardNavbar />
        <div className="flex min-h-[calc(100vh-75px)] w-full">
          <PKLSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
