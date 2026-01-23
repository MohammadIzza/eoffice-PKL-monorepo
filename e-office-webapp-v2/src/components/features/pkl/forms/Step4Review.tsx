"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Stepper from "@/components/features/pkl/navigation/Stepper";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { usePKLFormStore } from "@/stores/pklFormStore";
import { useAuthStore } from "@/stores";
import { letterService } from "@/services";
import { formatDate } from "@/lib/utils/date.utils";

export default function Step4Review() {
  const router = useRouter();
  const { formData, attachments, resetForm } = usePKLFormStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAttachments, setExpandedAttachments] = useState<Record<number, boolean>>({});

  const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <div className="w-full flex justify-between items-center py-4 px-6 border-b border-border last:border-b-0">
      <div className="w-[30%] font-normal text-sm text-muted-foreground">
        {label}
      </div>
      <div className="w-[70%] font-medium text-sm text-foreground text-right sm:text-left">
        {value || '-'}
      </div>
    </div>
  );

  const cardBaseClass = "w-full bg-card rounded-xl border shadow-sm overflow-hidden";
  const headerSectionClass = "w-full px-6 py-4 border-b border-border bg-card";
  const headerTitleClass = "font-semibold text-lg text-foreground";

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-destructive" />;
    }
    return <ImageIcon className="w-5 h-5 text-primary" />;
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
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8 pt-12 pb-32 px-4">
      <div className="w-full max-w-5xl flex flex-col gap-2 items-start">
         <h1 className="text-3xl font-black tracking-tight text-foreground">
            Review Surat
         </h1>
         <p className="text-base font-normal text-muted-foreground">
            Mohon periksa kembali seluruh data yang telah Anda masukkan sebelum mengajukan surat.
         </p>
      </div>
      <div className="w-full max-w-5xl">
         <Stepper currentStep={4} />
      </div>

      {error && (
        <div className="w-full max-w-5xl bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="w-full max-w-5xl flex flex-col gap-5">
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
        <div className="w-full bg-success/10 border border-success/20 rounded-xl p-6 flex flex-col gap-3.5">
           <h3 className="font-semibold text-lg text-success">
             Checklist Kesiapan
           </h3>
           <div className="flex flex-col gap-3">
             <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-5 h-5 ${formData.namaLengkap && formData.nim && formData.email ? 'text-success' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm text-success">Data inti lengkap</span>
             </div>
             <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-5 h-5 ${utamaFiles.length > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm text-success">Lampiran utama ada</span>
             </div>
           </div>
        </div>
        <div className="w-full bg-card rounded-xl p-8 border shadow-sm flex flex-col gap-6">
           <h3 className="font-bold text-xl text-foreground">
             Lampiran ({attachments.length})
           </h3>
           {attachments.length === 0 ? (
             <p className="text-muted-foreground text-sm">Tidak ada lampiran</p>
           ) : (
             <div className="w-full flex flex-col gap-4">
               {attachments.map((attachment, index) => (
                 <div key={index} className="w-full flex flex-col">
                   <div
                     className="flex justify-between items-center py-2 border-b border-border mb-4 cursor-pointer"
                     onClick={() => toggleAttachment(index)}
                   >
                     <div className="flex items-center gap-2">
                       {getFileIcon(attachment.file)}
                       <span className="font-bold text-base text-foreground">
                         {attachment.file.name}
                       </span>
                       <span className="text-sm text-muted-foreground">
                         ({formatFileSize(attachment.file.size)})
                       </span>
                     </div>
                     <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedAttachments[index] ? 'rotate-180' : ''}`} />
                   </div>
                   {expandedAttachments[index] && attachment.preview && (
                     <div className="w-full h-auto bg-muted rounded-lg p-8 flex items-center justify-center overflow-hidden">
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
        <div className="w-full max-w-5xl flex justify-between items-center mt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
            Kembali
            </Button>
            <Button
              size="lg"
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
