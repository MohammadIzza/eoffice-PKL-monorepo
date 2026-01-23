'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'DRAFT':
      return 'secondary';
    case 'PENDING':
    case 'PROCESSING':
      return 'default';
    case 'REVISION':
      return 'outline';
    case 'COMPLETED':
      return 'default';
    case 'REJECTED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="w-3 h-3" />;
    case 'REJECTED':
    case 'CANCELLED':
      return <XCircle className="w-3 h-3" />;
    case 'PENDING':
    case 'PROCESSING':
      return <Clock className="w-3 h-3" />;
    default:
      return <FileText className="w-3 h-3" />;
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          {isMahasiswa && <Skeleton className="h-10 w-40" />}
        </div>
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Terjadi Kesalahan</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
          </AlertDescription>
          <Button onClick={refetch} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-8 h-8 text-primary" />
            Daftar Surat
          </h1>
          <p className="text-muted-foreground">
            {isMahasiswa ? 'Kelola pengajuan surat Anda' : 'Kelola semua surat'}
          </p>
        </div>
        {isMahasiswa && (
          <Link href="/dashboard/pengajuan/pkl/identitas">
            <Button size="lg" className="gap-2">
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
            icon={<FileText className="w-16 h-16 text-muted-foreground/50" />}
            title="Belum ada surat"
            description={
              isMahasiswa
                ? 'Mulai dengan membuat pengajuan surat baru untuk memulai proses persuratan.'
                : 'Belum ada surat yang tersedia.'
            }
            action={
              isMahasiswa ? (
                <Link href="/dashboard/pengajuan/pkl/identitas">
                  <Button size="lg" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Buat Pengajuan Baru
                  </Button>
                </Link>
              ) : null
            }
          />
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isMahasiswa ? "Cari surat atau nomor..." : "Cari surat, nomor, atau pemohon..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10">
                  <Filter className="w-4 h-4 mr-2" />
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
                icon={<FileText className="w-12 h-12 text-muted-foreground/50" />}
                title="Tidak ada surat ditemukan"
                description="Coba ubah filter atau kata kunci pencarian Anda."
                action={
                  (searchQuery || statusFilter !== 'all') && (
                    <Button
                      variant="outline"
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
                      <TableHead className="font-semibold text-foreground">Jenis Surat</TableHead>
                      <TableHead className="font-semibold text-foreground">Nomor Surat</TableHead>
                      {!isMahasiswa && (
                        <TableHead className="font-semibold text-foreground">Pemohon</TableHead>
                      )}
                      <TableHead className="font-semibold text-foreground">Tanggal</TableHead>
                      <TableHead className="font-semibold text-foreground">Progress</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                      <TableHead className="font-semibold text-foreground text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLetters.map((letter, index) => {
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
                          className={`
                            hover:bg-primary/5 transition-colors duration-150
                            ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                            border-b border-border/50
                          `}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground">Surat {letterTypeName}</span>
                                <span className="text-xs text-muted-foreground">ID: {letter.id.slice(0, 8)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {letterNumber !== '-' ? (
                              <div className="flex items-center gap-2">
                                <div className="px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
                                  <span className="text-primary font-mono text-xs font-semibold">
                                    {letterNumber}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-sm">Belum ada nomor</span>
                            )}
                          </TableCell>
                          {!isMahasiswa && (
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-primary text-xs font-semibold">
                                    {applicantName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-foreground font-medium text-sm">{applicantName}</span>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-foreground font-medium text-sm">{createdAt}</span>
                              <span className="text-xs text-muted-foreground">
                                {letter.createdAt && format(new Date(letter.createdAt), 'HH:mm', { locale: id })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-2 min-w-[120px]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground font-medium">Step</span>
                                <span className="text-foreground font-bold">
                                  {currentStep}/{totalSteps}
                                </span>
                              </div>
                              <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge 
                              variant={getStatusVariant(letter.status)}
                              className="gap-1.5 px-3 py-1.5 text-xs font-semibold shadow-sm"
                            >
                              {getStatusIcon(letter.status)}
                              {getStatusLabel(letter.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <Link href={`/dashboard/surat/${letter.id}`}>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">Detail</span>
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {(searchQuery || statusFilter !== 'all') && filteredLetters.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">
                Menampilkan {filteredLetters.length} dari {letters.length} surat
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
