'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores';
import { useMyLetters } from '@/hooks/api';
import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
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
  const { letters, isLoading: lettersLoading } = useMyLetters();
  const isMahasiswa = user?.roles?.some(r => r.name === 'mahasiswa');

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
            {isMahasiswa && (
              <Link href="/dashboard/pengajuan/pkl/identitas">
                <Button className="gap-2" size="default">
                  <Plus className="w-4 h-4" />
                  Buat Pengajuan Baru
                </Button>
              </Link>
            )}
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

        {/* Bento Grid Charts Section */}
        <div className="grid lg:grid-cols-12 gap-4 mb-8 animate-slide-up">
          {/* Bar Chart - Takes more space */}
          <Card className="lg:col-span-8 border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b border-[rgba(0,0,0,0.08)] pb-5 px-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-1.5 tracking-tight text-[#1D1D1F]">
                    <TrendingUp className="w-5 h-5 text-[#0071E3]" />
                    Tren Pengajuan 7 Hari Terakhir
                  </CardTitle>
                  <CardDescription className="text-sm text-[#86868B]">
                    Jumlah surat yang diajukan per hari
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#86868B' }}
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#86868B' }}
                    stroke="rgba(0,0,0,0.1)"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      padding: '12px',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#1D1D1F' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#0071E3"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Takes less space */}
          <Card className="lg:col-span-4 border border-[rgba(0,0,0,0.08)] shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b border-[rgba(0,0,0,0.08)] pb-5 px-6 pt-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 mb-1.5 tracking-tight text-[#1D1D1F]">
                <BarChart3 className="w-5 h-5 text-[#0071E3]" />
                Distribusi Status
              </CardTitle>
              <CardDescription className="text-sm text-[#86868B]">
                Persentase surat berdasarkan status
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 px-6 pb-6">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => `${(((percent ?? 0) * 100)).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        padding: '12px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.04)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }}
                      iconType="circle"
                      layout="vertical"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-[#86868B] text-sm">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
