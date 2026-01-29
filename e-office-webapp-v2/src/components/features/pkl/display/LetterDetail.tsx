"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  FileText,
  Loader2,
  File,
  Download,
  ArrowLeft,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useLetter } from "@/hooks/api";
import { useAuthStore } from "@/stores";
import { usePKLFormStore } from "@/stores/pklFormStore";
import { letterService } from "@/services";
import { formatDate, formatDateTime } from "@/lib/utils/date.utils";
import { API_URL } from "@/lib/constants";

interface LetterDetailProps {
  id: string;
}

const getStepLabel = (step: number | null): string => {
  if (!step) return "-";
  const stepMap: Record<number, string> = {
    1: "Dosen Pembimbing",
    2: "Dosen Koordinator",
    3: "Ketua Program Studi",
    4: "Admin Fakultas",
    5: "Supervisor Akademik",
    6: "Manajer TU",
    7: "Wakil Dekan 1",
    8: "UPA",
  };
  return stepMap[step] || `Step ${step}`;
};

const getActionLabel = (action: string): string => {
  const actionMap: Record<string, string> = {
    SUBMITTED: "Surat Diajukan",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    REVISED: "Direvisi",
    SELF_REVISED: "Direvisi oleh Mahasiswa",
    RESUBMITTED: "Dikirim Ulang",
    SIGNED: "Ditandatangani",
    NUMBERED: "Diberi Nomor",
    CANCELLED: "Dibatalkan",
  };
  return actionMap[action] || action;
};

const getStatusLabel = (action: string, step: number | null): string => {
  if (action === "SUBMITTED") return "Surat Diajukan";
  if (action === "APPROVED") {
    const stepMap: Record<number, string> = {
      1: "Disetujui Dosen Pembimbing",
      2: "Disetujui Dosen Koordinator",
      3: "Disetujui Ketua Program Studi",
      4: "Disetujui Admin Fakultas",
      5: "Disetujui Supervisor Akademik",
      6: "Disetujui Manajer TU",
      7: "Ditandatangani Wakil Dekan 1",
      8: "Diberi Nomor oleh UPA",
    };
    return step ? stepMap[step] || "Disetujui" : "Disetujui";
  }
  return getActionLabel(action);
};

const getStatusDisplayLabel = (status: string, currentStep: number | null): string => {
  const statusMap: Record<string, string> = {
    DRAFT: "Draft",
    PENDING: "Menunggu",
    PROCESSING: "Diproses",
    REVISION: "Revisi",
    COMPLETED: "Selesai",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
  };
  return statusMap[status] || status;
};

const getAttachmentCategoryLabel = (category?: string | null): string => {
  if (!category) return "Lampiran";
  if (category === "proposal") return "Proposal";
  if (category === "ktm") return "KTM";
  if (category === "tambahan") return "Tambahan";
  return category;
};

const getTimelineBadgeClass = (action: string): string => {
  const key = action.toUpperCase();
  if (key === "APPROVED") return "bg-[#E7F9EE] text-[#1E8E3E] border-[#BFEBD1]";
  if (key === "REJECTED" || key === "CANCELLED") return "bg-[#FFECEC] text-[#D93025] border-[#F9BDB9]";
  if (key === "REVISED" || key === "SELF_REVISED") return "bg-[#FFF7E6] text-[#B26A00] border-[#F7D9A6]";
  if (key === "SIGNED" || key === "NUMBERED") return "bg-[#EAF2FF] text-[#1B5BD7] border-[#C7DAFF]";
  if (key === "SUBMITTED" || key === "RESUBMITTED") return "bg-[#EEF4FF] text-[#1D4ED8] border-[#C7DAFF]";
  return "bg-[#F5F5F7] text-[#636366] border-[#E5E5E7]";
};

