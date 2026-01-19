import React from "react";
import Navbar from "@/components/features/pkl/Navbar";
import Breadcrumbs from "@/components/features/pkl/Breadcrumbs";
import Step4Review from "@/components/features/pkl/Step4Review"; // Kita buat sebentar lagi

export default function PageReview() {
  return (
    <div className="min-h-screen w-full bg-[#F2F2F2] font-sans text-[#111418]">
      <Navbar />
      <Breadcrumbs pageName="Review & Ajukan" />
      <main className="w-full">
         <Step4Review />
      </main>
    </div>
  );
}