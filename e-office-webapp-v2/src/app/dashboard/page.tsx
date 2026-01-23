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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section - Clean and Professional */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Selamat datang kembali, <span className="font-medium text-foreground">{user?.name || 'Pengguna'}</span>
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

        {/* Integrated Stats Section - Single Card with Grid */}
        <Card className="mb-8 border shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  Total Surat
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  <span className="text-xs text-muted-foreground">surat</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Menunggu
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-primary">{stats.pending}</p>
                  <span className="text-xs text-muted-foreground">surat</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Selesai
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  <span className="text-xs text-muted-foreground">surat</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Revisi
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-orange-600">{stats.revision}</p>
                  <span className="text-xs text-muted-foreground">surat</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section - Asymmetric Layout */}
        <div className="grid lg:grid-cols-12 gap-6 mb-8">
          {/* Bar Chart - Takes more space */}
          <Card className="lg:col-span-8 border shadow-sm">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Tren Pengajuan 7 Hari Terakhir
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Jumlah surat yang diajukan per hari
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '12px',
                      padding: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#1e293b' }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Takes less space */}
          <Card className="lg:col-span-4 border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-primary" />
                Distribusi Status
              </CardTitle>
              <CardDescription className="text-xs">
                Persentase surat berdasarkan status
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
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
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        padding: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Minimalist */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/surat" className="flex-1">
            <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" size="default">
              <FileText className="w-4 h-4" />
              <div className="text-left">
                <div className="font-medium text-sm">Lihat Semua Surat</div>
                <div className="text-xs text-muted-foreground font-normal">Kelola semua surat Anda</div>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
