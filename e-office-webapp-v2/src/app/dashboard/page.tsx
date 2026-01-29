'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores';
import { useMyLetters, useApprovalQueue } from '@/hooks/api';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { DashboardChartsWrapper } from '@/components/features/dashboard/DashboardChartsWrapper';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const COLORS = {
  DRAFT: '#94a3b8',
  PENDING: '#3b82f6',
  PROCESSING: '#3b82f6',
  REVISION: '#f97316',
  COMPLETED: '#22c55e',
  REJECTED: '#ef4444',
  CANCELLED: '#ef4444',
};

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuthStore();
  const isMahasiswa = user?.roles?.some(r => r.name === 'mahasiswa');
  const isApprover = user?.roles?.some(role => 
    ['dosen_pembimbing', 'dosen_koordinator', 'ketua_program_studi', 'admin_fakultas', 
     'supervisor_akademik', 'manajer_tu', 'wakil_dekan_1', 'upa'].includes(role.name)
  );
  
  // Use different hooks based on role
  const myLettersData = useMyLetters();
  const approvalQueueData = useApprovalQueue();
  
  // Select data based on role
  const { letters, isLoading: lettersLoading, hasLetterInProgress } = isMahasiswa 
    ? myLettersData 
    : { ...approvalQueueData, hasLetterInProgress: false };

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

  if (authLoading || lettersLoading) {
    return (
      <div className="container mx-auto p-5 space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-8 py-10 max-w-7xl">
        {/* Header Section - Apple Style */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-4xl font-semibold text-[#1D1D1F] mb-2 tracking-tight">Dashboard</h1>
              <p className="text-base text-[#86868B]">
                Selamat datang kembali, <span className="font-medium text-[#1D1D1F]">{user?.name || 'Pengguna'}</span>
              </p>
            </div>
            <div className="flex gap-3">
              {isMahasiswa && (
                hasLetterInProgress ? (
                  <Button className="gap-2" size="default" disabled variant="secondary" title="Ada surat sedang diproses">
                    <Plus className="w-4 h-4" />
                    Buat Pengajuan Baru
                  </Button>
                ) : (
                  <Link href="/dashboard/pengajuan/pkl/identitas">
                    <Button className="gap-2" size="default">
                      <Plus className="w-4 h-4" />
                      Buat Pengajuan Baru
                    </Button>
                  </Link>
                )
              )}
              {isApprover && (
                <Link href="/dashboard/approval/queue">
                  <Button className="gap-2" size="default">
                    <ClipboardList className="w-4 h-4" />
                    Antrian Approval
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bento Grid Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <Card className="bg-white border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[#86868B] mb-3">
                  <FileText className="w-4 h-4" />
                  Total Surat
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-[#1D1D1F] tracking-tight">{stats.total}</p>
                  <span className="text-sm text-[#86868B]">surat</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[#86868B] mb-3">
                  <Clock className="w-4 h-4 text-[#0071E3]" />
                  Menunggu
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-[#0071E3] tracking-tight">{stats.pending}</p>
                  <span className="text-sm text-[#86868B]">surat</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[#86868B] mb-3">
                  <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
                  Selesai
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-[#34C759] tracking-tight">{stats.completed}</p>
                  <span className="text-sm text-[#86868B]">surat</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[#86868B] mb-3">
                  <AlertCircle className="w-4 h-4 text-[#FF9500]" />
                  Revisi
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-[#FF9500] tracking-tight">{stats.revision}</p>
                  <span className="text-sm text-[#86868B]">surat</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bento Grid Charts Section - Dynamic Import */}
        <DashboardChartsWrapper chartData={chartData} pieData={pieData} />

        {/* Quick Actions - Apple Style */}
        <div className="flex items-center gap-4 animate-slide-up">
          <Link href="/dashboard/surat" className="flex-1">
            <Card className="border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <CardContent className="p-6">
                <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-0 hover:bg-transparent">
                  <FileText className="w-5 h-5 text-[#0071E3]" />
                  <div className="text-left">
                    <div className="font-semibold text-base text-[#1D1D1F] tracking-tight">Lihat Semua Surat</div>
                    <div className="text-sm text-[#86868B] font-normal">Kelola semua surat Anda</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
