'use client';

import { Eye } from "lucide-react";

export default function TabelSuratMasuk() {
  const letters = [
    {
      id: "1",
      no: "1.",
      surat: "Surat Pengantar",
      pemohon: "Ahmad Douglas",
      prodi: "Informatika",
      tanggal: "15 Agu 2023",
      tujuan: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
    {
      id: "2",
      no: "2.",
      surat: "Surat Pengantar",
      pemohon: "Dr. Budi Santoso, M.Kom",
      prodi: "Informatika",
      tanggal: "14 Agu 2023",
      tujuan: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
    {
      id: "3",
      no: "3.",
      surat: "Surat Pengantar",
      pemohon: "Totok",
      prodi: "Informatika",
      tanggal: "12 Agu 2023",
      tujuan: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
    {
      id: "4",
      no: "4.",
      surat: "Surat Pengantar",
      pemohon: "Ani Wijayanti (Mahasiswa)",
      prodi: "Informatika",
      tanggal: "11 Agu 2023",
      tujuan: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
     {
      id: "5",
      no: "5.",
      surat: "Surat Pengantar",
      pemohon: "Himpunan Mahasiswa Biologi",
      prodi: "Informatika",
      tanggal: "10 Agu 2023",
      tujuan: "Dosen Pembimbing",
      status: "Menunggu Verifikasi",
    },
  ];

  return (
    <>
      {/* Tabel */}
      <div className="w-auto bg-[#FFFFFF] rounded-[12px] border border-[#E2E8F0] overflow-hidden">
        <div className="w-full overflow-auto">
          <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <tr>
              <th className="px-[16px] py-[12px] text-left text-[11px] font-semibold font-lexend text-[#64748B] uppercase tracking-wide">ID/AGENDA</th>
              <th className="px-[16px] py-[12px] text-left text-[11px] font-semibold font-lexend text-[#64748B] uppercase tracking-wide">SURAT</th>
              <th className="px-[16px] py-[12px] text-left text-[11px] font-semibold font-lexend text-[#64748B] uppercase tracking-wide">PENGIRIM/PEMOHON</th>
              <th className="px-[16px] py-[12px] text-left text-[11px] font-semibold font-lexend text-[#64748B] uppercase tracking-wide">PRODI</th>
              <th className="px-[16px] py-[12px] text-left text-[11px] font-semibold font-lexend text-[#64748B] uppercase tracking-wide">TANGGAL DITERIMA</th>
              <th className="px-[16px] py-[12px] text-left text-[11px] font-semibold font-lexend text-[#64748B] uppercase tracking-wide">TUJUAN SAAT INI</th>
              <th className="px-[16px] py-[12px] text-left text-[11px] font-semibold font-lexend text-[#64748B] uppercase tracking-wide">STATUS</th>
              <th className="px-[16px] py-[12px] text-left text-[11px] font-semibold font-lexend text-[#64748B] uppercase tracking-wide">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {letters.map((letter) => (
              <tr key={letter.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-[16px] py-[16px] text-[14px] font-medium font-lexend text-[#0F172A]">{letter.no}</td>
                <td className="px-[16px] py-[16px]">
                  <span className="inline-flex items-center px-[10px] py-[4px] rounded-[8px] text-[12px] font-medium font-lexend bg-[#EBF5FF] text-[#2563EB]">
                    {letter.surat}
                  </span>
                </td>
                <td className="px-[16px] py-[16px] text-[14px] font-lexend text-[#0F172A]">{letter.pemohon}</td>
                <td className="px-[16px] py-[16px] text-[14px] font-lexend text-[#0F172A]">{letter.prodi}</td>
                <td className="px-[16px] py-[16px] text-[14px] font-lexend text-[#64748B]">{letter.tanggal}</td>
                <td className="px-[16px] py-[16px] text-[14px] font-lexend text-[#64748B]">{letter.tujuan}</td>
                <td className="px-[16px] py-[16px]">
                  <div className="flex items-center gap-[8px]">
                    <div className="h-[8px] w-[8px] rounded-full bg-[#94A3B8]"></div>
                    <span className="text-[14px] font-lexend text-[#64748B]">{letter.status}</span>
                  </div>
                </td>
                <td className="px-[16px] py-[16px]">
                  <button className="p-[8px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[8px] transition-colors">
                    <Eye className="h-[18px] w-[18px]" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination - Terpisah dari tabel */}
      <div className="w-auto flex items-center justify-between mt-[20px]">
        <div className="text-[14px] font-lexend text-[#64748B]">
          Showing <span className="font-medium text-[#0F172A]">1-5</span> of <span className="font-medium text-[#0F172A]">100</span>
        </div>
        <div className="flex items-center gap-[8px]">
          <button 
            disabled
            className="px-[12px] py-[8px] text-[14px] font-lexend border border-[#E2E8F0] rounded-[8px] text-[#CBD5E1] bg-white cursor-not-allowed"
          >
            ‹
          </button>
          <button className="px-[12px] py-[8px] text-[14px] font-lexend bg-[#3B82F6] text-white rounded-[8px] hover:bg-[#2563EB]">
            1
          </button>
          <button className="px-[12px] py-[8px] text-[14px] font-lexend border border-[#E2E8F0] rounded-[8px] text-[#0F172A] bg-white hover:bg-[#F8FAFC]">
            2
          </button>
          <button className="px-[12px] py-[8px] text-[14px] font-lexend border border-[#E2E8F0] rounded-[8px] text-[#0F172A] bg-white hover:bg-[#F8FAFC]">
            3
          </button>
          <button className="px-[12px] py-[8px] text-[14px] font-lexend border border-[#E2E8F0] rounded-[8px] text-[#0F172A] bg-white hover:bg-[#F8FAFC]">
            ›
          </button>
        </div>
      </div>
    </>
  );
}
