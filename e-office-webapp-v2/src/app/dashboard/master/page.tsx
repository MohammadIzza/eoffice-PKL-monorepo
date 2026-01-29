'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MasterDataPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/master/departemen');
  }, [router]);

  return (
    <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-[#E5E5E7] rounded animate-pulse mb-4" />
        <div className="h-4 w-96 bg-[#E5E5E7] rounded animate-pulse" />
      </div>
    </div>
  );
}
