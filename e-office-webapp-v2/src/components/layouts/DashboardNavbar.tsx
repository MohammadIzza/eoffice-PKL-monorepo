'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { useAuthStore } from "@/stores";

export default function DashboardNavbar() {
  const { user } = useAuthStore();
  
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="w-full h-[75px] bg-[#0079BD] flex items-center justify-between px-[60px] py-[10px] sticky top-0 z-50 shadow-sm">
      <div className="w-[235px] h-[55px] flex items-center">
        <img 
          src="/logofsm.svg" 
          alt="FSM Undip" 
          className="h-full w-auto object-contain"
        />
      </div>
      <div className="w-[727px] flex items-center justify-end gap-[23px]">
        <div className="relative w-[31px] h-[31px] flex items-center justify-center cursor-pointer">
          <Bell className="w-[24px] h-[24px] text-white stroke-[2]" /> 
          <div className="absolute top-[2px] right-[2px] w-[8px] h-[8px] bg-red-500 rounded-full border border-[#0079BD]"></div>
        </div>

        <div className="min-w-[222px] h-[45px] flex items-center justify-end gap-[12px]">
          <span className="text-white font-semibold text-[16px] text-right">
            {user?.name || 'Pengguna'}
          </span>
          <Avatar className="w-[45px] h-[45px] border-[2px] border-white shadow-sm cursor-pointer">
            <AvatarImage src={user?.image || undefined} />
            <AvatarFallback className="bg-blue-200 text-[#0079BD]">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
