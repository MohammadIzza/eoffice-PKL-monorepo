'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/features/pkl/Navbar';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-[#F2F2F2]">
        <Navbar />
        <main className="w-full">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
