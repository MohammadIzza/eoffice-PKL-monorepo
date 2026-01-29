'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface MasterPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function MasterPlaceholder({ title, description, icon: Icon }: MasterPlaceholderProps) {
  return (
    <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1D1D1F] tracking-tight">{title}</h1>
          <p className="text-[#86868B] mt-1">{description}</p>
        </div>
        <Card className="border-[#E5E5E7] bg-white">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[#0071E3]/10 shrink-0">
                <Icon className="w-6 h-6 text-[#0071E3]" />
              </div>
              <div>
                <h2 className="font-semibold text-[#1D1D1F]">Segera hadir</h2>
                <p className="text-sm text-[#86868B] mt-1">
                  Fitur kelola {title.toLowerCase()} akan tersedia di fase berikutnya.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
