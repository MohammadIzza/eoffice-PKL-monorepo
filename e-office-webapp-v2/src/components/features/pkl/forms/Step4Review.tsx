"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Stepper from "@/components/features/pkl/navigation/Stepper";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ChevronDown, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePKLFormStore } from "@/stores/pklFormStore";
import { useAuthStore } from "@/stores";
import { formatDate } from "@/lib/utils/date.utils";
import { ReviewRow, ReviewSection, ReviewChecklist } from "./index";
import { useFormSubmission } from "@/hooks";

export default function Step4Review() {
  const router = useRouter();
  const { formData, attachments, restoreAttachments, _hasHydrated } = usePKLFormStore();
  const { user } = useAuthStore();
  const [expandedAttachments, setExpandedAttachments] = useState<Record<number, boolean>>({});
  const { submit, isSubmitting, error, setError } = useFormSubmission();

  useEffect(() => {
    const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]');
    const hasMetadata = storedMetadata.length > 0;
    const hasAttachments = attachments.length > 0;
    
    if ((hasMetadata && !hasAttachments) || (!_hasHydrated && hasMetadata)) {
      restoreAttachments().catch(error => {
        console.error('[Step4Review] Error restoring attachments:', error);
      });
    }
  }, [attachments.length, _hasHydrated, restoreAttachments]);

  const toggleAttachment = (index: number) => {
    setExpandedAttachments(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const utamaFiles = attachments.filter(att => att.category === 'proposal' || att.category === 'ktm');
  const checklistItems = [
    {
      label: 'Data inti lengkap',
      checked: !!(formData.namaLengkap && formData.nim && formData.email)
    },
    {
      label: 'Lampiran utama ada',
      checked: utamaFiles.length > 0
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-4 pt-8 pb-20 px-4 bg-white min-h-screen">
      <div className="w-full max-w-5xl flex flex-col gap-1.5 items-start">
         <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Review Surat
         </h1>
         <p className="text-sm font-normal text-[#86868B]">
            Mohon periksa kembali seluruh data yang telah Anda masukkan sebelum mengajukan surat.
         </p>
      </div>
      <div className="w-full max-w-5xl">
         <Stepper currentStep={4} />
      </div>

      <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="text-lg font-semibold">Gagal Mengajukan Surat</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              Terjadi kesalahan saat mengajukan surat. Silakan periksa detail di bawah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-3">
              {error && error.split('\n\n').map((line, index) => (
                <p 
                  key={index} 
                  className={`leading-relaxed ${
                    index === 0 
                      ? 'text-sm text-destructive font-semibold' 
                      : 'text-sm text-destructive/80'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setError(null)}
            >
              Tutup
            </Button>
            <Button
              onClick={() => {
                setError(null);
                submit();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengajukan...
                </>
              ) : (
                'Coba Lagi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full max-w-5xl flex flex-col gap-4">
        <ReviewSection title="Identitas Pengaju">
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
        </ReviewSection>

        <ReviewSection title="Detail Surat Pengajuan">
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
        </ReviewSection>

        <ReviewChecklist items={checklistItems} />

        <div className="w-full bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-5">
           <h3 className="font-bold text-lg text-foreground">
             Lampiran ({attachments.length})
           </h3>
           {attachments.length === 0 ? (
             <p className="text-muted-foreground text-sm">Tidak ada lampiran</p>
           ) : (
             <div className="w-full flex flex-col gap-3">
               {attachments.map((attachment, index) => {
                 const fileExtension = attachment.file.name.split('.').pop()?.toLowerCase() || '';
                 const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                 const isPdf = fileExtension === 'pdf';
                 const isOpen = expandedAttachments[index];
                 const categoryLabel = 
                   attachment.category === 'tambahan' ? 'Tambahan' : 
                   attachment.category === 'proposal' ? 'Proposal' : 
                   attachment.category === 'ktm' ? 'KTM' : 'File';
                 
                 return (
                   <div key={index} className="w-full flex flex-col border border-border rounded-lg overflow-hidden bg-card">
                     <div
                       className="flex justify-between items-center py-3 px-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                       onClick={() => toggleAttachment(index)}
                     >
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                           isPdf ? 'bg-destructive/10' : 'bg-primary/10'
                         }`}>
                           {isPdf ? (
                             <FileText className="w-5 h-5 text-destructive" />
                           ) : (
                             <FileText className="w-5 h-5 text-primary" />
                           )}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="font-semibold text-sm text-foreground truncate">
                             {attachment.file.name}
                           </span>
                           <span className="text-xs text-muted-foreground">
                             {formatFileSize(attachment.file.size)} • {categoryLabel}
                           </span>
                         </div>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                         {attachment.preview && (
                           <span className="text-xs text-muted-foreground hidden sm:inline">
                             {isOpen ? 'Sembunyikan' : 'Lihat Preview'}
                           </span>
                         )}
                         <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                       </div>
                     </div>
                     {isOpen && attachment.preview && (
                       <div className="w-full bg-muted/30 border-t border-border">
                         <div className="w-full h-[500px] bg-muted rounded-b-lg p-6 flex items-center justify-center overflow-auto">
                           {isImage && (
                             <img
                               src={attachment.preview}
                               alt={attachment.file.name}
                               className="max-w-full max-h-full object-contain"
                             />
                           )}
                           {isPdf && (
                             <iframe
                               src={attachment.preview}
                               className="w-full h-full border-none rounded"
                               title={attachment.file.name}
                             />
                           )}
                           {!isImage && !isPdf && (
                             <div className="text-center">
                               <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                               <p className="text-sm text-muted-foreground">Preview tidak tersedia untuk tipe file ini</p>
                               <p className="text-xs text-muted-foreground mt-1">File: {attachment.file.name}</p>
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
        {!error && (
          <div className="w-full max-w-5xl flex justify-between items-center">
            <Button
              variant="outline"
              size="default"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Kembali
            </Button>
            <Button
              size="default"
              onClick={submit}
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
        )}
    </div>
  );
}
