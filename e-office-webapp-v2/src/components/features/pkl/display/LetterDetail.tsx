"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useAuthStore } from "@/stores";
import { letterService } from "@/services";
import { formatDate, formatDateTime } from "@/lib/utils/date.utils";
import { API_URL } from "@/lib/constants";

interface LetterDetailProps {
  id?: string;
}

export default function LetterDetail({ id: idProp }: LetterDetailProps = {}) {
  const searchParams = useSearchParams();
  const idFromQuery = searchParams.get('id');
  const letterId = idProp || idFromQuery || null;
  const { letter, isLoading, error, isForbidden, refetch } = useLetter(letterId);
  const { user } = useAuthStore();
  const [expandedAttachments, setExpandedAttachments] = useState<Record<string, boolean>>({});
  const [actionType, setActionType] = useState<"cancel" | "self-revise" | "resubmit" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const DetailRow = ({ label, value }: { label: string, value: string | null | undefined }) => (
    <div className="flex justify-between items-start py-2.5 px-5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
      <div className="w-[35%] font-normal text-xs text-muted-foreground">
        {label}
      </div>
      <div className="w-[65%] font-medium text-xs text-foreground">
        {value || '-'}
      </div>
    </div>
  );


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
        <div className="absolute left-[5px] top-[18px] w-[2px] h-full bg-border -z-10" />
      )}
      <div className="flex gap-3 w-full pb-6">
        <div className="w-2.5 h-2.5 rounded-full bg-muted mt-1 shrink-0 border-2 border-background ring-1 ring-border" />
        <div className="flex flex-col gap-1">
           <span className="font-semibold text-xs text-foreground">{role}</span>
           <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
              <Clock className="w-2.5 h-2.5" />
              <span>{time}</span>
           </div>
           <div className="mt-0.5">
             <span className="bg-muted text-foreground px-1.5 py-0.5 rounded text-[10px] font-medium border border-border">
               {status}
             </span>
           </div>
           {note && (
             <p className="text-[10px] text-muted-foreground mt-0.5">
               Catatan: <span className="text-foreground">{note}</span>
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Memuat data surat...</p>
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="mb-4">
            <FileText className="w-12 h-12 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Akses Ditolak</h2>
            <p className="text-destructive mb-3 text-sm">{error || 'Anda tidak berhak mengakses surat ini'}</p>
          </div>
          <p className="text-muted-foreground text-xs">
            Hanya pembuat surat, assignee, atau user yang pernah approve/reject/revisi surat ini yang dapat mengakses.
          </p>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-3 text-sm">{error || 'Surat tidak ditemukan'}</p>
          <p className="text-muted-foreground text-xs">Pastikan ID surat valid atau surat masih ada.</p>
        </div>
      </div>
    );
  }

  const formValues = letter.values as Record<string, any>;
  const stepHistory = letter.stepHistory || [];
  const attachments = letter.attachments || [];
  const isCreator = user?.id && letter.createdById === user.id;
  const hasRevisedHistory = stepHistory.some(
    (history) => history.action === "REVISED" || history.action === "SELF_REVISED",
  );
  const canCancel =
    !!isCreator &&
    !letter.signedAt &&
    !["COMPLETED", "REJECTED", "CANCELLED"].includes(letter.status);
  const canSelfRevise =
    !!isCreator &&
    !letter.signedAt &&
    ["PROCESSING", "REVISION"].includes(letter.status);
  const canResubmit =
    !!isCreator &&
    ["PROCESSING", "REVISION"].includes(letter.status) &&
    hasRevisedHistory;

  const handleAction = async () => {
    if (!letter || !actionType) return;

    setIsActionLoading(true);
    setActionError(null);
    try {
      if (actionType === "cancel") {
        await letterService.cancel(letter.id);
      } else if (actionType === "self-revise") {
        await letterService.selfRevise(letter.id);
      } else if (actionType === "resubmit") {
        await letterService.resubmit(letter.id, letter.values as Record<string, any>);
      }
      await refetch();
      setActionType(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Aksi gagal diproses";
      setActionError(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto pt-0">
        <main className="p-6 bg-background">
           <div className="flex items-center gap-2 text-xs mb-5">
              <span className="text-muted-foreground">Persuratan</span>
              <span className="text-border">/</span>
              <span className="font-medium text-foreground">Detail Surat</span>
           </div>
           <div className="flex flex-col xl:flex-row gap-5">
              <div className="flex-1 flex flex-col gap-5">
                 {(canCancel || canSelfRevise || canResubmit) && (
                   <div className="bg-card rounded-lg border shadow-sm">
                     <div className="px-5 py-3 border-b border-border">
                       <h3 className="font-semibold text-sm text-foreground">Aksi Pengajuan</h3>
                     </div>
                     <div className="p-5 flex flex-wrap gap-2">
                       {canResubmit && (
                         <Button
                           onClick={() => setActionType("resubmit")}
                           className="bg-[#0071E3] text-white hover:bg-[#0051A3]"
                         >
                           Kirim Ulang
                         </Button>
                       )}
                       {canSelfRevise && (
                         <Button
                           variant="outline"
                           onClick={() => setActionType("self-revise")}
                         >
                           Revisi Mandiri
                         </Button>
                       )}
                       {canCancel && (
                         <Button
                           variant="destructive"
                           onClick={() => setActionType("cancel")}
                         >
                           Batalkan Pengajuan
                         </Button>
                       )}
                     </div>
                     {actionError && (
                       <p className="px-5 pb-5 text-xs text-destructive">{actionError}</p>
                     )}
                   </div>
                 )}
                 <div className="bg-card rounded-lg border shadow-sm">
                    <div className="px-5 py-3 border-b border-border">
                       <h3 className="font-semibold text-sm text-foreground">Identitas Pengaju</h3>
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
                 <div className="bg-card rounded-lg border shadow-sm">
                    <div className="px-5 py-3 border-b border-border">
                       <h3 className="font-semibold text-sm text-foreground">Detail Surat Pengajuan</h3>
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
                   <div className="bg-card rounded-lg border shadow-sm p-5">
                      <h3 className="font-semibold text-sm text-foreground mb-5">Lampiran ({attachments.length})</h3>
                      {attachments.map((attachment) => {
                        const isOpen = expandedAttachments[attachment.id];
                        const fileExtension = attachment.filename?.split('.').pop()?.toLowerCase() || '';
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                        const isPdf = fileExtension === 'pdf';
                        const downloadUrl = `${API_URL}/letter/${letterId}/attachments/${attachment.id}/download`;

                        return (
                          <div key={attachment.id} className="w-full border-b border-border last:border-0 pb-5 mb-5">
                            <div 
                              className="flex justify-between items-center cursor-pointer mb-3"
                              onClick={() => toggleAttachment(attachment.id)}
                            >
                              <span className="font-bold text-sm text-foreground">
                                {attachment.filename}
                              </span>
                              <div className="flex items-center gap-2">
                                <a 
                                  href={downloadUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-primary hover:text-primary/80"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                {isOpen ? (
                                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            
                            {isOpen && (
                              <div className="w-full h-[400px] bg-muted rounded-lg flex items-center justify-center p-6 shadow-inner overflow-hidden">
                                {isImage && (
                                  <img 
                                    src={downloadUrl} 
                                    alt={attachment.filename} 
                                    className="max-w-full max-h-full object-contain"
                                  />
                                )}
                                {isPdf && (
                                  <iframe 
                                    src={downloadUrl} 
                                    className="w-full h-full border-none"
                                    title={attachment.filename}
                                  />
                                )}
                                {!isImage && !isPdf && (
                                  <div className="text-muted-foreground text-center">
                                    <File className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <p>Preview tidak tersedia untuk tipe file ini.</p>
                                    <a 
                                      href={downloadUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline mt-2 block"
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
                 <div className="bg-card rounded-lg border shadow-sm sticky top-20">
                    <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                       <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                       <h3 className="font-semibold text-sm text-foreground">
                         Riwayat Surat ({stepHistory.length})
                       </h3>
                    </div>
                    <div className="p-5">
                       {stepHistory.length === 0 ? (
                         <p className="text-xs text-muted-foreground text-center">Belum ada riwayat</p>
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

      <Dialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "cancel"
                ? "Konfirmasi Pembatalan"
                : actionType === "self-revise"
                  ? "Konfirmasi Revisi Mandiri"
                  : "Konfirmasi Kirim Ulang"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "cancel" &&
                "Pengajuan akan dibatalkan dan tidak dapat dilanjutkan."}
              {actionType === "self-revise" &&
                "Surat akan dikembalikan satu step agar Anda dapat memperbaiki data."}
              {actionType === "resubmit" &&
                "Data surat akan dikirim ulang ke alur approval."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setActionType(null)}
              disabled={isActionLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleAction}
              disabled={isActionLoading}
              className={
                actionType === "cancel"
                  ? "bg-[#FF3B30] hover:bg-[#D32F2F]"
                  : "bg-[#0071E3] hover:bg-[#0051A3]"
              }
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Konfirmasi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
