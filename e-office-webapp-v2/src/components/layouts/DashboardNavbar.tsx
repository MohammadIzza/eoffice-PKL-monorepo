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

  // Mock notification count - replace with real data
  const notificationCount = 3;

  return (
    <header className="w-full h-16 bg-primary border-b border-primary/20 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center h-8">
          <img 
            src="/logofsm.svg" 
            alt="FSM Undip" 
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-primary"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          <Separator orientation="vertical" className="h-6 bg-primary-foreground/20" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 h-auto p-2 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground"
              >
                <div className="flex flex-col items-end mr-1">
                  <span className="text-sm font-semibold leading-tight">
                    {user?.name || 'Pengguna'}
                  </span>
                  {user?.email && (
                    <span className="text-xs text-primary-foreground/70 leading-tight">
                      {user.email}
                    </span>
                  )}
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary-foreground/20">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback className="bg-primary-foreground/10 text-primary text-xs font-semibold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || 'Pengguna'}
                  </p>
                  {user?.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive focus:text-destructive"
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
