'use client';

import { useState } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  FileText, 
  Paperclip, 
  Eye, 
  CheckCircle,
  LayoutDashboard,
  Inbox,
  ClipboardList,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import type { UserRoleName } from "@/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function PKLSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const userRoles = user?.roles?.map(r => r.name as UserRoleName) || [];
  const isMahasiswa = userRoles.includes('mahasiswa');
  const isApprover = userRoles.some(role => 
    [
      'dosen_pembimbing',
      'dosen_koordinator',
      'ketua_program_studi',
      'admin_fakultas',
      'supervisor_akademik',
      'supervisor_kemahasiswaan',
      'manajer_tu',
      'wakil_dekan_1',
      'upa'
    ].includes(role)
  );
  const isDosen = userRoles.some(role => 
    ['dosen_pembimbing', 'dosen_koordinator'].includes(role)
  );

  const getMenuItems = () => {
    const items: Array<{
      title: string;
      items: Array<{
        href: string;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
      }>;
    }> = [];

    if (isMahasiswa) {
      items.push({
        title: 'MENU UTAMA',
        items: [
          {
            href: '/dashboard',
            label: 'Dasbor',
            icon: LayoutDashboard,
          },
          {
            href: '/dashboard/surat',
            label: 'Daftar Surat Saya',
            icon: FileText,
          },
        ],
      });

      items.push({
        title: 'PENGAJUAN PKL',
        items: [
          {
            href: '/dashboard/pengajuan/pkl/identitas',
            label: 'Identitas Pemohon',
            icon: User,
          },
          {
            href: '/dashboard/pengajuan/pkl/detail-pengajuan',
            label: 'Detail Pengajuan',
            icon: FileText,
          },
          {
            href: '/dashboard/pengajuan/pkl/lampiran',
            label: 'Lampiran',
            icon: Paperclip,
          },
          {
            href: '/dashboard/pengajuan/pkl/review',
            label: 'Review',
            icon: Eye,
          },
          {
            href: '/dashboard/pengajuan/pkl/status',
            label: 'Status',
            icon: CheckCircle,
          },
        ],
      });
    }

    if (isApprover) {
      items.push({
        title: 'MENU UTAMA',
        items: [
          {
            href: '/dashboard',
            label: 'Dasbor',
            icon: LayoutDashboard,
          },
          {
            href: '/dashboard/surat',
            label: 'Surat Masuk',
            icon: Inbox,
          },
        ],
      });
    }

    if (isDosen) {
      items.push({
        title: 'MENU DOSEN',
        items: [
          {
            href: '/dashboard/dosen',
            label: 'Dasbor Dosen',
            icon: LayoutDashboard,
          },
          {
            href: '/dashboard/dosen/surat-masuk',
            label: 'Surat Masuk',
            icon: Inbox,
          },
        ],
      });
    }

    return items;
  };

  const menuItems = getMenuItems();

  const isActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <aside 
        className={cn(
          "hidden lg:flex bg-card border-r border-border h-[calc(100vh-75px)] flex-col sticky top-[75px] shadow-sm z-40",
          "transition-[width] duration-500 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[240px]"
        )}
      >
        {/* Header with Toggle */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border overflow-hidden">
          <div 
            className={cn(
              "flex items-center gap-1.5 transition-all duration-500 ease-in-out",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
            )}
          >
            <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-foreground whitespace-nowrap">E-Office</h2>
              <p className="text-[10px] text-muted-foreground whitespace-nowrap">PKL System</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "h-7 w-7 hover:bg-muted shrink-0 transition-transform duration-300",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5 transition-transform duration-300" />
            )}
          </Button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-3">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className={cn("mb-4", isCollapsed ? "px-1.5" : "px-2")}>
              <div 
                className={cn(
                  "px-2 mb-2 transition-all duration-500 ease-in-out overflow-hidden",
                  isCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
                )}
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {section.title}
                </p>
              </div>
              <div className={cn("flex flex-col gap-0.5", isCollapsed && "items-center")}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  const menuItem = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 relative group overflow-hidden",
                        isCollapsed ? "justify-center w-10 h-10" : "",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground hover:font-semibold"
                      )}
                    >
                      <Icon className={cn(
                        "shrink-0 transition-all duration-200",
                        active ? "w-4 h-4" : "w-4 h-4",
                        !active && "group-hover:scale-110 group-hover:text-primary"
                      )} />
                      <span 
                        className={cn(
                          "flex-1 transition-all duration-500 ease-in-out whitespace-nowrap",
                          !active && "group-hover:text-foreground",
                          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                        )}
                      >
                        {item.label}
                      </span>
                      {active && !isCollapsed && (
                        <div className="absolute right-0 w-1 h-5 bg-primary-foreground rounded-l-full transition-opacity duration-500" />
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <TooltipProvider key={item.href} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {menuItem}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="ml-2">
                            <p className="font-semibold">{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }

                  return menuItem;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div 
          className={cn(
            "px-3 py-3 border-t border-border overflow-hidden transition-all duration-500 ease-in-out",
            isCollapsed ? "opacity-0 h-0 py-0" : "opacity-100 h-auto"
          )}
        >
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/50">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary text-[10px] font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div 
              className={cn(
                "flex-1 min-w-0 transition-all duration-500 ease-in-out",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
              )}
            >
              <p className="text-xs font-semibold text-foreground truncate whitespace-nowrap">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate whitespace-nowrap">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
