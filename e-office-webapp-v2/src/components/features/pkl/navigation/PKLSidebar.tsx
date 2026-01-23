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
  ClipboardList,
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
            href: '/dashboard/approval/queue',
            label: 'Antrian Approval',
            icon: ClipboardList,
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
          "hidden lg:flex bg-white/95 backdrop-blur-xl border-r border-[rgba(0,0,0,0.08)] h-[calc(100vh-64px)] flex-col sticky top-[64px] shadow-sm z-40",
          "transition-[width] duration-500 ease-in-out",
          isCollapsed ? "w-[70px]" : "w-[270px]"
        )}
      >
        {/* Header with Toggle */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[rgba(0,0,0,0.08)] overflow-hidden">
          <div 
            className={cn(
              "flex items-center gap-2 transition-all duration-500 ease-in-out",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
            )}
          >
            <div className="p-2 rounded-xl bg-[#0071E3]/10 shrink-0">
              <FileText className="w-4 h-4 text-[#0071E3]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#1D1D1F] whitespace-nowrap tracking-tight">E-Office</h2>
              <p className="text-[10px] text-[#86868B] whitespace-nowrap">PKL System</p>
            </div>
          </div>
            <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "h-8 w-8 hover:bg-[rgba(0,0,0,0.04)] shrink-0 transition-transform duration-300 rounded-full",
              isCollapsed && "mx-auto"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 transition-transform duration-300 text-[#86868B]" />
            ) : (
              <ChevronLeft className="h-4 w-4 transition-transform duration-300 text-[#86868B]" />
            )}
          </Button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className={cn("mb-6", isCollapsed ? "px-2" : "px-3")}>
              <div 
                className={cn(
                  "px-3 mb-3 transition-all duration-500 ease-in-out overflow-hidden",
                  isCollapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
                )}
              >
                <p className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider whitespace-nowrap">
                  {section.title}
                </p>
              </div>
              <div className={cn("flex flex-col gap-1", isCollapsed && "items-center")}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  const menuItem = (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative group overflow-hidden",
                        isCollapsed ? "justify-center w-12 h-12" : "",
                        active
                          ? "bg-[#0071E3] text-white shadow-sm font-semibold"
                          : "text-[#86868B] hover:bg-[rgba(0,0,0,0.04)] hover:text-[#1D1D1F] hover:font-semibold"
                      )}
                    >
                      <Icon className={cn(
                        "shrink-0 transition-all duration-200",
                        active ? "w-5 h-5" : "w-5 h-5",
                        !active && "group-hover:scale-110 group-hover:text-[#0071E3]"
                      )} />
                      <span 
                        className={cn(
                          "flex-1 transition-all duration-500 ease-in-out whitespace-nowrap tracking-tight",
                          !active && "group-hover:text-[#1D1D1F]",
                          isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
                        )}
                      >
                        {item.label}
                      </span>
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
            "px-4 py-4 border-t border-[rgba(0,0,0,0.08)] overflow-hidden transition-all duration-500 ease-in-out",
            isCollapsed ? "opacity-0 h-0 py-0" : "opacity-100 h-auto"
          )}
        >
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[rgba(0,0,0,0.02)]">
            <div className="w-10 h-10 rounded-full bg-[#0071E3]/10 flex items-center justify-center shrink-0">
              <span className="text-[#0071E3] text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div 
              className={cn(
                "flex-1 min-w-0 transition-all duration-500 ease-in-out",
                isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100 w-auto"
              )}
            >
              <p className="text-sm font-semibold text-[#1D1D1F] truncate whitespace-nowrap tracking-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-[11px] text-[#86868B] truncate whitespace-nowrap">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
