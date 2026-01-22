'use client';

import { ReactNode } from 'react';
import Sidebar from "@/components/features/dashboard/Sidebar";

export default function DosenLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-75px)]">
      <Sidebar />
      {children}
    </div>
  );
}
