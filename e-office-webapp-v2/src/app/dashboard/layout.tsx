'use client';

import { ReactNode } from 'react';
import DashboardNavbar from '@/components/layouts/DashboardNavbar';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-[#F2F2F2]">
        <DashboardNavbar />
        <main className="w-full">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
