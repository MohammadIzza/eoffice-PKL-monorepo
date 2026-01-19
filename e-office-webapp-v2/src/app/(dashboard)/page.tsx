'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Selamat datang, {user?.name || 'Mahasiswa'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card Pengajuan PKL */}
        <Card>
          <CardHeader>
            <CardTitle>Pengajuan PKL</CardTitle>
            <CardDescription>
              Ajukan surat keterangan PKL baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/pengajuan/pkl/identitas">
              <Button className="w-full">Buat Pengajuan Baru</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card Daftar Surat */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Surat</CardTitle>
            <CardDescription>
              Lihat status pengajuan surat Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/surat">
              <Button variant="outline" className="w-full">
                Lihat Semua Surat
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Pengajuan</CardTitle>
            <CardDescription>
              Surat dalam proses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-600 mt-1">Surat menunggu approval</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
