'use client';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Calendar, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function LetterTable() {
  const letters = [
    {
      id: "SM/2023/08/123",
      type: "Surat Pengantar",
      sender: "Kiki",
      prodi: "Informatika",
      date: "15 Agu 2025",
      currentTo: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
    {
      id: "SI/2023/08/045",
      type: "Surat Pengantar",
      sender: "Irvino Kent",
      prodi: "Informatika",
      date: "14 Agu 2023",
      currentTo: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
    {
      id: "SK/2023/08/012",
      type: "Surat Pengantar",
      sender: "Fatih",
      prodi: "Informatika",
      date: "12 Agu 2023",
      currentTo: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
    {
      id: "SI/2023/08/044",
      type: "Surat Pengantar",
      sender: "Ivan",
      prodi: "Informatika",
      date: "11 Agu 2023",
      currentTo: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
     {
      id: "SM/2023/08/122",
      type: "Surat Pengantar",
      sender: "Doglas",
      prodi: "Informatika",
      date: "10 Agu 2023",
      currentTo: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
  ];

  return (
    <div className="flex flex-col gap-[20px]">
        <div className="w-full bg-[#FFFFFF] rounded-[16px] border border-[#E2E8F0] overflow-hidden flex flex-col">
      {/* HEADER: Judul & Filter */}
      <div className="flex flex-col xl:flex-row justify-between xl:items-center px-[24px] py-[20px] gap-4">
        {/* Title */}
        <div className="font-lexend font-semibold text-[20px] leading-[28px] tracking-[-0.5px] text-[#0F172A]">
           Semua Surat
        </div>
        
        {/* Filter Tools */}
        <div className="flex flex-wrap items-center gap-[8px]">
           {/* Search Bar */}
           <div className="relative w-full sm:w-[257px] h-[38px]">
             <Search className="absolute left-[12px] top-[11px] h-[16px] w-[16px] text-[#64748B]" />
             <input 
               placeholder="Cari surat..." 
               className="w-full h-full pl-[36px] pr-[16px] py-[9px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-[12px] text-[14px] font-lexend text-[#0F172A] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
             />
           </div>

           {/* Rentang Tanggal */}
           <Popover>
             <PopoverTrigger asChild>
                <button className="h-[46px] w-[175px] px-[14px] py-[8px] bg-white border border-[#CBD5E1] rounded-[12px] flex items-center gap-[8px] hover:bg-gray-50">
                    <Calendar className="w-[18px] h-[18px] text-[#334155]" />
                    <span className="font-lexend font-medium text-[14px] leading-[20px] text-[#334155]">Rentang Tanggal</span>
                </button>
             </PopoverTrigger>
             <PopoverContent className="w-auto p-0">
               <CalendarComponent mode="range" />
             </PopoverContent>
           </Popover>

           {/* Status */}
           <Select>
              <SelectTrigger className="w-[101px] h-[46px] px-[14px] py-[8px] border border-[#CBD5E1] rounded-[12px] flex items-center gap-[8px] bg-white text-[#334155] focus:ring-0">
                 <div className="flex items-center gap-2">
                    <div className="w-[18px] h-[18px] border-2 border-[#334155] rounded-[3px] flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#334155]"></div>
                    </div>
                    <span className="font-lexend font-medium text-[14px] leading-[20px]">Status</span>
                 </div>
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">Semua</SelectItem>
                 <SelectItem value="pending">Pending</SelectItem>
                 <SelectItem value="approved">Disetujui</SelectItem>
              </SelectContent>
           </Select>
        </div>
      </div>

      {/* TABLE HEADER Title Row (Background Gray) */}
      <div className="w-full h-[59px] bg-[#F8FAFC] border-y border-[#E2E8F0] flex items-center px-[24px]">
          {/* Custom Header with specific widths/flex could go here, but consistent table layout is better */}
          <table className="w-full text-left">
             <thead>
                <tr>
                   <th className="w-[15%] py-3 font-lexend font-medium text-[12px] uppercase text-[#64748B]">ID/AGENDA</th>
                   <th className="w-[15%] py-3 font-lexend font-medium text-[12px] uppercase text-[#64748B]">SURAT</th>
                   <th className="w-[20%] py-3 font-lexend font-medium text-[12px] uppercase text-[#64748B]">PENGIRIM/PEMOHON</th>
                   <th className="w-[15%] py-3 font-lexend font-medium text-[12px] uppercase text-[#64748B]">PRODI</th>
                   <th className="w-[15%] py-3 font-lexend font-medium text-[12px] uppercase text-[#64748B]">TANGGAL DITERIMA</th>
                   <th className="w-[15%] py-3 font-lexend font-medium text-[12px] uppercase text-[#64748B]">TUJUAN SAAT INI</th>
                   <th className="w-[15%] py-3 font-lexend font-medium text-[12px] uppercase text-[#64748B]">STATUS</th>
                   <th className="w-[5%]  py-3 font-lexend font-medium text-[12px] uppercase text-[#64748B]">AKSI</th>
                </tr>
             </thead>
          </table>
      </div>

      {/* TABLE BODY (Content) */}
      <div className="w-full bg-white px-[24px]">
         <table className="w-full text-left border-collapse">
            <tbody>
              {letters.map((letter) => (
                <tr key={letter.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-[24px] font-lexend font-semibold text-[14px] text-[#0F172A] w-[15%] align-top">{letter.id}</td>
                  <td className="py-[24px] w-[15%] align-top">
                     <span className="inline-flex items-center px-[10px] py-[4px] rounded-[4px] text-[12px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                       {letter.type}
                     </span>
                  </td>
                  <td className="py-[24px] font-lexend font-semibold text-[14px] text-[#0F172A] w-[20%] align-top">{letter.sender}</td>
                  <td className="py-[24px] font-lexend font-medium text-[14px] text-[#0F172A] w-[15%] align-top">{letter.prodi}</td>
                  <td className="py-[24px] font-lexend font-normal text-[14px] text-[#64748B] w-[15%] align-top">{letter.date}</td>
                  <td className="py-[24px] font-lexend font-normal text-[14px] text-[#64748B] w-[15%] align-top">{letter.currentTo}</td>
                  <td className="py-[24px] w-[15%] align-top">
                      {/* Status Custom Badge - Matched Image (Gray Dot + Text) */}
                      <div className="flex items-start gap-[8px]">
                         <div className="w-[8px] h-[8px] rounded-full bg-[#94A3B8] mt-[6px]"></div>
                         <div className="font-lexend font-normal text-[14px] text-[#64748B] leading-[20px]">
                            {letter.status.replace(' ', '\n')}
                         </div>
                      </div>
                  </td>
                  <td className="py-[24px] w-[5%] align-center text-right">
                     <button className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                       <Eye className="w-[18px] h-[18px] text-[#64748B] group-hover:text-[#0F172A]" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
      </div>
      
      </div>

      {/* FOOTER PAGINATION */}
      <div className="w-full h-auto flex items-center justify-between pt-[5px]">
        <div className="font-lexend text-[14px] leading-[20px] text-[#64748B]">
           Showing <span className="font-semibold text-[#0F172A]">1-5</span> of <span className="font-semibold text-[#0F172A]">100</span>
        </div>
        
        <div className="flex items-center gap-[6px]">
          <button className="h-[36px] w-[36px] flex items-center justify-center rounded-[8px] border border-[#CBD5E1] bg-white text-[#64748B] hover:bg-gray-50 transition-colors disabled:opacity-50">
             <ChevronLeft className="h-[20px] w-[20px]" />
          </button>
          
          <div className="flex gap-[6px]">
             <button className="h-[36px] w-[36px] flex items-center justify-center rounded-[8px] bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-lexend font-semibold text-[14px]">
               1
             </button>
             <button className="h-[36px] w-[36px] flex items-center justify-center rounded-[8px] bg-white text-[#64748B] border border-[#CBD5E1] font-lexend font-normal text-[14px] hover:bg-gray-50 transition-colors">
               2
             </button>
             <button className="h-[36px] w-[36px] flex items-center justify-center rounded-[8px] bg-white text-[#64748B] border border-[#CBD5E1] font-lexend font-normal text-[14px] hover:bg-gray-50 transition-colors">
               3
             </button>
          </div>

          <button className="h-[36px] w-[36px] flex items-center justify-center rounded-[8px] border border-[#CBD5E1] bg-white text-[#64748B] hover:bg-gray-50 transition-colors">
             <ChevronRight className="h-[20px] w-[20px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
