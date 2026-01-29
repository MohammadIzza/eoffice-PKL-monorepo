'use client';

import { MasterPlaceholder } from '@/components/features/master/MasterPlaceholder';
import { Building2 } from 'lucide-react';

export default function MasterDepartemenPage() {
  return (
    <MasterPlaceholder
      title="Departemen"
      description="Kelola data departemen."
      icon={Building2}
    />
  );
}
