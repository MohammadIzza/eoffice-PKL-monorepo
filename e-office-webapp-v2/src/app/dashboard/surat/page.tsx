'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function SuratListPage() {
  const mockLetters = [
    {
      id: '1',
      type: 'PKL',
      status: 'PENDING',
      createdAt: '2026-01-15',
      currentStep: 2,
    },
    {
      id: '2',
      type: 'PKL',
      status: 'REVISION',
      createdAt: '2026-01-10',
      currentStep: 1,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daftar Surat</h1>
          <p className="text-gray-600 mt-1">Kelola pengajuan surat Anda</p>
        </div>
        <Link href="/dashboard/pengajuan/pkl/identitas">
          <Button>+ Buat Pengajuan Baru</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {mockLetters.map((letter) => (
          <Card key={letter.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Surat Keterangan {letter.type}</CardTitle>
                  <CardDescription>
                    Diajukan: {new Date(letter.createdAt).toLocaleDateString('id-ID')}
                  </CardDescription>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  letter.status === 'PENDING' 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {letter.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Step {letter.currentStep} dari 8
                </p>
                <Link href={`/dashboard/surat/${letter.id}`}>
                  <Button variant="outline" size="sm">
                    Lihat Detail
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
