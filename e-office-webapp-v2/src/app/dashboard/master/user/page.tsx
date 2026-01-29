'use client';

import { MasterPlaceholder } from '@/components/features/master/MasterPlaceholder';
import { Users } from 'lucide-react';

export default function MasterUserPage() {
  return (
    <MasterPlaceholder
      title="User"
      description="Kelola akun pengguna."
      icon={Users}
    />
  );
}