export default function LetterDetail({ id }: LetterDetailProps) {
  const router = useRouter();
  const { letter, isLoading, error, isForbidden, refetch } = useLetter(id);
  const { user } = useAuthStore();
  const resetForm = usePKLFormStore((s) => s.resetForm);
  const [actionType, setActionType] = useState<"cancel" | "self-revise" | "resubmit" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selfReviseMessage, setSelfReviseMessage] = useState("");
  const [previewData, setPreviewData] = useState<{
    previewUrl: string;
    htmlContent?: string;
    isPDF?: boolean;
    format?: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    id: string;
    filename: string;
    url: string;
    isImage: boolean;
    isPdf: boolean;
    category: string | null;
    createdAt: Date;
  } | null>(null);

  const isMahasiswa = user?.roles?.some((r: { name?: string }) => r.name === "mahasiswa") ?? false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("pkl-fromResubmit")) {
      sessionStorage.removeItem("pkl-fromResubmit");
      resetForm();
    }
  }, [resetForm]);

  useEffect(() => {
    if (!letter?.id) return;
    const isFinal = !!(letter.letterNumber || letter.numbering?.numberString);
    if (isMahasiswa && !isFinal) {
      setPreviewData(null);
      setIsLoadingPreview(false);
      return;
    }
    setIsLoadingPreview(true);
    letterService
      .getPreview(letter.id)
      .then((preview) => {
        setPreviewData({
          previewUrl: preview.previewUrl,
          htmlContent: (preview as { htmlContent?: string }).htmlContent,
          isPDF: preview.isPDF,
          format: preview.format,
        });
      })
      .catch(() => setPreviewData(null))
      .finally(() => setIsLoadingPreview(false));
  }, [letter?.id, letter?.letterNumber, letter?.numbering?.numberString, isMahasiswa]);

  if (isLoading) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isForbidden) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <FileText className="w-12 h-12 text-[#FF3B30] mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-[#1D1D1F] mb-2">Akses Ditolak</h2>
            <p className="text-[#D93025] mb-3 text-sm">{error || "Anda tidak berhak mengakses surat ini"}</p>
            <p className="text-[#86868B] text-xs">
              Hanya pembuat surat, assignee, atau user yang pernah approve/reject/revisi surat ini yang dapat
              mengakses.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/surat")}
              className="mt-6 bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Surat
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || "Surat tidak ditemukan"}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/surat")}
            className="mt-4 bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const formValues = letter.values as Record<string, any>;
  const stepHistory = letter.stepHistory || [];
  const sortedHistory = [...stepHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const attachments = letter.attachments || [];
  const letterNumber = letter.letterNumber || letter.numbering?.numberString || null;
  const isFinalDocument = !!letterNumber;
  const isCreator = user?.id && letter.createdById === user.id;
  const hasRevisedHistory = stepHistory.some(
    (h) => h.action === "REVISED" || h.action === "SELF_REVISED",
  );
  const revisionRelated = stepHistory.filter((h) =>
    ["REVISED", "SELF_REVISED", "RESUBMITTED"].includes(h.action),
  );
  const latestRevisionAction = revisionRelated.length
    ? [...revisionRelated].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0]
    : null;
  const alreadyResubmitted = latestRevisionAction?.action === "RESUBMITTED";
  const wasRevisedByApprover = latestRevisionAction?.action === "REVISED";

  const canCancel =
    !!isCreator &&
    !letter.signedAt &&
    !["COMPLETED", "REJECTED", "CANCELLED"].includes(letter.status);
  const canSelfRevise =
    !!isCreator && !letter.signedAt && ["PROCESSING", "REVISION"].includes(letter.status);
  const canResubmit =
    !!isCreator &&
    ["PROCESSING", "REVISION"].includes(letter.status) &&
    hasRevisedHistory &&
    !alreadyResubmitted;

  const SummaryItem = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#86868B]">{label}</span>
      <span className="text-sm font-medium text-[#1D1D1F] break-words">{value || "-"}</span>
    </div>
  );

  const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 py-3 px-5 border-b border-[#E5E5E7] last:border-0">
      <div className="text-sm text-[#86868B]">{label}</div>
      <div className="text-sm font-medium text-[#1D1D1F]">{value || "-"}</div>
    </div>
  );

  const TimelineItem = ({
    role,
    time,
    status,
    note,
    action,
    isLatest,
    isLast,
  }: {
    role: string;
    time: string;
    status: string;
    note?: string | null;
    action: string;
    isLatest?: boolean;
    isLast?: boolean;
  }) => (
    <div className="relative pl-6">
      {!isLast && (
        <div className="absolute left-[6px] top-3 h-full border-l-2 border-dashed border-[#E5E5E7]" />
      )}
      <div
        className={`absolute left-[1px] top-3 h-3 w-3 rounded-full border-2 ${
          isLatest ? "border-[#0071E3] bg-[#E8F1FF]" : "border-[#CBD5E1] bg-white"
        }`}
      />
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#1D1D1F]">{role}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-[#86868B]">
              <Clock className="w-3 h-3" />
              <span>{time}</span>
            </div>
          </div>
          {isLatest && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0071E3]/10 text-[#0071E3] font-semibold">
              Terbaru
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getTimelineBadgeClass(action)}`}
          >
            {status}
          </span>
        </div>
        {note && (
          <div className="mt-3 rounded-lg border border-[#E5E5E7] bg-[#FAFAFC] p-3">
            <p className="text-[11px] font-semibold text-[#86868B] mb-1">Catatan</p>
            <p className="text-sm text-[#1D1D1F] leading-relaxed whitespace-pre-line">{note}</p>
          </div>
        )}
      </div>
    </div>
  );

  const handleOpenAttachmentPreview = (attachment: {
    id: string;
    filename: string;
    category: string | null;
    createdAt: Date;
  }) => {
    const ext = attachment.filename?.split(".").pop()?.toLowerCase() || "";
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
    const isPdf = ext === "pdf";
    const url = `${API_URL}/letter/${letter.id}/attachments/${attachment.id}/download`;
    setPreviewAttachment({
      id: attachment.id,
      filename: attachment.filename,
      url,
      isImage,
      isPdf,
      category: attachment.category,
      createdAt: attachment.createdAt,
    });
  };

  const handleAction = async () => {
    if (!letter || !actionType) return;
    setIsActionLoading(true);
    setActionError(null);
    try {
      if (actionType === "cancel") {
        await letterService.cancel(letter.id);
        await refetch();
      } else if (actionType === "self-revise") {
        await letterService.selfRevise(letter.id, selfReviseMessage || undefined);
        setSelfReviseMessage("");
        router.push(`/dashboard/pengajuan/pkl/identitas?revisi=${letter.id}`);
        setActionType(null);
        return;
      } else if (actionType === "resubmit") {
        await letterService.resubmit(letter.id, letter.values as Record<string, unknown>);
        await refetch();
      }
      setActionType(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Aksi gagal diproses");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center text-[16px] text-[#86868B] mb-[32px] font-lexend">
          <Link
            href="/dashboard/surat"
            className="text-[#0071E3] hover:text-[#0051A3] transition-colors"
          >
            Daftar Surat
          </Link>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <span className="font-medium text-[#1D1D1F]">Detail Surat</span>
        </div>

        {/* Header */}
        <div className="mb-[32px]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-lexend font-bold text-[30px] leading-[36px] tracking-[-0.5px] text-[#1D1D1F] mb-2">
                Detail Surat
              </h1>
              <p className="font-lexend font-normal text-[16px] leading-[24px] text-[#86868B]">
                Step: {getStepLabel(letter.currentStep)}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/surat")}
              className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="flex flex-col gap-6">
            {/* Ringkasan Surat */}
            <Card className="bg-white border-[#E5E5E7] shadow-sm">
              <CardHeader className="border-b border-[#E5E5E7]">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                  Ringkasan Surat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SummaryItem label="ID Surat" value={letter.id} />
                  <SummaryItem label="Jenis Surat" value={letter.letterType?.name || "PKL"} />
                  <SummaryItem
                    label="Status"
                    value={getStatusDisplayLabel(letter.status, letter.currentStep)}
                  />
                  <SummaryItem label="Step Saat Ini" value={getStepLabel(letter.currentStep)} />
                  <SummaryItem label="Nomor Surat" value={letterNumber} />
                  <SummaryItem label="Diajukan Oleh" value={letter.createdBy?.name} />
                  <SummaryItem label="Email Pengaju" value={letter.createdBy?.email} />
                  <SummaryItem label="Tanggal Pengajuan" value={formatDateTime(letter.createdAt)} />
                  <SummaryItem label="Terakhir Diperbarui" value={formatDateTime(letter.updatedAt)} />
                </div>
              </CardContent>
            </Card>

            {/* Identitas Pengaju */}
            <Card className="bg-white border-[#E5E5E7] shadow-sm">
              <CardHeader className="border-b border-[#E5E5E7]">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                  Identitas Pengaju
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
              </CardContent>
            </Card>

            {/* Detail Surat Pengajuan */}
            <Card className="bg-white border-[#E5E5E7] shadow-sm">
              <CardHeader className="border-b border-[#E5E5E7]">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                  Detail Surat Pengajuan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DetailRow label="Jenis Surat" value={letter.letterType?.name || "PKL"} />
                <DetailRow label="Tujuan Surat" value={formValues.tujuanSurat} />
                <DetailRow label="Jabatan" value={formValues.jabatan} />
                <DetailRow label="Nama Instansi" value={formValues.namaInstansi} />
                <DetailRow label="Alamat Instansi" value={formValues.alamatInstansi} />
                <DetailRow label="Judul" value={formValues.judul} />
                <DetailRow label="Nama Dosen Koordinator PKL" value={formValues.namaDosenKoordinator} />
                <DetailRow label="NIP Dosen Koordinator" value={formValues.nipDosenKoordinator} />
                <DetailRow label="Nama Kaprodi" value={formValues.namaKaprodi} />
                <DetailRow label="NIP Kaprodi" value={formValues.nipKaprodi} />
                {(letterNumber || letter.numbering?.numberString) && (
                  <DetailRow label="Nomor Surat" value={letterNumber} />
                )}
                <DetailRow
                  label="Status"
                  value={getStatusDisplayLabel(letter.status, letter.currentStep)}
                />
              </CardContent>
            </Card>

            {/* Lampiran */}
            <Card className="bg-white border-[#E5E5E7] shadow-sm">
              <CardHeader className="border-b border-[#E5E5E7]">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                  Lampiran ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {attachments.length === 0 ? (
                  <div className="text-center text-[#86868B] py-6">Tidak ada lampiran</div>
                ) : (
                  <div className="space-y-4">
                    {attachments.map((att) => {
                      const ext = att.filename?.split(".").pop()?.toLowerCase() || "";
                      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
                      const isPdf = ext === "pdf";
                      const downloadUrl = `${API_URL}/letter/${letter.id}/attachments/${att.id}/download`;
                      return (
                        <div
                          key={att.id}
                          className="border border-[#E5E5E7] rounded-lg overflow-hidden"
                        >
                          <div className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F7]">
                            <div className="flex items-center gap-3 text-left min-w-0">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-[#E5E5E7] shrink-0">
                                {isImage ? (
                                  <ImageIcon className="w-5 h-5 text-[#0071E3]" />
                                ) : isPdf ? (
                                  <FileText className="w-5 h-5 text-[#FF3B30]" />
                                ) : (
                                  <File className="w-5 h-5 text-[#1D1D1F]" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm text-[#1D1D1F] truncate">
                                  {att.filename}
                                </span>
                                <span className="text-xs text-[#86868B]">
                                  {getAttachmentCategoryLabel(att.category)} •{" "}
                                  {formatDateTime(att.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleOpenAttachmentPreview({
                                    id: att.id,
                                    filename: att.filename,
                                    category: att.category,
                                    createdAt: att.createdAt,
                                  })
                                }
                                className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                              >
                                Preview
                              </Button>
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0071E3] hover:text-[#0051A3]"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            {/* Aksi Pengajuan - di atas Riwayat Proses */}
            {(canCancel || canSelfRevise || canResubmit) && (
              <Card className="bg-white border-[#E5E5E7] shadow-sm">
                <CardHeader className="border-b border-[#E5E5E7]">
                  <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                    Aksi Pengajuan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    {canResubmit && wasRevisedByApprover && (
                      <Button
                        onClick={() => router.push(`/dashboard/pengajuan/pkl/identitas?revisi=${letter.id}`)}
                        className="w-full bg-[#0071E3] text-white hover:bg-[#0051A3]"
                      >
                        Perbaikan
                      </Button>
                    )}
                    {canResubmit && !wasRevisedByApprover && (
                      <Button
                        onClick={() => setActionType("resubmit")}
                        className="w-full bg-[#0071E3] text-white hover:bg-[#0051A3]"
                      >
                        Kirim Ulang
                      </Button>
                    )}
                    {canSelfRevise && !(canResubmit && wasRevisedByApprover) && (
                      <Button
                        variant="outline"
                        onClick={() => setActionType("self-revise")}
                        className="w-full bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                      >
                        Revisi Mandiri
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="destructive"
                        onClick={() => setActionType("cancel")}
                        className="w-full"
                      >
                        Batalkan Pengajuan
                      </Button>
                    )}
                  </div>
                  {actionError && (
                    <p className="mt-3 text-sm text-[#D93025]">{actionError}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {!(isMahasiswa && !isFinalDocument) && (
              <Card className="bg-white border-[#E5E5E7] shadow-sm">
                <CardHeader className="border-b border-[#E5E5E7]">
                  <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                    Dokumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#1D1D1F]">
                        {isFinalDocument ? "Dokumen Final" : "Preview Dokumen Sementara"}
                      </p>
                      <p className="text-xs text-[#86868B]">
                        {isLoadingPreview
                          ? "Memuat preview..."
                          : previewData
                            ? isFinalDocument
                              ? "Dokumen final sudah tersedia."
                              : "Dokumen masih sementara. Final tersedia setelah penomoran."
                            : "Preview tidak tersedia."}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDocumentPreview(true)}
                      disabled={isLoadingPreview || !previewData}
                      className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                    >
                      {isFinalDocument ? "Lihat Final" : "Lihat Draft"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Riwayat Proses */}
            <Card className="bg-white border-[#E5E5E7] shadow-sm">
              <CardHeader className="border-b border-[#E5E5E7]">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                  Riwayat Proses ({sortedHistory.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {sortedHistory.length === 0 ? (
                  <p className="text-sm text-[#86868B] text-center">Belum ada riwayat</p>
                ) : (
                  <div className="flex flex-col gap-6">
                    {sortedHistory.map((h, i) => (
                      <TimelineItem
                        key={h.id}
                        role={h.actor?.name || h.actorRole || "System"}
                        time={formatDateTime(h.createdAt)}
                        status={getStatusLabel(h.action, h.step)}
                        note={h.action !== "RESUBMITTED" ? h.comment : undefined}
                        action={h.action}
                        isLatest={i === 0}
                        isLast={i === sortedHistory.length - 1}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm dialog: cancel / self-revise / resubmit */}
      <Dialog
        open={!!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setSelfReviseMessage("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md gap-0 rounded-2xl border-[#E5E5E7] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 pr-12 space-y-1">
            <DialogTitle className="text-base font-semibold text-[#1D1D1F]">
              {actionType === "cancel"
                ? "Batalkan pengajuan?"
                : actionType === "self-revise"
                  ? "Revisi mandiri"
                  : "Kirim ulang?"}
            </DialogTitle>
            <DialogDescription className="text-sm text-[#86868B]">
              {actionType === "cancel" && "Pengajuan dibatalkan. Tidak dapat dilanjutkan."}
              {actionType === "self-revise" &&
                "Surat akan dikembalikan satu step mundur dari step sekarang."}
              {actionType === "resubmit" && "Data dikirim ulang ke alur approval."}
            </DialogDescription>
          </DialogHeader>
          {actionType === "self-revise" && (
            <div className="px-6 pb-4">
              <Textarea
                id="self-revise-message"
                value={selfReviseMessage}
                onChange={(e) => setSelfReviseMessage(e.target.value)}
                placeholder="Alasan revisi (opsional)"
                rows={3}
                className="resize-none rounded-xl border-[#E5E5E7] bg-[#F5F5F7] text-sm placeholder:text-[#86868B] focus-visible:ring-[#0071E3] focus-visible:ring-offset-0"
              />
            </div>
          )}
          <DialogFooter className="flex-row justify-end gap-2 px-6 pb-6 pt-0 border-t border-[#E5E5E7] mt-0 pt-4">
            <Button
              variant="outline"
              onClick={() => setActionType(null)}
              disabled={isActionLoading}
              className="rounded-xl border-[#E5E5E7] bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] hover:border-[#E5E5E7]"
            >
              Batal
            </Button>
            <Button
              onClick={handleAction}
              disabled={isActionLoading}
              className={
                "rounded-xl " +
                (actionType === "cancel"
                  ? "bg-[#FF3B30] hover:bg-[#D32F2F]"
                  : "bg-[#0071E3] hover:bg-[#0051A3]")
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

      {/* Attachment preview dialog */}
      <Dialog open={!!previewAttachment} onOpenChange={(open) => !open && setPreviewAttachment(null)}>
        <DialogContent className="max-w-[960px] w-[92vw] p-0 overflow-hidden">
          {previewAttachment && (
            <>
              <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#E5E5E7] pr-12">
                <div className="min-w-0">
                  <DialogTitle className="text-lg">Preview Lampiran</DialogTitle>
                  <p className="mt-2 text-sm font-semibold text-[#1D1D1F] break-words">
                    {previewAttachment.filename}
                  </p>
                  <p className="mt-1 text-xs text-[#86868B]">
                    {getAttachmentCategoryLabel(previewAttachment.category)} •{" "}
                    {formatDateTime(previewAttachment.createdAt)}
                  </p>
                  <a
                    href={previewAttachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center text-sm text-[#0071E3] hover:text-[#0051A3]"
                  >
                    Unduh
                  </a>
                </div>
              </DialogHeader>
              <div className="bg-[#F7F7FA] p-4">
                <div className="w-full h-[70vh] bg-white rounded-lg border border-[#E5E5E7] flex items-center justify-center overflow-hidden">
                  {previewAttachment.isImage && (
                    <img
                      src={previewAttachment.url}
                      alt={previewAttachment.filename}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                  {previewAttachment.isPdf && (
                    <iframe
                      src={previewAttachment.url}
                      className="w-full h-full border-none"
                      title={previewAttachment.filename}
                    />
                  )}
                  {!previewAttachment.isImage && !previewAttachment.isPdf && (
                    <div className="text-center text-[#86868B]">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Preview tidak tersedia untuk tipe file ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Document preview dialog */}
      <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
        <DialogContent className="max-w-[1100px] w-[92vw] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#E5E5E7] pr-12">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg">
                  {isFinalDocument ? "Dokumen Final" : "Preview Dokumen Sementara"}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#86868B]">
                  {isFinalDocument
                    ? "Dokumen final sudah bernomor dan siap didistribusikan."
                    : "Dokumen ini masih draft. Dokumen final tersedia setelah penomoran."}
                </DialogDescription>
              </div>
              {previewData?.isPDF && (
                <a
                  href={previewData.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#0071E3] hover:text-[#0051A3]"
                >
                  Unduh PDF
                </a>
              )}
            </div>
          </DialogHeader>
          <div className="bg-[#F7F7FA] p-4">
            {previewData ? (
              <div className="w-full h-[75vh] bg-white rounded-lg border border-[#E5E5E7] flex items-center justify-center overflow-hidden">
                {previewData.htmlContent ? (
                  <iframe
                    srcDoc={previewData.htmlContent}
                    className="w-full h-full border-none"
                    title="Document Preview"
                  />
                ) : (
                  <iframe
                    src={previewData.previewUrl}
                    className="w-full h-full border-none"
                    title="Document Preview"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-[#86868B]">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>Preview tidak tersedia</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
