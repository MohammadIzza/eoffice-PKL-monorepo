'use client';

import { MasterPlaceholder } from '@/components/features/master/MasterPlaceholder';
import { Shield } from 'lucide-react';

export default function MasterRolePage() {
  return (
    <MasterPlaceholder
      title="Role"
      description="Kelola role dan permission."
      icon={Shield}
    />
  );
}
