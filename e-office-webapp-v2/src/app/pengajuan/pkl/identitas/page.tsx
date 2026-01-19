import React from "react";
import Navbar from "@/components/features/pkl/Navbar"; // Sesuaikan path navbar jika ada
import Step1identitas from "@/components/features/pkl/Step1identitas";

export default function Page() {
  return (
    <div className="min-h-screen w-full bg-[#F2F2F2]">
      {/* Navbar boleh tetap di sini jika bersifat global */}
      <Navbar /> 
      
      {/* Panggil komponen saja. JANGAN nulis Judul/Stepper lagi disini karena sudah ada di dalam Step1identitas */}
      <main className="w-full">
         <Step1identitas />
      </main>
    </div>
  );
}