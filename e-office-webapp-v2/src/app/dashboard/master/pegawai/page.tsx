'use client';

import { MasterPlaceholder } from '@/components/features/master/MasterPlaceholder';
import { Briefcase } from 'lucide-react';

export default function MasterPegawaiPage() {
  return (
    <MasterPlaceholder
      title="Pegawai"
      description="Kelola data pegawai dan dosen."
      icon={Briefcase}
    />
  );
}
