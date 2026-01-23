'use client';

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
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import type { UserRoleName } from "@/types";

export default function PKLSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

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
    <aside className="w-[260px] hidden lg:flex bg-white border-r border-[#E2E8F0] min-h-[calc(100vh-75px)] flex-col py-6 sticky top-[75px]">
      {menuItems.map((section, sectionIndex) => (
        <div key={sectionIndex} className="flex flex-col gap-1 px-3 mb-6">
          <p className="px-3 text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wider">
            {section.title}
          </p>
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[6px] transition-colors",
                  active
                    ? "bg-[#F1F5F9] text-[#0F172A] font-semibold"
                    : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
