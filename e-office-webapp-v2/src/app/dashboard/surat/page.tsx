'use client';

import { useState, useMemo } from 'react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Empty } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { useMyLetters } from '@/hooks/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Loader2, 
  FileText, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw,
  Eye,
  Search,
  Filter,
  X
} from 'lucide-react';
import { useAuthStore } from '@/stores';

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'DRAFT':
      return 'text-muted-foreground';
    case 'PENDING':
    case 'PROCESSING':
      return 'text-primary';
    case 'REVISION':
      return 'text-orange-600';
    case 'COMPLETED':
      return 'text-green-600';
    case 'REJECTED':
    case 'CANCELLED':
      return 'text-destructive';
    default:
      return 'text-foreground';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case 'REJECTED':
    case 'CANCELLED':
      return <XCircle className="w-3.5 h-3.5" />;
    case 'PENDING':
    case 'PROCESSING':
      return <Clock className="w-3.5 h-3.5" />;
    default:
      return <FileText className="w-3.5 h-3.5" />;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PENDING':
      return 'Menunggu';
    case 'PROCESSING':
      return 'Diproses';
    case 'REVISION':
      return 'Revisi';
    case 'COMPLETED':
      return 'Selesai';
    case 'REJECTED':
      return 'Ditolak';
    case 'CANCELLED':
      return 'Dibatalkan';
    default:
      return status;
  }
};

