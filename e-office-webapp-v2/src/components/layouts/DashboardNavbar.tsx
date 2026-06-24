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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, LogOut, User, Menu, CheckCheck, Inbox } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import Link from "next/link";
import { withBasePath } from "@/lib/navigation";
import { useNotifications } from "@/hooks/api/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { id as indonesia } from "date-fns/locale";

interface DashboardNavbarProps {
  onMenuClick?: () => void;
}

export default function DashboardNavbar({ onMenuClick }: DashboardNavbarProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

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
      window.location.href = withBasePath("/login");
    }
  };

  const handleNotificationClick = async (notif: any) => {
    await markAsRead(notif.id);
    if (notif.link) {
      router.push(withBasePath(notif.link));
    }
  };

  return (
    <header className="w-full h-16 bg-blue-600/90 backdrop-blur-md sticky top-0 z-100 border-b border-blue-700/50 shadow-lg">
      <div className="container mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left Section: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-white hover:bg-white/20 transition-colors shrink-0"
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center h-8">
            <img
              src={withBasePath("/logofsm.svg")}
              alt="FSM Undip"
              className="h-full w-auto object-contain brightness-0 invert"
            />
          </div>
        </div>

        {/* Center Section (desktop only) */}
        <div className="flex-1 max-w-xl mx-8 hidden md:block" />

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Notifications Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/20 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-blue-600 rounded-full animate-in zoom-in"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 p-0 shadow-xl bg-white border-slate-200 z-[110]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h4 className="font-semibold text-sm text-slate-900">Notifikasi</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700 hover:bg-transparent"
                    onClick={() => markAllAsRead()}
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Tandai semua dibaca
                  </Button>
                )}
              </div>

              <ScrollArea className="h-75">
                {isLoading ? (
                  <div className="p-4 text-center text-xs text-slate-500">Memuat...</div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                    <Inbox className="w-8 h-8 opacity-50" />
                    <p className="text-sm">Tidak ada notifikasi</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => {
                      let icon = null;
                      let color = '';
                      const title = notif.title?.toLowerCase() || '';
                      if (title.includes('ditolak') || title.includes('penolakan')) {
                        icon = <span className="inline-flex items-center justify-center w-6 h-6 text-[#D93025] mr-3"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
                        color = 'text-[#D93025]';
                      } else if (title.includes('revisi') || (title.includes('dikembalikan') && title.includes('review ulang')) || title.includes('siap untuk review')) {
                        icon = <span className="inline-flex items-center justify-center w-6 h-6 text-[#FF9500] mr-3"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
                        color = 'text-[#FF9500]';
                      } else if (title.includes('disetujui') || title.includes('berhasil') || title.includes('selesai') || title.includes('dinomori')) {
                        icon = <span className="inline-flex items-center justify-center w-6 h-6 text-[#1E8E3E] mr-3"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
                        color = 'text-[#1E8E3E]';
                      } else if (title.includes('menunggu') || title.includes('pending') || title.includes('persetujuan')) {
                        icon = <span className="inline-flex items-center justify-center w-6 h-6 text-[#1B5BD7] mr-3"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
                        color = 'text-[#1B5BD7]';
                      } else if (title.includes('baru') || title.includes('pengajuan')) {
                        icon = <span className="inline-flex items-center justify-center w-6 h-6 text-[#1B5BD7] mr-3"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
                        color = 'text-[#1B5BD7]';
                      } else {
                        icon = <span className="inline-flex items-center justify-center w-6 h-6 text-[#636366] mr-3"><svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg></span>;
                        color = 'text-[#636366]';
                      }
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`flex items-start gap-2 p-4 border-b border-slate-50 text-left hover:bg-slate-50 cursor-pointer transition-colors relative rounded ${!notif.isRead ? 'bg-blue-50/100' : 'bg-white'}`}
                          style={{ minHeight: 64 }}
                        >
                          {icon}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <span className={`text-[15px] font-bold break-words whitespace-pre-line min-w-0 ${color} ${!notif.isRead ? 'font-extrabold' : 'opacity-90'}`} style={{wordBreak:'break-word',whiteSpace:'pre-line'}}>
                                {notif.title}
                              </span>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: indonesia })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed break-words whitespace-pre-line min-w-0" style={{wordBreak:'break-word',whiteSpace:'pre-line'}}>
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6 bg-white/20" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 h-auto p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <div className="hidden sm:flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold leading-none text-white truncate max-w-[120px]">
                    {user?.name || 'Pengguna'}
                  </span>
                  {user?.email && (
                    <span className="text-[11px] text-blue-100/90 leading-none font-medium truncate max-w-[120px]">
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

            <DropdownMenuContent align="end" className="min-w-56 w-auto max-w-[20rem] rounded-2xl shadow-xl border border-gray-200 bg-white p-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1.5 py-1 px-1">
                  <p className="text-sm font-semibold leading-none text-gray-900 wrap-break-word">
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
                <Link href={withBasePath("/dashboard/profile")} className="flex items-center w-full">
                  <User className="mr-2 h-4 w-4 text-gray-500" />
                  <span>Profil</span>
                </Link>
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
