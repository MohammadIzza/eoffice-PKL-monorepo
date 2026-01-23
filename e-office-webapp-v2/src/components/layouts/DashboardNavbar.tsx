'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Bell, LogOut, User, Settings } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import Link from "next/link";

export default function DashboardNavbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push('/sign-in');
    }
  };

  const notificationCount = 3;

  return (
    <header className="w-full h-16 bg-white/95 backdrop-blur-xl sticky top-0 z-50 border-b border-[rgba(0,0,0,0.08)] shadow-sm">
      <div className="container mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center h-8">
          <img 
            src="/logofsm.svg" 
            alt="FSM Undip" 
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Center: Spotlight-style Search (optional - can be added later) */}
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
          {/* Search bar can be added here */}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-white rounded-full"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          <Separator orientation="vertical" className="h-6 bg-[rgba(0,0,0,0.1)]" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 h-auto p-2 text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-full"
              >
                <div className="flex flex-col items-end mr-1 hidden sm:block">
                  <span className="text-sm font-semibold leading-tight text-[#1D1D1F]">
                    {user?.name || 'Pengguna'}
                  </span>
                  {user?.email && (
                    <span className="text-xs text-[#86868B] leading-tight">
                      {user.email}
                    </span>
                  )}
                </div>
                <Avatar className="h-9 w-9 border-2 border-[rgba(0,0,0,0.1)] rounded-full">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback className="bg-[#F5F5F7] text-[#0071E3] text-xs font-semibold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-apple-lg border border-[rgba(0,0,0,0.1)] bg-white">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none text-[#1D1D1F]">
                    {user?.name || 'Pengguna'}
                  </p>
                  {user?.email && (
                    <p className="text-xs leading-none text-[#86868B]">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.1)]" />
              <DropdownMenuItem className="cursor-pointer rounded-lg" asChild>
                <Link href="/dashboard/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.1)]" />
              <DropdownMenuItem 
                className="cursor-pointer text-[#FF3B30] focus:text-[#FF3B30] rounded-lg"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
