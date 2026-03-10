import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { withBasePath } from '@/lib/navigation';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
        </p>
        <Button asChild size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 gap-2 font-medium">
          <Link href={withBasePath('/dashboard')}>
            <Home className="w-5 h-5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
