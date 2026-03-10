'use client';

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { 
  FileText, 
  Users,
  UserCog,
  Briefcase,
  CheckCircle2, 
  Clock,
  AlertCircle,
  Building2,
  GraduationCap,
  TrendingUp,
  Shield,
  FileBadge,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { withBasePath } from '@/lib/navigation';
import { DashboardChartsWrapper } from './DashboardChartsWrapper';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { letterService } from '@/services';
import type { Letter } from '@/services/letter.service';
import { userService, mahasiswaService, pegawaiService, departemenService, programStudiService, roleService, letterTypeService } from '@/services';

// --- Apple Style Colors & Utilities ---
const COLORS = {
  DRAFT: '#8E8E93',      // System Gray
  PENDING: '#007AFF',    // System Blue
  PROCESSING: '#5856D6', // System Indigo
  REVISION: '#FF9500',   // System Orange
  COMPLETED: '#34C759',  // System Green
  REJECTED: '#FF3B30',   // System Red
  CANCELLED: '#FF3B30',
};

interface SuperAdminDashboardProps {
  userName: string;
}

export function SuperAdminDashboard({ userName }: SuperAdminDashboardProps) {
  // --------------------------------------------------------------------------
  // LOGIC AREA - (Tidak ada yang diubah, persis seperti aslinya)
  // --------------------------------------------------------------------------
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoadingLetters, setIsLoadingLetters] = useState(true);
  const [masterDataStats, setMasterDataStats] = useState({
    totalUsers: 0,
    totalMahasiswa: 0,
    totalPegawai: 0,
    totalDepartemen: 0,
    totalProdi: 0,
    totalRole: 0,
    totalLetterType: 0,
  });
  const [isLoadingMasterData, setIsLoadingMasterData] = useState(true);

  // Fetch all letters
  useEffect(() => {
    const fetchLetters = async () => {
      try {
        console.log('[SuperAdminDashboard] Fetching all letters...');
        const data = await letterService.getAllLetters();
        console.log('[SuperAdminDashboard] Fetched letters:', data?.length || 0);
        setLetters(data);
      } catch (error: any) {
        console.error('[SuperAdminDashboard] Error fetching all letters:', {
          message: error?.message || 'Unknown error',
          status: error?.status,
          error: error
        });
      } finally {
        setIsLoadingLetters(false);
      }
    };
    fetchLetters();
  }, []);

  // Fetch master data statistics
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [users, mahasiswa, pegawai, departemen, prodi, roles, letterTypes] = await Promise.all([
          userService.getAll(),
          mahasiswaService.getAll(),
          pegawaiService.getAll(),
          departemenService.getAll(),
          programStudiService.getAll(),
          roleService.getAll(),
          letterTypeService.getAll(),
        ]);
        
        setMasterDataStats({
          totalUsers: users.length,
          totalMahasiswa: mahasiswa.length,
          totalPegawai: pegawai.length,
          totalDepartemen: departemen.length,
          totalProdi: prodi.length,
          totalRole: roles.length,
          totalLetterType: letterTypes.length,
        });
      } catch (error) {
        console.error('Error fetching master data:', error);
      } finally {
        setIsLoadingMasterData(false);
      }
    };
    fetchMasterData();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = letters.length;
    const draft = letters.filter(l => l.status === 'DRAFT').length;
    const pending = letters.filter(l => l.status === 'PENDING' || l.status === 'PROCESSING').length;
    const completed = letters.filter(l => l.status === 'COMPLETED').length;
    const rejected = letters.filter(l => l.status === 'REJECTED' || l.status === 'CANCELLED').length;
    const revision = letters.filter(l => l.status === 'REVISION').length;

    return { total, draft, pending, completed, rejected, revision };
  }, [letters]);

  // Prepare chart data - Last 7 days
  const chartData = useMemo(() => {
    const days = 7;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const count = letters.filter(letter => {
        if (!letter.createdAt) return false;
        const letterDate = format(new Date(letter.createdAt), 'yyyy-MM-dd');
        return letterDate === dateStr;
      }).length;
      
      data.push({
        date: format(date, 'dd MMM', { locale: id }),
        fullDate: format(date, 'dd MMMM yyyy', { locale: id }),
        count,
      });
    }
    
    return data;
  }, [letters]);

  // Pie chart data
  const pieData = useMemo(() => {
    return [
      { name: 'Draft', value: stats.draft, color: COLORS.DRAFT },
      { name: 'Menunggu', value: stats.pending, color: COLORS.PENDING },
      { name: 'Revisi', value: stats.revision, color: COLORS.REVISION },
      { name: 'Selesai', value: stats.completed, color: COLORS.COMPLETED },
      { name: 'Ditolak', value: stats.rejected, color: COLORS.REJECTED },
    ].filter(item => item.value > 0);
  }, [stats]);

  const isLoading = isLoadingLetters || isLoadingMasterData;

  // --------------------------------------------------------------------------
  // UI AREA - Apple Style Implementation
  // --------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] p-4 space-y-4">
        <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
                <Skeleton className="h-5 w-40 rounded-lg" />
                <Skeleton className="h-3 w-28 rounded-lg" />
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px] bg-white/50" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-[24px] bg-white/50" />
            <Skeleton className="h-64 rounded-[24px] bg-white/50" />
        </div>
      </div>
    );
  }

  // Helper component for Master Data "App Icons"
  const MasterDataTile = ({ icon: Icon, label, count, colorClass, bgClass, href }: any) => (
    <Link href={href} className="block group">
      <div className="relative overflow-hidden bg-white rounded-[20px] p-3.5 h-full transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] hover:scale-[1.03] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/60 shadow-sm">
        <div className="flex flex-col h-full justify-between">
            <div className={`w-9 h-9 rounded-xl ${bgClass} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${colorClass}`} strokeWidth={2.5} />
            </div>
            <div>
                <div className="text-2xl font-bold text-[#1D1D1F] tracking-tight group-hover:text-black transition-colors">
                    {count}
                </div>
                <div className="text-[11px] font-semibold text-[#86868B] flex items-center gap-1 group-hover:text-[#1D1D1F] transition-colors">
                    {label}
                    <ChevronRight className="w-2.5 h-2.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                </div>
            </div>
        </div>
      </div>
    </Link>
  );

  // Helper for Stat Widget
  const StatWidget = ({ icon: Icon, label, count, subLabel, color, iconBg, href }: any) => {
    const content = (
      <div className="bg-white rounded-[24px] p-4 border border-white/60 shadow-sm relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 cursor-pointer">
         <div className="flex items-start justify-between mb-3">
            <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}>
               <Icon className={`w-4 h-4 ${color}`} />
            </div>
            {/* Decorative blurry blob */}
            <div className={`absolute -top-4 -right-4 w-20 h-20 ${iconBg} rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity`} />
         </div>
         <div>
           <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wide mb-1">{label}</div>
           <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-[#1D1D1F] tracking-tighter">{count}</span>
              <span className="text-[11px] font-medium text-[#86868B]">{subLabel}</span>
           </div>
         </div>
      </div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans selection:bg-blue-100 selection:text-blue-900 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 py-6 md:px-6 md:py-8">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
                <LayoutDashboard className="w-3.5 h-3.5 text-[#86868B]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">Control Center</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
              Hello, {userName}
            </h1>
            <p className="text-base text-[#86868B] mt-1.5 font-medium">
              Berikut adalah apa yang terjadi di sistem Anda hari ini.
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 bg-white/80 backdrop-blur-md border border-white/50 px-4 py-2 rounded-full shadow-sm flex items-center gap-2.5">
             <div className="w-1.5 h-1.5 rounded-full bg-[#34C759] animate-pulse" />
             <span className="text-xs font-semibold text-[#1D1D1F]">
                {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
             </span>
          </div>
        </div>

        {/* --- Master Data Grid (Bento Box Style) --- */}
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">Master Data</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <MasterDataTile 
                    href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/dashboard/master/user`}
                    icon={Users} 
                    label="Users" 
                    count={masterDataStats.totalUsers} 
                    colorClass="text-[#007AFF]" 
                    bgClass="bg-[#E1F0FF]"
                />
                <MasterDataTile 
                    href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/dashboard/master/mahasiswa`}
                    icon={UserCog} 
                    label="Mahasiswa" 
                    count={masterDataStats.totalMahasiswa} 
                    colorClass="text-[#FF2D55]" 
                    bgClass="bg-[#FFEDF1]"
                />
                <MasterDataTile 
                    href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/dashboard/master/pegawai`}
                    icon={Briefcase} 
                    label="Pegawai" 
                    count={masterDataStats.totalPegawai} 
                    colorClass="text-[#FF9500]" 
                    bgClass="bg-[#FFF5E0]"
                />
                <MasterDataTile 
                    href={withBasePath("/dashboard/master/departemen")}
                    icon={Building2} 
                    label="Departemen" 
                    count={masterDataStats.totalDepartemen} 
                    colorClass="text-[#5856D6]" 
                    bgClass="bg-[#EFEEFC]"
                />
                <MasterDataTile 
                    href={withBasePath("/dashboard/master/program-studi")}
                    icon={GraduationCap} 
                    label="Prodi" 
                    count={masterDataStats.totalProdi} 
                    colorClass="text-[#34C759]" 
                    bgClass="bg-[#E4F9E9]"
                />
                <MasterDataTile 
                    href={withBasePath("/dashboard/master/role")}
                    icon={Shield} 
                    label="Roles" 
                    count={masterDataStats.totalRole} 
                    colorClass="text-[#AF52DE]" 
                    bgClass="bg-[#F6E6FC]"
                />
                <MasterDataTile 
                    href={withBasePath("/dashboard/master/surat-type")}
                    icon={FileBadge} 
                    label="Tipe Surat" 
                    count={masterDataStats.totalLetterType} 
                    colorClass="text-[#00C7BE]" 
                    bgClass="bg-[#E0F9F8]"
                />
            </div>
        </div>

        {/* --- Letter Statistics & Charts (Mix Layout) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left Column: KPI Widgets (Span 4) */}
            <div className="lg:col-span-4 space-y-4">
                <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight px-1">Overview Surat</h2>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                    {/* Total */}
                    <Link href={withBasePath("/dashboard/surat")} className="col-span-2">
                      <div className="bg-[#1D1D1F] text-white rounded-[24px] p-5 shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                          <div className="relative z-10">
                              <div className="flex items-center gap-2 mb-3 text-white/60">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-xs font-semibold uppercase tracking-wider">Total Surat</span>
                              </div>
                              <div className="text-4xl font-bold tracking-tighter mb-1">{stats.total}</div>
                              <div className="text-xs text-white/50 font-medium">Dokumen terdata dalam sistem</div>
                          </div>
                          {/* Abstract Circle Decoration */}
                          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
                      </div>
                    </Link>

                    <StatWidget 
                        icon={Clock}
                        label="Menunggu Proses"
                        count={stats.pending}
                        subLabel="surat"
                        color="text-[#007AFF]"
                        iconBg="bg-[#E1F0FF]"
                        href={withBasePath("/dashboard/surat?status=PENDING,PROCESSING")}
                    />

                    <StatWidget 
                        icon={AlertCircle}
                        label="Perlu Revisi"
                        count={stats.revision}
                        subLabel="surat"
                        color="text-[#FF9500]"
                        iconBg="bg-[#FFF5E0]"
                        href={withBasePath("/dashboard/surat?status=REVISION")}
                    />

                    <StatWidget 
                        icon={CheckCircle2}
                        label="Selesai"
                        count={stats.completed}
                        subLabel="surat"
                        color="text-[#34C759]"
                        iconBg="bg-[#E4F9E9]"
                        href={withBasePath("/dashboard/surat?status=COMPLETED")}
                    />
                </div>
            </div>

            {/* Right Column: Charts (Span 8) */}
            <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between px-1">
                     <h2 className="text-lg font-bold text-[#1D1D1F] tracking-tight">Analitik & Grafik</h2>
                     {/* <button className="text-xs font-semibold text-[#007AFF] hover:text-[#0051A8] transition-colors">
                        View Details
                     </button> */}
                </div>
                
                {/* Main Chart Container - Glassmorphism Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-1 border border-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)]">
                    <div className="h-full w-full rounded-[28px] bg-white/40 p-4 md:p-5">
                        <DashboardChartsWrapper chartData={chartData} pieData={pieData} />
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}