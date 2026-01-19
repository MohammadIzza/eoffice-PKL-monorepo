"use client";

import React, { useState } from "react";
import Navbar from "@/components/features/pkl/Navbar"; // Pakai Navbar yang sudah ada
import { 
  LayoutDashboard, 
  Mail, 
  ChevronDown, 
  Clock, 
  User, 
  FileText, 
  ChevronUp,
  Inbox,
  Send,
  Archive,
  File
} from "lucide-react";

export default function Step5Status() {

  // --- HELPER COMPONENTS ---

  // 1. Row Data (Tabel Identitas & Detail)
  const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-start py-[12px] px-[24px] border-b border-[#F1F5F9] last:border-0 hover:bg-gray-50 transition-colors">
      <div className="w-[35%] font-inter font-normal text-[14px] leading-[21px] text-[#64748B]">
        {label}
      </div>
      <div className="w-[65%] font-inter font-medium text-[14px] leading-[21px] text-[#1E293B]">
        {value}
      </div>
    </div>
  );

  // 2. Timeline Item (Riwayat Surat)
  const TimelineItem = ({ 
    role, 
    time, 
    status, 
    note, 
    isLast = false 
  }: { role: string, time: string, status: string, note?: string, isLast?: boolean }) => (
    <div className="flex w-full relative">
      {/* Garis Vertikal (Absolute biar rapi) */}
      {!isLast && (
        <div className="absolute left-[5px] top-[18px] w-[2px] h-full bg-[#E2E8F0] -z-10" />
      )}
      
      {/* Dot & Content */}
      <div className="flex gap-[16px] w-full pb-[32px]">
        {/* Dot Icon */}
        <div className="w-[12px] h-[12px] rounded-full bg-[#CBD5E1] mt-[6px] shrink-0 border-[2px] border-white ring-1 ring-[#E2E8F0]" />
        
        {/* Text Content */}
        <div className="flex flex-col gap-[4px]">
           {/* Role */}
           <span className="font-inter font-semibold text-[14px] text-[#0F172A]">{role}</span>
           {/* Time */}
           <div className="flex items-center gap-1 text-[#64748B] text-[12px]">
              <Clock className="w-3 h-3" />
              <span>{time}</span>
           </div>
           {/* Status Badge */}
           <div className="mt-1">
             <span className="bg-[#F1F5F9] text-[#1E293B] px-2 py-1 rounded-[4px] text-[12px] font-medium border border-[#E2E8F0]">
               Status: {status}
             </span>
           </div>
           {/* Catatan */}
           <p className="text-[12px] text-[#64748B] mt-1">
             Catatan: <span className="text-[#334155]">{note || "Tidak ada catatan"}</span>
           </p>
        </div>
      </div>
    </div>
  );

  // 3. Lampiran Accordion Item
  const LampiranItem = ({ title, filename }: { title: string, filename: string }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
      <div className="w-full border-b border-[#E2E8F0] last:border-0 pb-6 mb-6">
        <div 
          className="flex justify-between items-center cursor-pointer mb-4"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="font-inter font-bold text-[16px] text-[#0F172A]">{filename}</span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
        
        {isOpen && (
           <div className="w-full h-[500px] bg-[#6FA586] rounded-[8px] flex items-center justify-center p-8 shadow-inner">
              {/* Mockup Kertas Putih di dalam Hijau */}
              <div className="w-[300px] h-[400px] bg-white shadow-2xl rounded-[2px] p-6 flex flex-col gap-3">
                 <div className="h-3 w-1/3 bg-gray-200 mb-4" />
                 <div className="h-2 w-full bg-gray-100" />
                 <div className="h-2 w-full bg-gray-100" />
                 <div className="h-2 w-full bg-gray-100" />
                 <div className="h-2 w-3/4 bg-gray-100" />
                 <div className="h-20 w-full bg-gray-50 mt-4 border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                    Document Content
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* 1. NAVBAR FIXED (Sesuai Gambar Disposisi ada Navbar Biru) */}
      <Navbar />

      <div className="flex w-full max-w-[1920px] mx-auto pt-[0px]"> 
        {/* Padding top 0 karena Navbar komponen kita relative/static, kalau fixed butuh pt */}

        {/* === SIDEBAR KIRI (Width ~260px) === */}
        <aside className="w-[260px] bg-white border-r border-[#E2E8F0] min-h-[calc(100vh-64px)] hidden lg:flex flex-col py-6 sticky top-0">
           
           {/* Menu Items */}
           <div className="flex flex-col gap-1 px-3">
              <div className="flex items-center gap-3 px-3 py-2 text-[#64748B] hover:bg-[#F1F5F9] rounded-[6px] cursor-pointer">
                 <LayoutDashboard className="w-5 h-5" />
                 <span className="font-inter font-medium text-[14px]">Dasbor</span>
              </div>

              {/* Surat Masuk (Expanded) */}
              <div className="flex flex-col">
                 <div className="flex items-center justify-between px-3 py-2 text-[#0F172A] bg-[#F1F5F9] rounded-[6px] cursor-pointer font-medium">
                    <div className="flex items-center gap-3">
                       <Inbox className="w-5 h-5" />
                       <span className="font-inter text-[14px]">Surat Masuk</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                 </div>
                 {/* Submenu */}
                 <div className="flex flex-col pl-[44px] mt-1 gap-1">
                    <span className="py-2 text-[14px] text-[#64748B] cursor-pointer hover:text-[#0F172A]">Penerima</span>
                    <span className="py-2 text-[14px] text-[#0079BD] font-medium cursor-pointer border-r-2 border-[#0079BD]">Disposisi</span>
                    <span className="py-2 text-[14px] text-[#64748B] cursor-pointer hover:text-[#0F172A]">Tembusan</span>
                    <span className="py-2 text-[14px] text-[#64748B] cursor-pointer hover:text-[#0F172A]">Arsip</span>
                 </div>
              </div>
           </div>
        </aside>

        {/* === MAIN CONTENT KANAN === */}
        <main className="flex-1 p-[32px] bg-[#F8FAFC]">
           
           {/* Breadcrumbs */}
           <div className="flex items-center gap-2 text-[14px] mb-6">
              <span className="text-[#64748B]">Persuratan</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-medium text-[#0F172A]">Detail Surat</span>
           </div>

           {/* Grid Layout (2 Kolom) */}
           <div className="flex flex-col xl:flex-row gap-[24px]">
              
              {/* KOLOM KIRI (DATA & LAMPIRAN) */}
              <div className="flex-1 flex flex-col gap-[24px]">
                 
                 {/* CARD 1: IDENTITAS PENGAJU */}
                 <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm">
                    <div className="px-6 py-4 border-b border-[#E2E8F0]">
                       <h3 className="font-inter font-semibold text-[16px] text-[#0F172A]">Identitas Pengaju</h3>
                    </div>
                    <div>
                       <DetailRow label="Nama Lengkap" value="Ahmad Syaifullah" />
                       <DetailRow label="NIM/NIP" value="24060121130089" />
                       <DetailRow label="Email" value="ahmadsyaifullah@students.undip.ac.id" />
                       <DetailRow label="Departemen" value="Informatika" />
                       <DetailRow label="Program Studi" value="S1 - Informatika" />
                       <DetailRow label="Tempat Lahir" value="Blora" />
                       <DetailRow label="Tanggal Lahir" value="03/18/2006" />
                       <DetailRow label="No HP" value="081234567890" />
                       <DetailRow label="Alamat" value="Jl. Prof. Soedarto, Tembalang, Semarang" />
                       <DetailRow label="IPK" value="3.85" />
                       <DetailRow label="SKS" value="105" />
                    </div>
                 </div>

                 {/* CARD 2: DETAIL SURAT */}
                 <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm">
                    <div className="px-6 py-4 border-b border-[#E2E8F0]">
                       <h3 className="font-inter font-semibold text-[16px] text-[#0F172A]">Detail Surat Pengajuan</h3>
                    </div>
                    <div>
                       <DetailRow label="Jenis Surat" value="AK015 / Surat Pengantar PKL" />
                       <DetailRow label="Keperluan" value="Sebagai syarat administrasi untuk PKL" />
                       <DetailRow label="Tujuan Surat" value="Pimp. HRD PT XYZ" />
                       <DetailRow label="Jabatan" value="Manajer" />
                       <DetailRow label="Nama Instansi" value="PT XYZ" />
                       <DetailRow label="Alamat Instansi" value="Semarang" />
                       <DetailRow label="Judul" value="Analisis Sistem Informasi Persediaan Barang di PT XYZ" />
                       <DetailRow label="Nama Dosen Pembimbing" value="Pak Indra Waspada" />
                       <DetailRow label="NIP Dosen Pembimbing" value="1987010123456789" />
                       <DetailRow label="Dosen Koordinator" value="PKL" />
                       <DetailRow label="Nama Dosen Koordinator" value="Pak Sandy" />
                       <DetailRow label="NIP Dosen Koordinator" value="120099901231" />
                       <DetailRow label="Nama Kaprodi" value="Pak Aris Sugiharto" />
                       <DetailRow label="NIP Kaprodi" value="1975090912345678" />
                    </div>
                 </div>

                 {/* CARD 3: LAMPIRAN (ACCORDION) */}
                 <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm p-6">
                    <h3 className="font-inter font-semibold text-[16px] text-[#0F172A] mb-6">Lampiran</h3>
                    <LampiranItem title="Lampiran 1" filename="File Proposal.pdf" />
                    <LampiranItem title="Lampiran 2" filename="KTM.jpg" />
                 </div>

              </div>

              {/* KOLOM KANAN (RIWAYAT SURAT - TIMELINE) */}
              <div className="w-full xl:w-[400px]">
                 <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm sticky top-[80px]">
                    <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
                       <FileText className="w-4 h-4 text-[#64748B]" />
                       <h3 className="font-inter font-semibold text-[16px] text-[#0F172A]">Riwayat Surat (2)</h3>
                    </div>
                    
                    <div className="p-6">
                       {/* Timeline List */}
                       <div className="flex flex-col">
                          <TimelineItem 
                            role="Admin Surat" 
                            time="09 Desember 2025, 09:58:49" 
                            status="Menunggu Verifikasi" 
                          />
                          <TimelineItem 
                            role="Supervisor Akademik" 
                            time="09 Desember 2025, 09:50:10" 
                            status="Verifikasi Supervisor Akademik" 
                          />
                          <TimelineItem 
                            role="Supervisor Akademik" 
                            time="09 Desember 2025, 09:40:00" 
                            status="Verifikasi Supervisor Akademik" 
                          />
                          <TimelineItem 
                            role="Mahasiswa" 
                            time="09 Desember 2025, 08:30:10" 
                            status="Surat Diajukan" 
                            isLast={true}
                          />
                       </div>
                    </div>
                 </div>
              </div>

           </div>
        </main>
      </div>
    </div>
  );
}