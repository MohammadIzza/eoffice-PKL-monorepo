"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Stepper from "@/components/features/pkl/Stepper";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { usePKLFormStore } from "@/stores/pklFormStore";
import { useAuthStore } from "@/stores";
import { letterService } from "@/services";
import { format } from "date-fns";

export default function Step4Review() {
  const router = useRouter();
  const { formData, attachments, resetForm } = usePKLFormStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAttachments, setExpandedAttachments] = useState<Record<number, boolean>>({});

  const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <div className="w-full flex justify-between items-center py-[16px] px-[24px] border-b border-[#E5E7EB] last:border-b-0">
      <div className="w-[30%] font-inter font-normal text-[14px] leading-[21px] text-[#4B5563]">
        {label}
      </div>
      <div className="w-[70%] font-inter font-medium text-[14px] leading-[20px] text-[#1F2937] text-right sm:text-left">
        {value || '-'}
      </div>
    </div>
  );

  const cardBaseClass = "w-full bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden";
  const headerSectionClass = "w-full px-[24px] py-[16px] border-b border-[#E5E7EB] bg-white";
  const headerTitleClass = "font-inter font-semibold text-[18px] leading-[28px] text-[#111827]";

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return format(date, 'dd / MM / yyyy');
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-[20px] h-[20px] text-[#EF4444]" />;
    }
    return <ImageIcon className="w-[20px] h-[20px] text-[#3B82F6]" />;
  };

  const toggleAttachment = (index: number) => {
    setExpandedAttachments(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.programStudiId || !formData.dosenPembimbingId) {
      setError('Data tidak lengkap. Silakan kembali ke step sebelumnya.');
      return;
    }

    const utamaFiles = attachments.filter(att => att.category === 'file' || att.category === 'foto');
    if (utamaFiles.length === 0) {
      setError('Minimal 1 lampiran utama wajib diunggah.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submitPayload = {
        prodiId: formData.programStudiId,
        dosenPembimbingUserId: formData.dosenPembimbingId,
        formData: formData,
      };

      const result = await letterService.submitLetter(submitPayload);

      if (attachments.length > 0) {
        try {
          const utamaFiles = attachments.filter(att => att.category === 'file' || att.category === 'foto');
          const tambahanFiles = attachments.filter(att => att.category === 'tambahan');

          if (utamaFiles.length > 0) {
            await letterService.uploadAttachments(
              result.letterId,
              utamaFiles.map(att => att.file),
              'utama'
            );
          }

          if (tambahanFiles.length > 0) {
            await letterService.uploadAttachments(
              result.letterId,
              tambahanFiles.map(att => att.file),
              'tambahan'
            );
          }
        } catch (uploadError) {
          console.error('Error uploading attachments:', uploadError);
        }
      }

      resetForm();
      router.push(`/dashboard/surat/${result.letterId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengajukan surat. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const utamaFiles = attachments.filter(att => att.category === 'file' || att.category === 'foto');
  const tambahanFiles = attachments.filter(att => att.category === 'tambahan');

  return (
    <div className="w-full max-w-[1117px] mx-auto flex flex-col items-center gap-[30px] pt-[48px] pb-[122px] px-[16px]">
      <div className="w-full max-w-[1085px] flex flex-col gap-[8px] items-start">
         <h1 className="text-[30px] leading-[37.5px] font-black tracking-[-0.99px] text-[#111418] font-inter">
            Review Surat
         </h1>
         <p className="text-[16px] leading-[24px] font-normal text-[#4B5563] font-inter">
            Mohon periksa kembali seluruh data yang telah Anda masukkan sebelum mengajukan surat.
         </p>
      </div>
      <div className="w-full max-w-[1085px]">
         <Stepper currentStep={4} />
      </div>

      {error && (
        <div className="w-full max-w-[1085px] bg-red-50 border border-red-200 rounded-[8px] p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="w-full max-w-[1085px] flex flex-col gap-[20px]">
        <div className={cardBaseClass}>
          <div className={headerSectionClass}>
            <h3 className={headerTitleClass}>Identitas Pengaju</h3>
          </div>
          <div className="flex flex-col">
            <ReviewRow label="Nama Lengkap" value={formData.namaLengkap || user?.name || '-'} />
            <ReviewRow label="NIM" value={formData.nim || user?.mahasiswa?.nim || '-'} />
            <ReviewRow label="Role" value="Mahasiswa" />
            <ReviewRow label="Departemen" value={formData.departemen || user?.mahasiswa?.departemen?.name || '-'} />
            <ReviewRow label="Program Studi" value={formData.programStudi || user?.mahasiswa?.programStudi?.name || '-'} />
            <ReviewRow label="Tempat Lahir" value={formData.tempatLahir || user?.mahasiswa?.tempatLahir || '-'} />
            <ReviewRow label="Tanggal Lahir" value={formatDate(formData.tanggalLahir || user?.mahasiswa?.tanggalLahir)} />
            <ReviewRow label="No. HP" value={formData.noHp || user?.mahasiswa?.noHp || '-'} />
            <ReviewRow label="Alamat" value={formData.alamat || user?.mahasiswa?.alamat || '-'} />
            <ReviewRow label="IPK" value={formData.ipk || '-'} />
            <ReviewRow label="SKS" value={formData.sks || '-'} />
          </div>
        </div>
        <div className={cardBaseClass}>
          <div className={headerSectionClass}>
            <h3 className={headerTitleClass}>Detail Surat Pengajuan</h3>
          </div>
          <div className="flex flex-col">
            <ReviewRow label="Jenis Surat" value={formData.jenisSurat || 'Surat Pengantar PKL'} />
            <ReviewRow label="Tujuan Surat" value={formData.tujuanSurat || '-'} />
            <ReviewRow label="Jabatan" value={formData.jabatan || '-'} />
            <ReviewRow label="Nama Instansi" value={formData.namaInstansi || '-'} />
            <ReviewRow label="Alamat Instansi" value={formData.alamatInstansi || '-'} />
            <ReviewRow label="Judul" value={formData.judul || '-'} />
            <ReviewRow label="Nama Dosen Koordinator PKL" value={formData.namaDosenKoordinator || '-'} />
            <ReviewRow label="NIP Dosen Koordinator" value={formData.nipDosenKoordinator || '-'} />
            <ReviewRow label="Nama Kaprodi" value={formData.namaKaprodi || '-'} />
            <ReviewRow label="NIP Kaprodi" value={formData.nipKaprodi || '-'} />
          </div>
        </div>
        <div className="w-full bg-[#F0FDF4] border border-[#BBF7D0] rounded-[12px] p-[24px] flex flex-col gap-[14px]">
           <h3 className="font-inter font-semibold text-[18px] leading-[28px] text-[#14532D]">
             Checklist Kesiapan
           </h3>
           <div className="flex flex-col gap-[12px]">
             <div className="flex items-center gap-[12px]">
                <CheckCircle2 className={`w-[20px] h-[20px] ${formData.namaLengkap && formData.nim && formData.email ? 'text-[#16A34A]' : 'text-gray-400'}`} />
                <span className="font-inter font-medium text-[14px] text-[#14532D]">Data inti lengkap</span>
             </div>
             <div className="flex items-center gap-[12px]">
                <CheckCircle2 className={`w-[20px] h-[20px] ${utamaFiles.length > 0 ? 'text-[#16A34A]' : 'text-gray-400'}`} />
                <span className="font-inter font-medium text-[14px] text-[#14532D]">Lampiran utama ada</span>
             </div>
           </div>
        </div>
        <div className="w-full bg-white rounded-[12px] p-[32px] border border-[#E5E7EB] shadow-sm flex flex-col gap-[24px]">
           <h3 className="font-inter font-bold text-[20px] leading-[28px] text-[#0F172A]">
             Lampiran ({attachments.length})
           </h3>
           {attachments.length === 0 ? (
             <p className="text-gray-500 text-sm">Tidak ada lampiran</p>
           ) : (
             <div className="w-full flex flex-col gap-4">
               {attachments.map((attachment, index) => (
                 <div key={index} className="w-full flex flex-col">
                   <div
                     className="flex justify-between items-center py-2 border-b border-[#E5E7EB] mb-4 cursor-pointer"
                     onClick={() => toggleAttachment(index)}
                   >
                     <div className="flex items-center gap-2">
                       {getFileIcon(attachment.file)}
                       <span className="font-inter font-bold text-[16px] text-[#0F172A]">
                         {attachment.file.name}
                       </span>
                       <span className="text-sm text-gray-500">
                         ({formatFileSize(attachment.file.size)})
                       </span>
                     </div>
                     <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedAttachments[index] ? 'rotate-180' : ''}`} />
                   </div>
                   {expandedAttachments[index] && attachment.preview && (
                     <div className="w-full h-auto bg-[#6FA586] rounded-[8px] p-8 flex items-center justify-center overflow-hidden">
                       <img
                         src={attachment.preview}
                         alt={attachment.file.name}
                         className="max-w-full max-h-[500px] object-contain"
                       />
                     </div>
                   )}
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
        <div className="w-full max-w-[1085px] flex justify-between items-center mt-2">
            <Button
              variant="outline"
              className="h-11 px-6 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 rounded-[8px]"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
            Kembali
            </Button>
            <Button
              className="h-11 px-6 bg-[#0079BD] text-white font-bold hover:bg-blue-700 rounded-[8px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Mengajukan...
                </>
              ) : (
                'Ajukan Permohonan'
              )}
            </Button>
        </div>
    </div>
  );
}
