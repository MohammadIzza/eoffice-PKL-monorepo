// src/app/pengajuan/pkl/detail-pengajuan/page.tsx

import React from "react";
import Navbar from "@/components/features/pkl/Navbar";
import Step2Detail from "@/components/features/pkl/Step2Detail";

export default function PageDetail() {
  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] font-sans text-[#111418]">
      <Navbar />
      <Step2Detail />
    </div>
  );
}