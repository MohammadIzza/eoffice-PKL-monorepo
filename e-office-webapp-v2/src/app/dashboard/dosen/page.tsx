'use client';

import StatsCards from "@/components/features/dashboard/dosen/dashboard/StatsCards";
import VolumeChart from "@/components/features/dashboard/dosen/dashboard/VolumeChart";
import LetterTable from "@/components/features/dashboard/dosen/dashboard/LetterTable";

export default function DosenDashboardPage() {
  return (
    <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
      {/* Breadcrumb Area */}
      <div className="flex items-center text-[16px] text-[#64748B] mb-[32px] font-lexend">
        <span className="text-[#64748B]">Dashboard</span>
        <span className="mx-2 text-[#CBD5E1]">/</span>
        <span className="font-medium text-[#0F172A]">Dashboard Persuratan</span>
      </div>

      {/* Header */}
      <div className="mb-[32px]">
        <h1 className="font-lexend font-bold text-[30px] leading-[36px] tracking-[-0.5px] text-[#0F172A]">
          Dashboard Persuratan
        </h1>
        <p className="font-lexend font-normal text-[16px] leading-[24px] text-[#64748B] mt-[8px]">
          Pusat kendali untuk mengelola semua surat Fakultas Sains dan Matematika.
        </p>
      </div>

      <div className="space-y-[32px]">
        {/* Section 1: Stats */}
        <StatsCards />

        {/* Section 2: Chart */}
        <VolumeChart />

        {/* Section 3: Table */}
        <LetterTable />
      </div>
    </div>
  );
}
