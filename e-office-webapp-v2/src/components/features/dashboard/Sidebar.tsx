'use client';

import Link from "next/link";
import { LayoutDashboard, Mail } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-[240px] hidden lg:block bg-white border-r h-[calc(100vh-75px)] sticky top-[75px] py-6">
       <div className="flex flex-col space-y-1 px-4">
          <p className="px-4 text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
            Menu
          </p> 
          
          <Link href="/dosen" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-600">
             <LayoutDashboard className="h-5 w-5" />
             Dasbor
          </Link>
          
          <Link href="/dosen/surat-masuk" className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900">
             <Mail className="h-5 w-5" />
             Surat Masuk
          </Link>
       </div>
    </aside>
  );
}
