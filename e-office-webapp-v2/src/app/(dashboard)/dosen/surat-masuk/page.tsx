'use client';

import Sidebar from "@/components/features/dashboard/Sidebar";
import FilterSurat from "@/components/features/dashboard/dosen/surat-masuk/FilterSurat";
import TabelSuratMasuk from "@/components/features/dashboard/dosen/surat-masuk/TabelSuratMasuk";

export default function SuratMasukPage() {
  return (
    <div className="flex min-h-[calc(100vh-75px)]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-[#F8FAFC]">
        {/* Breadcrumb Area */}
        <div className="flex items-center text-[16px] text-[#64748B] mb-[32px] font-lexend">
          <span className="text-[#64748B]">Surat masuk</span>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <span className="font-medium text-[#0F172A]">Penerima</span>
        </div>

        {/* Header */}
        <div className="mb-[32px]">
          <h1 className="font-lexend font-bold text-[30px] leading-[36px] tracking-[-0.5px] text-[#0F172A]">
            Penerima
          </h1>
          <p className="font-lexend font-normal text-[16px] leading-[24px] text-[#64748B] mt-[8px]">
            Penerima
          </p>
        </div>

        <div className="space-y-[24px]">
          {/* Filter Section - Background Putih */}
          <FilterSurat />

          {/* Table Section - Background Abu-abu */}
          <TabelSuratMasuk />
        </div>
      </div>
    </div>
  );
}
