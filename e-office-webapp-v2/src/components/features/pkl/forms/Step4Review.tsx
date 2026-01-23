"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Stepper from "@/components/features/pkl/navigation/Stepper";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronDown, FileText, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
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
import { letterService } from "@/services";
import { formatDate } from "@/lib/utils/date.utils";

export default function Step4Review() {
  const router = useRouter();
  const { formData, attachments, resetForm, restoreAttachments, _hasHydrated } = usePKLFormStore();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAttachments, setExpandedAttachments] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]');
    const hasMetadata = storedMetadata.length > 0;
    const hasAttachments = attachments.length > 0;
    
    if ((hasMetadata && !hasAttachments) || (!_hasHydrated && hasMetadata)) {
      restoreAttachments().catch(error => {
        console.error('[Step4Review] Error restoring attachments:', error);
      });
    }
  }, []);

  const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <div className="w-full flex justify-between items-center py-3 px-5 border-b border-border last:border-b-0">
      <div className="w-[30%] font-normal text-xs text-muted-foreground">
        {label}
      </div>
      <div className="w-[70%] font-medium text-xs text-foreground text-right sm:text-left">
        {value || '-'}
      </div>
    </div>
  );

  const cardBaseClass = "w-full bg-white rounded-3xl border border-[rgba(0,0,0,0.08)] shadow-sm overflow-hidden";
  const headerSectionClass = "w-full px-5 py-3 border-b border-[rgba(0,0,0,0.08)] bg-white";
  const headerTitleClass = "font-semibold text-base text-[#1D1D1F]";

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

  const getFileIconBg = (file: File) => {
    if (file.type === 'application/pdf') {
      return 'bg-destructive/10';
    }
    return 'bg-primary/10';
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

    const proposalFile = attachments.find(att => att.category === 'proposal');
    const ktmFile = attachments.find(att => att.category === 'ktm');
    
    if (!proposalFile || !ktmFile) {
      setError('File Proposal dan File KTM wajib diunggah.');
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
          const utamaFiles = attachments.filter(att => 
            att.category === 'proposal' || att.category === 'ktm'
          );
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
          let uploadErrorMessage = 'Surat berhasil dibuat, namun gagal mengunggah lampiran. ';
          
          if (uploadError instanceof Error) {
            uploadErrorMessage += uploadError.message;
          } else if (typeof uploadError === 'object' && uploadError !== null) {
            const apiError = uploadError as any;
            if (apiError.response?.data?.message) {
              uploadErrorMessage += apiError.response.data.message;
            } else if (apiError.message) {
              uploadErrorMessage += apiError.message;
            }
          }
          
          setError(uploadErrorMessage);
          setIsSubmitting(false);
          return;
        }
      }

      resetForm();
      router.push(`/dashboard/surat/${result.letterId}`);
    } catch (err) {
      let errorMessage = 'Gagal mengajukan surat.';
      let errorDetail = '';
      let apiResponseMessage = '';
      let apiStatus: number | undefined;
      
      if (typeof err === 'object' && err !== null) {
        const apiError = err as any;
        apiStatus = apiError.status || apiError.statusCode || apiError.response?.status;
        
        if (apiError.responseData && typeof apiError.responseData === 'string') {
          apiResponseMessage = apiError.responseData;
        } else if (apiError.response?.text && typeof apiError.response.text === 'string') {
          apiResponseMessage = apiError.response.text;
        } else if (apiError.response?.body && typeof apiError.response.body === 'string') {
          apiResponseMessage = apiError.response.body;
        } else if (apiError.response?.error) {
          if (typeof apiError.response.error === 'string') {
            apiResponseMessage = apiError.response.error;
          } else if (typeof apiError.response.error === 'object') {
            apiResponseMessage = apiError.response.error.message || apiError.response.error.error || apiError.response.error.toString() || JSON.stringify(apiError.response.error);
          }
        } else if (apiError.response?.data !== undefined && apiError.response.data !== null) {
          if (typeof apiError.response.data === 'string') {
            apiResponseMessage = apiError.response.data;
          } else if (typeof apiError.response.data === 'object') {
            apiResponseMessage = apiError.response.data.message || 
                                apiError.response.data.error || 
                                apiError.response.data.toString() ||
                                JSON.stringify(apiError.response.data);
          }
        } else if (typeof apiError.response === 'string') {
          apiResponseMessage = apiError.response;
        } else if (apiError.data !== undefined && apiError.data !== null) {
          if (typeof apiError.data === 'string') {
            apiResponseMessage = apiError.data;
          } else if (typeof apiError.data === 'object') {
            apiResponseMessage = apiError.data.message || apiError.data.error || apiError.data.toString() || JSON.stringify(apiError.data);
          }
        } else if (apiError.error) {
          if (typeof apiError.error === 'string') {
            apiResponseMessage = apiError.error;
          } else if (typeof apiError.error === 'object') {
            apiResponseMessage = apiError.error.message || apiError.error.error || apiError.error.toString() || JSON.stringify(apiError.error);
          }
        }
        
        if (apiError.originalError) {
          const original = apiError.originalError;
          if (original.responseData && typeof original.responseData === 'string') {
            apiResponseMessage = original.responseData;
          } else if (original.response?.data !== undefined) {
            if (typeof original.response.data === 'string') {
              apiResponseMessage = original.response.data;
            } else if (typeof original.response.data === 'object') {
              apiResponseMessage = original.response.data.message || 
                                  original.response.data.error || 
                                  original.response.data.toString() ||
                                  JSON.stringify(original.response.data);
            }
          } else if (typeof original.response === 'string') {
            apiResponseMessage = original.response;
          } else if (original.data && typeof original.data === 'string') {
            apiResponseMessage = original.data;
          }
          apiStatus = apiStatus || original.status || original.statusCode || original.response?.status;
        }
      }
      
      if (apiResponseMessage && apiResponseMessage.trim().length > 0) {
        errorMessage = apiResponseMessage.trim();
        errorDetail = '';
      } else if (err instanceof Error) {
        const rawMessage = err.message;
        
        if (rawMessage && rawMessage.trim().length > 0) {
          const isUserFriendly = (
            rawMessage.includes('masih memiliki') || 
            rawMessage.includes('sedang diproses') ||
            rawMessage.includes('Selesaikan') ||
            rawMessage.includes('batalkan') ||
            rawMessage.includes('terlebih dahulu') ||
            rawMessage.includes('Anda') ||
            rawMessage.includes('Silakan') ||
            rawMessage.includes('Periksa') ||
            rawMessage.includes('pastikan') ||
            rawMessage.length > 50
          );
          
          if (apiStatus === 500) {
            if (isUserFriendly || rawMessage.length > 30) {
              errorMessage = rawMessage.trim();
              errorDetail = '';
            } else {
              errorMessage = 'Terjadi kesalahan pada server.';
              errorDetail = 'Silakan coba lagi beberapa saat. Jika masalah berlanjut, hubungi administrator.';
            }
          } else if (isUserFriendly) {
            errorMessage = rawMessage.trim();
            errorDetail = '';
          } else {
            if (rawMessage.includes('Invalid response from /letter/pkl/submit endpoint')) {
              errorMessage = 'Server tidak merespons dengan benar.';
              errorDetail = 'Silakan periksa kembali data yang Anda masukkan atau coba lagi beberapa saat.';
            } else if (rawMessage.includes('network') || rawMessage.includes('fetch') || rawMessage.includes('Failed to fetch')) {
              errorMessage = 'Tidak dapat terhubung ke server.';
              errorDetail = 'Periksa koneksi internet Anda dan pastikan server sedang berjalan.';
            } else if (rawMessage.includes('401') || rawMessage.includes('Unauthorized')) {
              errorMessage = 'Sesi Anda telah berakhir.';
              errorDetail = 'Silakan login kembali untuk melanjutkan.';
            } else if (rawMessage.includes('403') || rawMessage.includes('Forbidden')) {
              errorMessage = 'Anda tidak memiliki izin.';
              errorDetail = 'Hubungi administrator jika Anda yakin seharusnya memiliki akses.';
            } else if (rawMessage.includes('404') || rawMessage.includes('Not Found')) {
              errorMessage = 'Layanan tidak ditemukan.';
              errorDetail = 'Silakan hubungi administrator atau coba lagi nanti.';
            } else if (rawMessage.includes('500') || rawMessage.includes('Internal Server Error') || apiStatus === 500) {
              if (isUserFriendly) {
                errorMessage = rawMessage.trim();
                errorDetail = '';
              } else {
                errorMessage = 'Terjadi kesalahan pada server.';
                errorDetail = 'Silakan coba lagi beberapa saat. Jika masalah berlanjut, hubungi administrator.';
              }
            } else if (rawMessage.includes('validation') || rawMessage.includes('Validation')) {
              errorMessage = 'Data yang Anda masukkan tidak valid.';
              errorDetail = rawMessage.replace(/validation|Validation/gi, '').trim() || 'Periksa kembali semua field yang wajib diisi.';
            } else if (rawMessage.includes('timeout') || rawMessage.includes('Timeout')) {
              errorMessage = 'Waktu permintaan habis.';
              errorDetail = 'Koneksi terlalu lambat. Silakan coba lagi dengan koneksi yang lebih stabil.';
            } else {
              errorMessage = 'Terjadi kesalahan saat mengajukan surat.';
              errorDetail = rawMessage.length > 100 ? rawMessage.substring(0, 100) + '...' : rawMessage;
            }
          }
        }
      }
      
      const finalError = errorDetail 
        ? `${errorMessage}\n\n${errorDetail}` 
        : errorMessage;
      
      setError(finalError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const utamaFiles = attachments.filter(att => att.category === 'proposal' || att.category === 'ktm');
  const tambahanFiles = attachments.filter(att => att.category === 'tambahan');

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
                handleSubmit();
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
        <div className="w-full bg-success/10 border border-success/20 rounded-xl p-5 flex flex-col gap-3">
           <h3 className="font-semibold text-base text-success">
             Checklist Kesiapan
           </h3>
           <div className="flex flex-col gap-2.5">
             <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`w-4 h-4 ${formData.namaLengkap && formData.nim && formData.email ? 'text-success' : 'text-muted-foreground'}`} />
                <span className="font-medium text-xs text-success">Data inti lengkap</span>
             </div>
             <div className="flex items-center gap-2.5">
                <CheckCircle2 className={`w-4 h-4 ${utamaFiles.length > 0 ? 'text-success' : 'text-muted-foreground'}`} />
                <span className="font-medium text-xs text-success">Lampiran utama ada</span>
             </div>
           </div>
        </div>
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
                 
                 return (
                   <div key={index} className="w-full flex flex-col border border-border rounded-lg overflow-hidden bg-card">
                     <div
                       className="flex justify-between items-center py-3 px-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                       onClick={() => toggleAttachment(index)}
                     >
                       <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-lg ${getFileIconBg(attachment.file)} flex items-center justify-center shrink-0`}>
                           {getFileIcon(attachment.file)}
                         </div>
                         <div className="flex flex-col min-w-0">
                           <span className="font-semibold text-sm text-foreground truncate">
                             {attachment.file.name}
                           </span>
                           <span className="text-xs text-muted-foreground">
                             {formatFileSize(attachment.file.size)} • {attachment.category === 'tambahan' ? 'Tambahan' : attachment.category === 'proposal' ? 'Proposal' : attachment.category === 'ktm' ? 'KTM' : 'File'}
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
        )}
    </div>
  );
}
