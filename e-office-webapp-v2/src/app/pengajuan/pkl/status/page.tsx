import React from "react";
// Perhatikan: Kita tidak pakai Navbar/Breadcrumbs lama karena layoutnya beda (ada Sidebar)
import Step5Status from "@/components/features/pkl/Step5Status";

export default function PageStatus() {
  return (
    // Background #F3F3F3 sesuai spek
    <div className="min-h-screen w-full bg-[#F3F3F3] font-sans text-[#111418]">
       <Step5Status />
    </div>
  );
}