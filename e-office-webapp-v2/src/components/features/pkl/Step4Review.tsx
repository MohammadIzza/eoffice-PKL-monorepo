"use client";
import Link from "next/link";
import React from "react";
import Stepper from "@/components/features/pkl/Stepper";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown, FileText, Image as ImageIcon } from "lucide-react";

export default function Step4Review() {

  // --- HELPER COMPONENT: ROW DATA (Supaya kodingan rapi tidak berulang) ---
  const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <div className="w-full flex justify-between items-center py-[16px] px-[24px] border-b border-[#E5E7EB] last:border-b-0">
      {/* Label: Inter Regular 14px, Color #4B5563 */}
      <div className="w-[30%] font-inter font-normal text-[14px] leading-[21px] text-[#4B5563]">
        {label}
      </div>
      {/* Value: Inter Regular/Medium 14px, Color #1F2937 */}
      <div className="w-[70%] font-inter font-medium text-[14px] leading-[20px] text-[#1F2937] text-right sm:text-left">
        {value}
      </div>
    </div>
  );

  // --- STYLE VARIABLES ---
  const cardBaseClass = "w-full bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden";
  const headerSectionClass = "w-full px-[24px] py-[16px] border-b border-[#E5E7EB] bg-white";
  const headerTitleClass = "font-inter font-semibold text-[18px] leading-[28px] text-[#111827]";

  return (
    // MAIN WRAPPER
    <div className="w-full max-w-[1117px] mx-auto flex flex-col items-center gap-[30px] pt-[48px] pb-[122px] px-[16px]">
      
      {/* 1. HEADER TEXT */}
      <div className="w-full max-w-[1085px] flex flex-col gap-[8px] items-start">
         {/* Judul: Inter Black 30px */}
         <h1 className="text-[30px] leading-[37.5px] font-black tracking-[-0.99px] text-[#111418] font-inter">
            Review Surat
         </h1>
         {/* Deskripsi: Inter Regular 16px, Color #4B5563 */}
         <p className="text-[16px] leading-[24px] font-normal text-[#4B5563] font-inter">
            Mohon periksa kembali seluruh data yang telah Anda masukkan sebelum mengajukan surat.
         </p>
      </div>

      {/* 2. STEPPER (Active Step 4) */}
      <div className="w-full max-w-[1085px]">
         <Stepper currentStep={4} />
      </div>

      {/* 3. CONTENT AREA */}
      <div className="w-full max-w-[1085px] flex flex-col gap-[20px]">
        
        {/* === SECTION A: IDENTITAS PENGAJU === */}
        <div className={cardBaseClass}>
          <div className={headerSectionClass}>
            <h3 className={headerTitleClass}>Identitas Pengaju</h3>
          </div>
          <div className="flex flex-col">
            <ReviewRow label="Nama Lengkap" value="Ahmad Syaifullah" />
            <ReviewRow label="NIM" value="24060121130089" />
            <ReviewRow label="Role" value="Mahasiswa" />
            <ReviewRow label="Departemen" value="Informatika" />
            <ReviewRow label="Program Studi" value="S1 - Informatika" />
            <ReviewRow label="Tempat Lahir" value="Blora" />
            <ReviewRow label="Tanggal Lahir" value="03 / 18 / 2006" />
            <ReviewRow label="No. HP" value="081234567890" />
            <ReviewRow label="Alamat" value="Jl. Prof. Soedarto, Tembalang, Semarang" />
            <ReviewRow label="IPK" value="3.85" />
            <ReviewRow label="SKS" value="105" />
          </div>
        </div>

        {/* === SECTION B: DETAIL SURAT PENGAJUAN === */}
        <div className={cardBaseClass}>
          <div className={headerSectionClass}>
            <h3 className={headerTitleClass}>Detail Surat Pengajuan</h3>
          </div>
          <div className="flex flex-col">
            <ReviewRow label="Jenis Surat" value="AK015 / Surat Pengantar PKL" />
            <ReviewRow label="Keperluan" value="Skripsi / surat admisi untuk PKL" />
            <ReviewRow label="Tujuan Surat" value="Pimp. HRD PT XYZ" />
            <ReviewRow label="Jabatan" value="Manajer" />
            <ReviewRow label="Nama Instansi" value="PT XYZ" />
            <ReviewRow label="Alamat Instansi" value="Semarang" />
            <ReviewRow label="Judul" value="Analisis Sistem Informasi Persediaan Barang di PT XYZ" />
            <ReviewRow label="Nama Dosen Pembimbing" value="Pak Indra Waspada" />
            <ReviewRow label="NIP Dosen Pembimbing" value="1987010123456789" />
            <ReviewRow label="Dosen Koordinator" value="PKL" />
            <ReviewRow label="Nama Dosen Koordinator" value="Pak Satriyo" />
            <ReviewRow label="NIP Dosen Koordinator" value="1980050512345678" />
            <ReviewRow label="Nama Kaprodi" value="Pak Aris Sugiharto" />
            <ReviewRow label="NIP Kaprodi" value="1975090912345678" />
          </div>
        </div>

        {/* === SECTION C: CHECKLIST KESIAPAN (HIJAU) === */}
        {/* BG: #F0FDF4, Border: #BBF7D0 */}
        <div className="w-full bg-[#F0FDF4] border border-[#BBF7D0] rounded-[12px] p-[24px] flex flex-col gap-[14px]">
           <h3 className="font-inter font-semibold text-[18px] leading-[28px] text-[#14532D]">
             Checklist Kesiapan
           </h3>
           <div className="flex flex-col gap-[12px]">
             {/* Item 1 */}
             <div className="flex items-center gap-[12px]">
                <CheckCircle2 className="w-[20px] h-[20px] text-[#16A34A]" />
                <span className="font-inter font-medium text-[14px] text-[#14532D]">Data inti lengkap</span>
             </div>
             {/* Item 2 */}
             <div className="flex items-center gap-[12px]">
                <CheckCircle2 className="w-[20px] h-[20px] text-[#16A34A]" />
                <span className="font-inter font-medium text-[14px] text-[#14532D]">Lampiran utama ada</span>
             </div>
           </div>
        </div>

        {/* === SECTION D: LAMPIRAN PREVIEW === */}
        <div className="w-full bg-white rounded-[12px] p-[32px] border border-[#E5E7EB] shadow-sm flex flex-col gap-[24px]">
           <h3 className="font-inter font-bold text-[20px] leading-[28px] text-[#0F172A]">
             Lampiran
           </h3>

           {/* FILE 1: PROPOSAL */}
           <div className="w-full flex flex-col">
              <div className="flex justify-between items-center py-2 border-b border-[#E5E7EB] mb-4">
                 <span className="font-inter font-bold text-[16px] text-[#0F172A]">File Proposal.pdf</span>
                 <ChevronDown className="w-5 h-5 text-gray-500" />
              </div>
              {/* Image Container (Sesuai spek height 1021px, tapi kita set max-h-screen/auto agar tidak kepanjangan di layar demo) */}
              <div className="w-full h-auto bg-[#6FA586] rounded-[8px] p-8 flex items-center justify-center overflow-hidden">
                 {/* Placeholder Preview (Hijau sesuai screenshot) */}
                 <div className="w-[500px] h-[700px] bg-white shadow-2xl flex flex-col p-8">
                    <div className="w-full h-4 bg-gray-200 mb-4 rounded"></div>
                    <div className="w-2/3 h-4 bg-gray-200 mb-8 rounded"></div>
                    <div className="w-full h-2 bg-gray-100 mb-2 rounded"></div>
                    <div className="w-full h-2 bg-gray-100 mb-2 rounded"></div>
                    <div className="w-full h-2 bg-gray-100 mb-2 rounded"></div>
                    {/* Mockup Text Lines */}
                 </div>
              </div>
           </div>

           {/* FILE 2: KTM */}
           <div className="w-full flex flex-col mt-8">
              <div className="flex justify-between items-center py-2 border-b border-[#E5E7EB] mb-4">
                 <span className="font-inter font-bold text-[16px] text-[#0F172A]">KTM.jpg</span>
                 <ChevronDown className="w-5 h-5 text-gray-500" />
              </div>
              <div className="w-full h-auto bg-[#6FA586] rounded-[8px] p-8 flex items-center justify-center overflow-hidden">
                 <div className="w-[500px] h-[300px] bg-white shadow-2xl flex items-center justify-center">
                    <span className="text-gray-400 font-bold text-xl">KTM PREVIEW</span>
                 </div>
              </div>
           </div>

        </div>

      </div>

    {/* 4. BUTTONS */}
        <div className="w-full max-w-[1085px] flex justify-between items-center mt-2">
            <Button variant="outline" className="h-11 px-6 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 rounded-[8px]">
            Kembali
            </Button>
            <div className="flex gap-4">
            <Button variant="outline" className="h-11 px-6 border-[#137fec] text-[#137fec] font-bold hover:bg-blue-50 rounded-[8px]">
                Simpan Draft
            </Button>
                
            {/* TOMBOL FINAL: DILINK KE HALAMAN STATUS (STEP 5) */}
            <Button asChild className="h-11 px-6 bg-[#0079BD] text-white font-bold hover:bg-blue-700 rounded-[8px] cursor-pointer">
                <Link href="/pengajuan/pkl/status">
                Ajukan Permohonan
                </Link>
            </Button>
            </div>
        </div>
    </div>
  );
}