'use client';

import { MasterPlaceholder } from '@/components/features/master/MasterPlaceholder';
import { UserCog } from 'lucide-react';

export default function MasterMahasiswaPage() {
  return (
    <MasterPlaceholder
      title="Mahasiswa"
      description="Kelola data mahasiswa."
      icon={UserCog}
    />
  );
}
