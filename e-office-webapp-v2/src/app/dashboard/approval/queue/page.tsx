'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Empty } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { useApprovalQueue } from '@/hooks/api/useApprovalQueue';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Loader2, 
  FileText, 
  AlertCircle, 
  Search,
  Eye,
  Clock
} from 'lucide-react';
import { useAuthStore } from '@/stores';

const getStepLabel = (step: number | null): string => {
  if (!step) return '-';
  const stepMap: Record<number, string> = {
    1: 'Dosen Pembimbing',
    2: 'Dosen Koordinator',
    3: 'Ketua Program Studi',
    4: 'Admin Fakultas',
    5: 'Supervisor Akademik',
    6: 'Manajer TU',
    7: 'Wakil Dekan 1',
    8: 'UPA',
  };
  return stepMap[step] || `Step ${step}`;
};

export default function ApprovalQueuePage() {
  const router = useRouter();
  const { letters, isLoading, error, activeRole, refetch } = useApprovalQueue();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLetters = useMemo(() => {
    return letters.filter((letter) => {
      const matchesSearch = 
        !searchQuery ||
        letter.values?.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        letter.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        letter.letterType?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [letters, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!activeRole) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Anda tidak memiliki role sebagai approver. Halaman ini hanya untuk user dengan role approver.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center text-[16px] text-[#86868B] mb-[32px] font-lexend">
          <span className="text-[#86868B]">Dashboard</span>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <span className="font-medium text-[#1D1D1F]">Antrian Approval</span>
        </div>

        {/* Header */}
        <div className="mb-[32px]">
          <h1 className="font-lexend font-bold text-[30px] leading-[36px] tracking-[-0.5px] text-[#1D1D1F] mb-2">
            Antrian Approval
          </h1>
          <p className="font-lexend font-normal text-[16px] leading-[24px] text-[#86868B]">
            Daftar surat yang menunggu persetujuan Anda{activeRole && letters.length > 0 && ` sebagai ${getStepLabel(letters[0]?.currentStep || null)}`}
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <Input
              placeholder="Cari surat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-[#E5E5E7] focus:border-[#0071E3]"
            />
          </div>
        </div>

        {/* Table */}
        {filteredLetters.length === 0 ? (
          <Card className="bg-white border-[#E5E5E7] shadow-sm">
            <CardContent className="p-12">
              <Empty
                icon={<FileText className="w-12 h-12 text-[#86868B]/50" />}
                title="Tidak ada surat"
                description={searchQuery ? "Tidak ada surat yang sesuai dengan pencarian Anda." : "Tidak ada surat yang menunggu persetujuan Anda saat ini."}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-[#E5E5E7] shadow-sm">
            <CardHeader className="border-b border-[#E5E5E7]">
              <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                Surat Menunggu Approval ({filteredLetters.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[#E5E5E7] hover:bg-transparent">
                    <TableHead className="text-[13px] font-medium text-[#86868B]">Nama Pemohon</TableHead>
                    <TableHead className="text-[13px] font-medium text-[#86868B]">Jenis Surat</TableHead>
                    <TableHead className="text-[13px] font-medium text-[#86868B]">Step</TableHead>
                    <TableHead className="text-[13px] font-medium text-[#86868B]">Tanggal</TableHead>
                    <TableHead className="text-[13px] font-medium text-[#86868B] text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLetters.map((letter) => {
                    const values = letter.values as Record<string, any>;
                    return (
                      <TableRow 
                        key={letter.id} 
                        className="border-b border-[#E5E5E7] hover:bg-[#F5F5F7] transition-colors"
                      >
                        <TableCell className="text-[14px] text-[#1D1D1F]">
                          {values.namaLengkap || letter.createdBy?.name || '-'}
                        </TableCell>
                        <TableCell className="text-[14px] text-[#1D1D1F]">
                          {letter.letterType?.name || 'PKL'}
                        </TableCell>
                        <TableCell className="text-[14px] text-[#86868B]">
                          {getStepLabel(letter.currentStep)}
                        </TableCell>
                        <TableCell className="text-[14px] text-[#86868B]">
                          {format(new Date(letter.createdAt), 'dd MMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/approval/${letter.id}`)}
                            className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7] hover:border-[#0071E3]"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
