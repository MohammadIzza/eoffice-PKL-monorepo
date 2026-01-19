import React from "react";
import Navbar from "@/components/features/pkl/Navbar";
import Breadcrumbs from "@/components/features/pkl/Breadcrumbs";
import Step3Lampiran from "@/components/features/pkl/Step3Lampiran"; 

export default function PageLampiran() {
  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] font-sans text-[#111418]">
      <Navbar />
      <Breadcrumbs pageName="Lampiran" />
      <main className="w-full">
         <Step3Lampiran />
      </main>
    </div>
  );
}