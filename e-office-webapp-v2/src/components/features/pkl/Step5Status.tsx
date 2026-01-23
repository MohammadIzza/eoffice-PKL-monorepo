"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  ChevronDown, 
  Clock, 
  FileText, 
  ChevronUp,
  Loader2,
  File,
  Download,
  Image as ImageIcon
} from "lucide-react";
import { useLetter } from "@/hooks/api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { API_URL } from "@/lib/constants";

interface Step5StatusProps {
  id?: string;
}

export default function Step5Status({ id: idProp }: Step5StatusProps = {}) {
  const searchParams = useSearchParams();
  const idFromQuery = searchParams.get('id');
  const letterId = idProp || idFromQuery || null;
  const { letter, isLoading, error } = useLetter(letterId);
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({});

  const DetailRow = ({ label, value }: { label: string, value: string | null | undefined }) => (
    <div className="flex justify-between items-start py-[12px] px-[24px] border-b border-[#F1F5F9] last:border-0 hover:bg-gray-50 transition-colors">
      <div className="w-[35%] font-inter font-normal text-[14px] leading-[21px] text-[#64748B]">
        {label}
      </div>
      <div className="w-[65%] font-inter font-medium text-[14px] leading-[21px] text-[#1E293B]">
        {value || '-'}
      </div>
    </div>
  );

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '-';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return format(d, 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const formatDateTime = (date: Date | string | null | undefined): string => {
    if (!date) return '-';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return format(d, 'dd MMMM yyyy, HH:mm:ss', { locale: id });
    } catch {
      return '-';
    }
  };

  const getActionLabel = (action: string): string => {
    const actionMap: Record<string, string> = {
      'SUBMITTED': 'Surat Diajukan',
      'APPROVED': 'Disetujui',
      'REJECTED': 'Ditolak',
      'REVISED': 'Direvisi',
      'SELF_REVISED': 'Direvisi oleh Mahasiswa',
      'RESUBMITTED': 'Dikirim Ulang',
      'SIGNED': 'Ditandatangani',
      'NUMBERED': 'Diberi Nomor',
      'CANCELLED': 'Dibatalkan',
    };
    return actionMap[action] || action;
  };

  const getStatusLabel = (action: string, step: number | null): string => {
    if (action === 'SUBMITTED') return 'Surat Diajukan';
    if (action === 'APPROVED') {
      const stepMap: Record<number, string> = {
        1: 'Disetujui Dosen Pembimbing',
        2: 'Disetujui Dosen Koordinator',
        3: 'Disetujui Ketua Program Studi',
        4: 'Disetujui Admin Fakultas',
        5: 'Disetujui Supervisor Akademik',
        6: 'Disetujui Manajer TU',
        7: 'Ditandatangani Wakil Dekan 1',
        8: 'Diberi Nomor oleh UPA',
      };
      return step ? stepMap[step] || 'Disetujui' : 'Disetujui';
    }
    return getActionLabel(action);
  };

  const getStatusDisplayLabel = (status: string, currentStep: number | null): string => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Draft',
      'PENDING': 'Menunggu',
      'PROCESSING': 'Diproses',
      'REVISION': 'Revisi',
      'COMPLETED': 'Selesai',
      'REJECTED': 'Ditolak',
      'CANCELLED': 'Dibatalkan',
    };
    return statusMap[status] || status;
  };

  const TimelineItem = ({ 
    role, 
    time, 
    status, 
    note, 
    isLast = false 
  }: { role: string, time: string, status: string, note?: string | null, isLast?: boolean }) => (
    <div className="flex w-full relative">
      {!isLast && (
        <div className="absolute left-[5px] top-[18px] w-[2px] h-full bg-[#E2E8F0] -z-10" />
      )}
      <div className="flex gap-[16px] w-full pb-[32px]">
        <div className="w-[12px] h-[12px] rounded-full bg-[#CBD5E1] mt-[6px] shrink-0 border-[2px] border-white ring-1 ring-[#E2E8F0]" />
        <div className="flex flex-col gap-[4px]">
           <span className="font-inter font-semibold text-[14px] text-[#0F172A]">{role}</span>
           <div className="flex items-center gap-1 text-[#64748B] text-[12px]">
              <Clock className="w-3 h-3" />
              <span>{time}</span>
           </div>
           <div className="mt-1">
             <span className="bg-[#F1F5F9] text-[#1E293B] px-2 py-1 rounded-[4px] text-[12px] font-medium border border-[#E2E8F0]">
               {status}
             </span>
           </div>
           {note && (
             <p className="text-[12px] text-[#64748B] mt-1">
               Catatan: <span className="text-[#334155]">{note}</span>
             </p>
           )}
        </div>
      </div>
    </div>
  );

  const toggleAttachment = (attachmentId: string) => {
    setExpandedAttachments(prev => ({
      ...prev,
      [attachmentId]: !prev[attachmentId]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#137FEC] mx-auto mb-4" />
          <p className="text-gray-600">Memuat data surat...</p>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Surat tidak ditemukan'}</p>
          <p className="text-gray-600 text-sm">Pastikan ID surat valid atau surat masih ada.</p>
        </div>
      </div>
    );
  }

  const formValues = letter.values as Record<string, any>;
  const stepHistory = letter.stepHistory || [];
  const attachments = letter.attachments || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="w-full max-w-[1920px] mx-auto pt-[0px]">
        <main className="p-[32px] bg-[#F8FAFC]">
           <div className="flex items-center gap-2 text-[14px] mb-6">
              <span className="text-[#64748B]">Persuratan</span>
              <span className="text-[#CBD5E1]">/</span>
              <span className="font-medium text-[#0F172A]">Detail Surat</span>
           </div>
           <div className="flex flex-col xl:flex-row gap-[24px]">
              <div className="flex-1 flex flex-col gap-[24px]">
                 <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm">
                    <div className="px-6 py-4 border-b border-[#E2E8F0]">
                       <h3 className="font-inter font-semibold text-[16px] text-[#0F172A]">Identitas Pengaju</h3>
                    </div>
                    <div>
                       <DetailRow label="Nama Lengkap" value={formValues.namaLengkap || letter.createdBy?.name} />
                       <DetailRow label="NIM/NIP" value={formValues.nim} />
                       <DetailRow label="Email" value={formValues.email || letter.createdBy?.email} />
                       <DetailRow label="Departemen" value={formValues.departemen} />
                       <DetailRow label="Program Studi" value={formValues.programStudi} />
                       <DetailRow label="Tempat Lahir" value={formValues.tempatLahir} />
                       <DetailRow label="Tanggal Lahir" value={formatDate(formValues.tanggalLahir)} />
                       <DetailRow label="No HP" value={formValues.noHp} />
                       <DetailRow label="Alamat" value={formValues.alamat} />
                       <DetailRow label="IPK" value={formValues.ipk} />
                       <DetailRow label="SKS" value={formValues.sks} />
                    </div>
                 </div>
                 <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm">
                    <div className="px-6 py-4 border-b border-[#E2E8F0]">
                       <h3 className="font-inter font-semibold text-[16px] text-[#0F172A]">Detail Surat Pengajuan</h3>
                    </div>
                    <div>
                       <DetailRow label="Jenis Surat" value={letter.letterType?.name || 'PKL'} />
                       <DetailRow label="Tujuan Surat" value={formValues.tujuanSurat} />
                       <DetailRow label="Jabatan" value={formValues.jabatan} />
                       <DetailRow label="Nama Instansi" value={formValues.namaInstansi} />
                       <DetailRow label="Alamat Instansi" value={formValues.alamatInstansi} />
                       <DetailRow label="Judul" value={formValues.judul} />
                       <DetailRow label="Nama Dosen Koordinator PKL" value={formValues.namaDosenKoordinator} />
                       <DetailRow label="NIP Dosen Koordinator" value={formValues.nipDosenKoordinator} />
                       <DetailRow label="Nama Kaprodi" value={formValues.namaKaprodi} />
                       <DetailRow label="NIP Kaprodi" value={formValues.nipKaprodi} />
                       {(letter.letterNumber || letter.numbering?.numberString) && (
                         <DetailRow label="Nomor Surat" value={letter.letterNumber || letter.numbering?.numberString || '-'} />
                       )}
                       <DetailRow label="Status" value={getStatusDisplayLabel(letter.status, letter.currentStep)} />
                    </div>
                 </div>
                 {attachments.length > 0 && (
                   <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm p-6">
                      <h3 className="font-inter font-semibold text-[16px] text-[#0F172A] mb-6">Lampiran ({attachments.length})</h3>
                      {attachments.map((attachment) => {
                        const isOpen = expandedAttachments[attachment.id];
                        const fileExtension = attachment.filename?.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                        const isPdf = fileExtension === 'pdf';
                        const downloadUrl = `${API_URL}/letter/${letterId}/attachments/${attachment.id}/download`;

                        return (
                          <div key={attachment.id} className="w-full border-b border-[#E2E8F0] last:border-0 pb-6 mb-6">
                            <div 
                              className="flex justify-between items-center cursor-pointer mb-4"
                              onClick={() => toggleAttachment(attachment.id)}
                            >
                              <span className="font-inter font-bold text-[16px] text-[#0F172A]">
                                {attachment.originalName || attachment.filename}
                              </span>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={downloadUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#0079BD] hover:text-blue-700"
                                >
                                  <Download className="w-5 h-5" />
                                </a>
                                {isOpen ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                            
                            {isOpen && (
                              <div className="w-full h-[500px] bg-[#F1F5F9] rounded-[8px] flex items-center justify-center p-8 shadow-inner overflow-hidden">
                                {isImage && (
                                  <img 
                                    src={downloadUrl} 
                                    alt={attachment.originalName || attachment.filename} 
                                    className="max-w-full max-h-full object-contain"
                                  />
                                )}
                                {isPdf && (
                                  <iframe 
                                    src={downloadUrl} 
                                    className="w-full h-full border-none"
                                    title={attachment.originalName || attachment.filename}
                                  />
                                )}
                                {!isImage && !isPdf && (
                                  <div className="text-gray-500 text-center">
                                    <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                    <p>Preview tidak tersedia untuk tipe file ini.</p>
                                    <a 
                                      href={downloadUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-[#0079BD] hover:underline mt-2 block"
                                    >
                                      Unduh untuk melihat
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                   </div>
                 )}
              </div>
              <div className="w-full xl:w-[400px]">
                 <div className="bg-white rounded-[8px] border border-[#E2E8F0] shadow-sm sticky top-[80px]">
                    <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
                       <FileText className="w-4 h-4 text-[#64748B]" />
                       <h3 className="font-inter font-semibold text-[16px] text-[#0F172A]">
                         Riwayat Surat ({stepHistory.length})
                       </h3>
                    </div>
                    <div className="p-6">
                       {stepHistory.length === 0 ? (
                         <p className="text-sm text-gray-500 text-center">Belum ada riwayat</p>
                       ) : (
                         <div className="flex flex-col">
                            {stepHistory.map((history, index) => (
                              <TimelineItem 
                                key={history.id}
                                role={history.actor?.name || history.actorRole || 'System'} 
                                time={formatDateTime(history.createdAt)} 
                                status={getStatusLabel(history.action, history.step)} 
                                note={history.comment}
                                isLast={index === stepHistory.length - 1}
                              />
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
}
