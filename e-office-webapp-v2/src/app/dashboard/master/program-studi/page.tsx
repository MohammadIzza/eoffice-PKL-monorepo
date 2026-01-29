'use client';

import { MasterPlaceholder } from '@/components/features/master/MasterPlaceholder';
import { GraduationCap } from 'lucide-react';

export default function MasterProgramStudiPage() {
  return (
    <MasterPlaceholder
      title="Program Studi"
      description="Kelola data program studi."
      icon={GraduationCap}
    />
  );
}
