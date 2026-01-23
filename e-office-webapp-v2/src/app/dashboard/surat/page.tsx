'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useMyLetters } from '@/hooks/api';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'PENDING':
    case 'PROCESSING':
      return 'bg-yellow-100 text-yellow-800';
    case 'REVISION':
      return 'bg-orange-100 text-orange-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-blue-100 text-blue-800';
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-gray-900 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Memuat daftar surat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
            <p className="mt-2 text-gray-700">{error}</p>
            <Button onClick={refetch} className="mt-4">
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daftar Surat</h1>
          <p className="text-gray-600 mt-1">
            {isMahasiswa ? 'Kelola pengajuan surat Anda' : 'Kelola semua surat'}
          </p>
        </div>
        {isMahasiswa && (
          <Link href="/dashboard/pengajuan/pkl/identitas">
            <Button>+ Buat Pengajuan Baru</Button>
          </Link>
        )}
      </div>

      {letters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 text-lg">Belum ada surat</p>
            {isMahasiswa && (
              <Link href="/dashboard/pengajuan/pkl/identitas" className="mt-4 inline-block">
                <Button>Buat Pengajuan Baru</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {letters.map((letter) => {
            const letterTypeName = letter.letterType?.name || 'PKL';
            const createdAt = letter.createdAt 
              ? format(new Date(letter.createdAt), 'dd MMMM yyyy', { locale: id })
              : '-';
            const currentStep = letter.currentStep || 0;
            const totalSteps = 10;
            const letterNumber = letter.letterNumber || letter.numbering?.numberString || null;

            return (
              <Card key={letter.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Surat {letterTypeName}</CardTitle>
                      <CardDescription>
                        Diajukan: {createdAt}
                        {letterNumber && (
                          <span className="ml-2">• No: {letterNumber}</span>
                        )}
                      </CardDescription>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(letter.status)}`}>
                      {getStatusLabel(letter.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-gray-600">
                        Step {currentStep} dari {totalSteps}
                      </p>
                      {letter.values?.namaLengkap && (
                        <p className="text-xs text-gray-500">
                          Pemohon: {letter.values.namaLengkap}
                        </p>
                      )}
                      {letter.createdBy?.name && !letter.values?.namaLengkap && (
                        <p className="text-xs text-gray-500">
                          Pemohon: {letter.createdBy.name}
                        </p>
                      )}
                    </div>
                    <Link href={`/dashboard/surat/${letter.id}`}>
                      <Button variant="outline" size="sm">
                        Lihat Detail
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
