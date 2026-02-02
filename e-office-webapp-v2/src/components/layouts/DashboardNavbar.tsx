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
      document.cookie = 'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      localStorage.removeItem('auth-storage');
      router.push('/login');
    }
  };

  const notificationCount = 3;

  return (
    <header className="w-full h-16 bg-blue-600/90 backdrop-blur-md sticky top-0 z-[100] border-b border-blue-700/50 shadow-lg">
      <div className="container mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center h-8">
          <img 
            src="/logofsm.svg" 
            alt="FSM Undip" 
            className="h-full w-auto object-contain brightness-0 invert"
          />
        </div>

        {/* Center Section */}
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-white/20 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-blue-600 rounded-full"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          <Separator orientation="vertical" className="h-6 bg-white/20" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 h-auto p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <div className="flex flex-col items-end mr-1 hidden sm:flex gap-1">
                  <span className="text-sm font-semibold leading-none text-white">
                    {user?.name || 'Pengguna'}
                  </span>
                  {user?.email && (
                    <span className="text-[11px] text-blue-100/90 leading-none font-medium">
                      {user.email}
                    </span>
                  )}
                </div>
                <Avatar className="h-9 w-9 border-2 border-white/30 rounded-full">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="min-w-[14rem] w-auto max-w-[20rem] rounded-2xl shadow-xl border border-gray-200 bg-white p-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1.5 py-1 px-1">
                  <p className="text-sm font-semibold leading-none text-gray-900 break-words">
                    {user?.name || 'Pengguna'}
                  </p>
                  {user?.email && (
                    <p className="text-xs leading-relaxed text-gray-500 break-all">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem className="cursor-pointer rounded-lg py-2" asChild>
                <Link href="/dashboard/profile" className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg py-2">
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg py-2"
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