export default function SuratListPage() {
  const { letters, isLoading, error, refetch } = useMyLetters();
  const { user } = useAuthStore();
  const isMahasiswa = user?.roles?.some(r => r.name === 'mahasiswa');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter letters
  const filteredLetters = useMemo(() => {
    return letters.filter((letter) => {
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        letter.letterType?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        letter.values?.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        letter.createdBy?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        letter.letterNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        letter.numbering?.numberString?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || letter.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [letters, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLetters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLetters = filteredLetters.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-5 space-y-5">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          {isMahasiswa && <Skeleton className="h-9 w-36" />}
        </div>
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <div className="flex gap-3">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-28" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-5">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertTitle className="text-sm">Terjadi Kesalahan</AlertTitle>
          <AlertDescription className="mt-1.5 text-xs">
            {error}
          </AlertDescription>
          <Button onClick={refetch} variant="outline" size="sm" className="mt-3 text-xs h-8">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Coba Lagi
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Daftar Surat
          </h1>
          <p className="text-sm text-muted-foreground">
            {isMahasiswa ? 'Kelola pengajuan surat Anda' : 'Kelola semua surat'}
          </p>
        </div>
        {isMahasiswa && (
          <Link href="/dashboard/pengajuan/pkl/identitas">
            <Button size="default" className="gap-2">
              <Plus className="w-4 h-4" />
              Buat Pengajuan Baru
            </Button>
          </Link>
        )}
      </div>

      <Separator />

      {/* Content */}
      {letters.length === 0 ? (
        <Card className="shadow-sm">
          <Empty
            icon={<FileText className="w-12 h-12 text-muted-foreground/50" />}
            title="Belum ada surat"
            description={
              isMahasiswa
                ? 'Mulai dengan membuat pengajuan surat baru untuk memulai proses persuratan.'
                : 'Belum ada surat yang tersedia.'
            }
            action={
              isMahasiswa ? (
                <Link href="/dashboard/pengajuan/pkl/identitas">
                  <Button size="default" className="gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    Buat Pengajuan Baru
                  </Button>
                </Link>
              ) : null
            }
          />
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b py-3">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={isMahasiswa ? "Cari surat atau nomor..." : "Cari surat, nomor, atau pemohon..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
                  <Filter className="w-3.5 h-3.5 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING">Menunggu</SelectItem>
                  <SelectItem value="PROCESSING">Diproses</SelectItem>
                  <SelectItem value="REVISION">Revisi</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                  <SelectItem value="REJECTED">Ditolak</SelectItem>
                  <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLetters.length === 0 ? (
              <Empty
                icon={<FileText className="w-10 h-10 text-muted-foreground/50" />}
                title="Tidak ada surat ditemukan"
                description="Coba ubah filter atau kata kunci pencarian Anda."
                action={
                  (searchQuery || statusFilter !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                      }}
                    >
                      Reset Filter
                    </Button>
                  )
                }
              />
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                      <TableHead className="font-semibold text-foreground text-center w-[180px] text-xs py-2.5">Jenis Surat</TableHead>
                      <TableHead className="font-semibold text-foreground text-center w-[160px] text-xs py-2.5">Nomor Surat</TableHead>
                      {!isMahasiswa && (
                        <TableHead className="font-semibold text-foreground text-center w-[200px] text-xs py-2.5">Pemohon</TableHead>
                      )}
                      <TableHead className="font-semibold text-foreground text-center w-[140px] text-xs py-2.5">Tanggal</TableHead>
                      <TableHead className="font-semibold text-foreground text-center w-[180px] text-xs py-2.5">Progress</TableHead>
                      <TableHead className="font-semibold text-foreground text-center w-[130px] text-xs py-2.5">Status</TableHead>
                      <TableHead className="font-semibold text-foreground text-center w-[100px] text-xs py-2.5">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLetters.map((letter, index) => {
                      const letterTypeName = letter.letterType?.name || 'PKL';
                      const createdAt = letter.createdAt 
                        ? format(new Date(letter.createdAt), 'dd MMM yyyy', { locale: id })
                        : '-';
                      const currentStep = letter.currentStep || 0;
                      const totalSteps = 10;
                      const letterNumber = letter.letterNumber || letter.numbering?.numberString || '-';
                      const applicantName = letter.values?.namaLengkap || letter.createdBy?.name || '-';
                      const progressPercentage = (currentStep / totalSteps) * 100;

                      return (
                        <TableRow 
                          key={letter.id} 
                          className="hover:bg-muted/50 transition-colors duration-150 border-b border-border/50"
                        >
                          <TableCell className="py-3 w-[180px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-medium text-foreground text-xs">Surat {letterTypeName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 w-[160px]">
                            <div className="flex items-center justify-center">
                              {letterNumber !== '-' ? (
                                <span className="text-foreground font-mono text-xs whitespace-nowrap">
                                  {letterNumber}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                          {!isMahasiswa && (
                            <TableCell className="py-3 w-[200px]">
                              <div className="flex items-center justify-center gap-1.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-primary text-[10px] font-semibold">
                                    {applicantName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-foreground font-medium text-xs truncate">{applicantName}</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="py-3 w-[140px]">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-foreground font-medium text-xs">{createdAt}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {letter.createdAt && format(new Date(letter.createdAt), 'HH:mm', { locale: id })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 w-[180px]">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex items-center justify-between text-[10px] w-full">
                                <span className="text-muted-foreground font-medium">Step</span>
                                <span className="text-foreground font-bold">
                                  {currentStep}/{totalSteps}
                                </span>
                              </div>
                              <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 w-[130px]">
                            <div className={`flex items-center justify-center gap-1 font-medium text-xs ${getStatusColor(letter.status)}`}>
                              {getStatusIcon(letter.status)}
                              <span className="whitespace-nowrap">{getStatusLabel(letter.status)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 w-[100px]">
                            <div className="flex items-center justify-center">
                              <Link href={`/dashboard/surat/${letter.id}`}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="gap-1.5 h-8 hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Detail</span>
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {/* Pagination */}
            {filteredLetters.length > itemsPerPage && (
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Menampilkan <span className="font-semibold text-foreground">{startIndex + 1}</span>-
                    <span className="font-semibold text-foreground">{Math.min(endIndex, filteredLetters.length)}</span> dari{' '}
                    <span className="font-semibold text-foreground">{filteredLetters.length}</span> surat
                    {(searchQuery || statusFilter !== 'all') && (
                      <span className="text-muted-foreground"> ({letters.length} total)</span>
                    )}
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer min-w-[36px]"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
            {filteredLetters.length <= itemsPerPage && (searchQuery || statusFilter !== 'all') && filteredLetters.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                Menampilkan {filteredLetters.length} dari {letters.length} surat
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
