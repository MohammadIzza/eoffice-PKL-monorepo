"use client";

import React, { useState } from "react";
import Link from "next/link"; // Import Link untuk navigasi
import Stepper from "@/components/features/pkl/Stepper";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Import Icon dari Lucide React
import { UploadCloud, FileText, Image as ImageIcon, Eye, Trash2 } from "lucide-react";

export default function Step3Lampiran() {
  
  // --- STYLE VARIABLES (SESUAI SPEK FIGMA) ---
  
  // 1. CARD CONTAINER
  const cardClass = "w-full bg-white rounded-[12px] border border-[#E5E7EB] p-[24px] flex flex-col items-center gap-[24px]";

  // 2. UPLOAD AREA (DASHED BOX)
  const uploadAreaClass = "w-full max-w-[846px] h-[156px] flex flex-col items-center justify-center border-[2px] border-dashed border-[#E5E7EB] rounded-[8px] bg-[#FAFAFA] cursor-pointer hover:bg-gray-50 transition-colors";

  // 3. FILE ITEM ROW (LIST FILE)
  const fileItemClass = "w-full max-w-[846px] h-[70px] flex items-center justify-between p-[12px] border border-[#E5E7EB] rounded-[8px] bg-white";

  return (
    // MAIN WRAPPER: Width 1085px, Padding Top 48px, Bottom 122px
    <div className="w-full max-w-[1085px] mx-auto flex flex-col items-center gap-[28px] pt-[48px] pb-[122px] px-[16px]">
      
      {/* === HEADER TEXT === */}
      <div className="w-full flex flex-col gap-[8px] items-start">
         <h1 className="text-[30px] leading-[37.5px] font-black tracking-[-0.99px] text-[#111418] font-inter">
            Lampiran
         </h1>
         <p className="text-[16px] leading-[24px] font-normal text-[#617589] font-inter">
            Lampirkan dokumen pendukung yang diperlukan.
         </p>
      </div>

      {/* === STEPPER (Active Step 3) === */}
      <div className="w-full py-[1px] px-[27px]">
         <Stepper currentStep={3} />
      </div>

      {/* === CARD 1: LAMPIRAN UTAMA === */}
      <div className={cardClass}>
        
        {/* Header Section */}
        <div className="w-full max-w-[846px] flex flex-col gap-[4px]">
           <h3 className="font-inter font-semibold text-[18px] leading-[22.5px] text-[#111418]">
              Lampiran Utama<span className="text-[#EF4444]">*</span>
           </h3>
           <p className="font-inter font-normal text-[14px] leading-[21px] text-[#617589]">
              Wajib. Unggah minimal 1 dokumen pendukung utama. Format: PDF, JPG, PNG. Maks: 5MB/file.
           </p>
        </div>

        {/* Upload Area (Dashed Box) */}
        <div className={uploadAreaClass}>
           <div className="w-[48px] h-[48px] rounded-full bg-[#137FEC1A] flex items-center justify-center mb-[12px]">
              <UploadCloud className="w-[24px] h-[24px] text-[#137FEC]" />
           </div>
           
           <div className="text-center">
              <span className="font-inter font-semibold text-[16px] leading-[24px] text-[#111418]">
                Seret & lepas atau <span className="text-[#137FEC]">pilih file</span>
              </span>
           </div>
           
           <span className="font-inter font-normal text-[12px] leading-[16px] text-[#617589] mt-[4px]">
              untuk diunggah
           </span>
        </div>

        {/* LIST FILE YANG SUDAH DIUPLOAD (Dummy Data Sesuai Gambar) */}
        <div className="w-full max-w-[846px] flex flex-col gap-[12px]">
           
           {/* File 1: Proposal PDF */}
           <div className={fileItemClass}>
              <div className="flex items-center gap-[16px]">
                 <div className="w-[40px] h-[40px] rounded-[8px] bg-[#FEE2E2] flex items-center justify-center">
                    <FileText className="w-[20px] h-[20px] text-[#EF4444]" />
                 </div>
                 
                 <div className="flex flex-col">
                    <span className="font-inter font-medium text-[16px] leading-[24px] text-[#111418]">
                       File Proposal.pdf
                    </span>
                    <span className="font-inter font-normal text-[14px] leading-[20px] text-[#617589]">
                       2.1 MB
                    </span>
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-[8px]">
                 <Select defaultValue="file">
                    <SelectTrigger className="w-[128px] h-[36px] rounded-[6px] border border-[#E5E7EB] text-[14px]">
                       <SelectValue placeholder="Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="file">File</SelectItem>
                       <SelectItem value="foto">Foto</SelectItem>
                    </SelectContent>
                 </Select>

                 <button className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#E5E7EB] hover:bg-gray-50 transition-all">
                    <Eye className="w-[20px] h-[20px] text-[#111418]" />
                 </button>

                 <button className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#FEE2E2] hover:bg-[#FEF2F2] transition-all">
                    <Trash2 className="w-[20px] h-[20px] text-[#EF4444]" />
                 </button>
              </div>
           </div>

           {/* File 2: KTM JPG */}
           <div className={fileItemClass}>
              <div className="flex items-center gap-[16px]">
                 <div className="w-[40px] h-[40px] rounded-[8px] bg-[#DBEAFE] flex items-center justify-center">
                    <ImageIcon className="w-[20px] h-[20px] text-[#3B82F6]" />
                 </div>
                 
                 <div className="flex flex-col">
                    <span className="font-inter font-medium text-[16px] leading-[24px] text-[#111418]">
                       KTM.jpg
                    </span>
                    <span className="font-inter font-normal text-[14px] leading-[20px] text-[#617589]">
                       850 KB
                    </span>
                 </div>
              </div>

              <div className="flex items-center gap-[8px]">
                 <Select defaultValue="foto">
                    <SelectTrigger className="w-[128px] h-[36px] rounded-[6px] border border-[#E5E7EB] text-[14px]">
                       <SelectValue placeholder="Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="file">File</SelectItem>
                       <SelectItem value="foto">Foto</SelectItem>
                    </SelectContent>
                 </Select>

                 <button className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#E5E7EB] hover:bg-gray-50 transition-all">
                    <Eye className="w-[20px] h-[20px] text-[#111418]" />
                 </button>

                 <button className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#FEE2E2] hover:bg-[#FEF2F2] transition-all">
                    <Trash2 className="w-[20px] h-[20px] text-[#EF4444]" />
                 </button>
              </div>
           </div>

        </div>
      </div>

      {/* === CARD 2: LAMPIRAN TAMBAHAN (OPSIONAL) === */}
      <div className={cardClass}>
         
         <div className="w-full max-w-[846px] flex flex-col gap-[4px]">
           <h3 className="font-inter font-semibold text-[18px] leading-[22.5px] text-[#111418]">
              Lampiran Tambahan
           </h3>
           <p className="font-inter font-normal text-[14px] leading-[21px] text-[#617589]">
              Opsional. Tambahkan dokumen pendukung lainnya jika diperlukan.
           </p>
        </div>

        {/* Upload Area (Dashed Box) */}
        <div className={uploadAreaClass}>
           <div className="w-[48px] h-[48px] rounded-full bg-[#137FEC1A] flex items-center justify-center mb-[12px]">
              <UploadCloud className="w-[24px] h-[24px] text-[#137FEC]" />
           </div>
           
           <div className="text-center">
              <span className="font-inter font-semibold text-[16px] leading-[24px] text-[#111418]">
                Seret & lepas atau <span className="text-[#137FEC]">pilih file</span>
              </span>
           </div>
           
           <span className="font-inter font-normal text-[12px] leading-[16px] text-[#617589] mt-[4px]">
              untuk diunggah
           </span>
        </div>
      </div>

      {/* === BUTTONS (Navigasi) === */}
      <div className="w-full max-w-[1085px] flex justify-between items-center mt-2">
        <Button variant="outline" className="h-11 px-6 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 rounded-[8px]">
          Kembali
        </Button>
        <div className="flex gap-4">
          <Button variant="outline" className="h-11 px-6 border-[#137fec] text-[#137fec] font-bold hover:bg-blue-50 rounded-[8px]">
            Simpan Draft
          </Button>
          
          {/* TOMBOL LANJUT YANG SUDAH DIAKTIFKAN & DILINK KE REVIEW */}
          <Button asChild className="h-11 px-6 bg-[#0079BD] text-white font-bold hover:bg-blue-700 cursor-pointer rounded-[8px]">
            <Link href="/dashboard/pengajuan/pkl/review">
              Lanjut
            </Link>
          </Button>
        </div>
      </div>

    </div>
  );
}