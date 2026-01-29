'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { Card, CardContent } from '@/components/ui/card';
import { Database } from 'lucide-react';

export default function MasterDataPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const isSuperAdmin = user?.roles?.some((r) => r.name === 'superadmin') ?? false;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isSuperAdmin) {
      router.replace('/dashboard');
      return;
    }
  }, [user, isLoading, isSuperAdmin, router]);

  if (isLoading || !user || !isSuperAdmin) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-48 bg-[#E5E5E7] rounded animate-pulse mb-4" />
          <div className="h-4 w-96 bg-[#E5E5E7] rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">Master Data</h1>
          <p className="text-[#86868B] mt-1">
            Kelola data referensi sistem. Surat dan template tidak dikelola di sini.
          </p>
        </div>

        <Card className="border-[#E5E5E7] bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#0071E3]/10 shrink-0">
                <Database className="w-6 h-6 text-[#0071E3]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F]">Modul Master Data</h2>
                <p className="text-sm text-[#86868B] mt-1">
                  Halaman untuk Departemen, Program Studi, User, Mahasiswa, Pegawai, dan Role akan tersedia di fase berikutnya.
                </p>
                <p className="text-sm text-[#86868B] mt-2">
                  Master data jenis surat dan template surat tidak disediakan di sini.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
