'use client';

import { FileText, CheckCircle, Inbox } from "lucide-react";

export default function StatsCards() {
  return (
    <div className="grid gap-[24px] md:grid-cols-3">
      {/* Card 1: Perlu Tindakan */}
      <div className="w-full bg-[#FFFFFF] rounded-[16px] border border-[#E2E8F0] p-[24px] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[152px]">
        <div className="flex justify-between items-start">
             <div className="font-lexend font-medium text-[14px] leading-[20px] text-[#64748B]">
                Perlu Tindakan
             </div>
             <FileText className="w-[20px] h-[20px] text-[#3B82F6]" />
        </div>
        
        <div>
           <div className="font-lexend font-bold text-[36px] leading-[36px] tracking-[-1px] text-[#0F172A] mb-1">
             20
           </div>
           <div className="font-lexend font-normal text-[14px] leading-[20px] text-[#64748B]">
             surat belum diproses
           </div>
        </div>
      </div>

      {/* Card 2: Selesai */}
      <div className="w-full bg-[#FFFFFF] rounded-[16px] border border-[#E2E8F0] p-[24px] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[152px]">
        <div className="flex justify-between items-start">
             <div className="font-lexend font-medium text-[14px] leading-[20px] text-[#64748B]">
                Selesai (Bulan Ini)
             </div>
             <CheckCircle className="w-[20px] h-[20px] text-[#64748B]" />
        </div>
        
        <div>
           <div className="font-lexend font-bold text-[36px] leading-[36px] tracking-[-1px] text-[#0F172A] mb-1">
             100
           </div>
           <div className="font-lexend font-normal text-[14px] leading-[20px] text-[#64748B]">
             surat telah diarsipkan
           </div>
        </div>
      </div>

      {/* Card 3: Total Surat */}
      <div className="w-full bg-[#FFFFFF] rounded-[16px] border border-[#E2E8F0] p-[24px] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-[152px]">
        <div className="flex justify-between items-start">
             <div className="font-lexend font-medium text-[14px] leading-[20px] text-[#64748B]">
                Total Surat (Bulan Ini)
             </div>
             <Inbox className="w-[20px] h-[20px] text-[#64748B]" />
        </div>
        
        <div>
           <div className="font-lexend font-bold text-[36px] leading-[36px] tracking-[-1px] text-[#0F172A] mb-1">
             120
           </div>
           <div className="font-lexend font-normal text-[14px] leading-[20px] text-[#64748B]">
             total volume bulan ini
           </div>
        </div>
      </div>
    </div>
  );
}
