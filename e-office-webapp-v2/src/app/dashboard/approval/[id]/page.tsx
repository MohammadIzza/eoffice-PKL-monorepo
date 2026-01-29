'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useLetter, useApprovalQueue } from '@/hooks/api';
import { letterService } from '@/services';
import { useAuthStore } from '@/stores';
import { 
  Loader2, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  XCircle,
  Edit,
  ArrowLeft,
  Clock,
  Download,
  File,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Send,
  FileCheck,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDate, formatDateTime } from '@/lib/utils/date.utils';
import { API_URL } from '@/lib/constants';

const ROLE_TO_STEP: Record<string, number> = {
  dosen_pembimbing: 1,
  dosen_koordinator: 2,
  ketua_program_studi: 3,
  admin_fakultas: 4,
  supervisor_akademik: 5,
  manajer_tu: 6,
  wakil_dekan_1: 7,
  upa: 8,
};

const APPROVER_ROLES = [
  'dosen_pembimbing', 'dosen_koordinator', 'ketua_program_studi', 'admin_fakultas',
  'supervisor_akademik', 'manajer_tu', 'wakil_dekan_1', 'upa',
] as const;

const getStepLabel = (step: number | null): string => {
  if (!step) return '-';
  const stepMap: Record<number, string> = {
    1: 'Dosen Pembimbing',
    2: 'Dosen Koordinator',
    3: 'Ketua Program Studi',
    4: 'Admin Fakultas',
    5: 'Supervisor Akademik',
    6: 'Manajer TU',
    7: 'Wakil Dekan 1',
    8: 'UPA',
  };
  return stepMap[step] || `Step ${step}`;
};

const getActionLabel = (action: string): string => {
  const actionMap: Record<string, string> = {
    SUBMITTED: 'Surat Diajukan',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    REVISED: 'Direvisi',
    SELF_REVISED: 'Direvisi oleh Mahasiswa',
    RESUBMITTED: 'Dikirim Ulang',
    SIGNED: 'Ditandatangani',
    NUMBERED: 'Diberi Nomor',
    CANCELLED: 'Dibatalkan',
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
    DRAFT: 'Draft',
    PENDING: 'Menunggu',
    PROCESSING: 'Diproses',
    REVISION: 'Revisi',
    COMPLETED: 'Selesai',
    REJECTED: 'Ditolak',
    CANCELLED: 'Dibatalkan',
  };
  return statusMap[status] || status;
};

const getAttachmentCategoryLabel = (category?: string | null): string => {
  if (!category) return 'Lampiran';
  if (category === 'proposal') return 'Proposal';
  if (category === 'ktm') return 'KTM';
  if (category === 'tambahan') return 'Tambahan';
  return category;
};

const getTimelineStatusColor = (action: string): string => {
  const key = action.toUpperCase();
  if (key === 'APPROVED') return 'text-[#1E8E3E]';
  if (key === 'REJECTED' || key === 'CANCELLED') return 'text-[#D93025]';
  if (key === 'REVISED' || key === 'SELF_REVISED') return 'text-[#B26A00]';
  if (key === 'SIGNED' || key === 'NUMBERED') return 'text-[#1B5BD7]';
  if (key === 'SUBMITTED' || key === 'RESUBMITTED') return 'text-[#1D4ED8]';
  return 'text-[#636366]';
};

const getTimelineIcon = (action: string): LucideIcon => {
  const key = action.toUpperCase();
  if (key === 'APPROVED') return CheckCircle2;
  if (key === 'REJECTED' || key === 'CANCELLED') return XCircle;
  if (key === 'REVISED' || key === 'SELF_REVISED') return RotateCcw;
  if (key === 'SIGNED' || key === 'NUMBERED') return FileCheck;
  if (key === 'SUBMITTED' || key === 'RESUBMITTED') return Send;
  return Clock;
};

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { user } = useAuthStore();
  const { letter, isLoading, error, refetch } = useLetter(id);
  const { refetch: refetchQueue } = useApprovalQueue();
  
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    previewUrl: string;
    htmlContent?: string;
    isPDF?: boolean;
    format?: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revise' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [signatureMethod, setSignatureMethod] = useState<'DRAW' | 'UPLOAD'>('DRAW');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const [numberDate, setNumberDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [numberSuggestion, setNumberSuggestion] = useState<string>('');
  const [numberInput, setNumberInput] = useState<string>('');
  const [isAssigningNumber, setIsAssigningNumber] = useState(false);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{
    id: string;
    filename: string;
    url: string;
    isImage: boolean;
    isPdf: boolean;
    category: string | null;
    createdAt: Date;
  } | null>(null);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<{
    kind: 'approve' | 'reject' | 'revise' | 'number';
    message: string;
  } | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWD1 = letter?.currentStep === 7;
  const isSupervisor = letter?.currentStep === 5; // Supervisor Akademik
  const isUPA = letter?.currentStep === 8;
  const needsSignature = isWD1;

  // Load preview
  useEffect(() => {
    if (letter?.id) {
      setIsLoadingPreview(true);
      letterService.getPreview(letter.id)
        .then((preview) => {
          setPreviewData({
            previewUrl: preview.previewUrl,
            htmlContent: (preview as any).htmlContent,
            isPDF: preview.isPDF,
            format: preview.format,
          });
        })
        .catch((err) => {
          console.error('Error loading preview:', err);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [letter?.id]);

  // Load numbering suggestion for UPA
  useEffect(() => {
    if (!letter?.id || !isUPA) return;

    letterService.getNumberingSuggestion(letter.id, numberDate)
      .then((data) => {
        setNumberSuggestion(data.suggestion);
        setNumberInput(data.suggestion);
      })
      .catch((err) => {
        console.error('Error loading numbering suggestion:', err);
      });
  }, [letter?.id, isUPA, numberDate]);

  useEffect(() => () => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
  }, []);

  const showActionSuccess = (kind: 'approve' | 'reject' | 'revise' | 'number', message: string) => {
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    setActionSuccess({ kind, message });
    successTimeoutRef.current = setTimeout(() => {
      setActionSuccess(null);
      successTimeoutRef.current = null;
    }, 2800);
  };

  const handleSignatureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSignatureError(null);
    setSignatureMethod('UPLOAD');

    if (!file) {
      setSignatureData(null);
      setSignaturePreview(null);
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      setSignatureError('Format tanda tangan harus PNG atau JPG');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setSignatureError('Ukuran file maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSignatureData(result);
      setSignaturePreview(result);
    };
    reader.onerror = () => {
      setSignatureError('Gagal membaca file tanda tangan');
    };
    reader.readAsDataURL(file);
  };

  const setupSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1D1D1F';
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (signaturePreview) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = signaturePreview;
    }
  };

  useEffect(() => {
    if (!needsSignature || signatureMode !== 'draw') return;

    setupSignatureCanvas();
    const handleResize = () => setupSignatureCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [needsSignature, signatureMode, signaturePreview]);

  const getSignaturePoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handleSignaturePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (signatureMode !== 'draw') return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.setPointerCapture(event.pointerId);
    const point = getSignaturePoint(event);
    if (!point) return;

    isDrawingRef.current = true;
    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasDrawnSignature(true);
    }
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const handleSignaturePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const point = getSignaturePoint(event);
    if (!point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    if (!hasDrawnRef.current) {
      hasDrawnRef.current = true;
      setHasDrawnSignature(true);
    }
  };

  const finalizeSignatureDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (event && signatureCanvasRef.current) {
      signatureCanvasRef.current.releasePointerCapture(event.pointerId);
    }

    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (!hasDrawnRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setSignatureMethod('DRAW');
    setSignatureData(dataUrl);
    setSignaturePreview(dataUrl);
    setSignatureError(null);
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    hasDrawnRef.current = false;
    setHasDrawnSignature(false);
    setSignatureData(null);
    setSignaturePreview(null);
  };

  const switchSignatureMode = (mode: 'draw' | 'upload') => {
    setSignatureMode(mode);
    setSignatureMethod(mode === 'draw' ? 'DRAW' : 'UPLOAD');
    setSignatureError(null);
    setSignatureData(null);
    setSignaturePreview(null);
    hasDrawnRef.current = false;
    setHasDrawnSignature(false);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = '';
    }
  };

  const handleAction = async (type: 'approve' | 'reject' | 'revise') => {
    if (!letter) return;

    if (type === 'reject' || type === 'revise') {
      const trimmed = comment.trim();
      if (!trimmed) {
        setSubmitError(`${type === 'reject' ? 'Penolakan' : 'Revisi'} memerlukan komentar`);
        return;
      }
      if (trimmed.length < 10) {
        setSubmitError('Komentar minimal 10 karakter untuk penolakan dan revisi.');
        return;
      }
    }

    if (type === 'approve' && needsSignature && !signatureData) {
      setSubmitError('Tanda tangan diperlukan untuk Wakil Dekan 1');
      return;
    }

    setActionType(type);
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    if (!letter || !actionType) return;

    if ((actionType === 'reject' || actionType === 'revise') && (comment || '').trim().length < 10) {
      setSubmitError('Komentar minimal 10 karakter untuk penolakan dan revisi.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (actionType === 'approve') {
        await letterService.approve(
          letter.id,
          comment || undefined,
          signatureData ? { method: signatureMethod, data: signatureData } : undefined
        );
      } else if (actionType === 'reject') {
        await letterService.reject(letter.id, (comment || '').trim());
      } else if (actionType === 'revise') {
        await letterService.revise(letter.id, (comment || '').trim());
      }

      await refetch();
      await refetchQueue();

      const kind = actionType;
      setShowConfirmDialog(false);
      setActionType(null);
      setComment('');
      clearSignatureCanvas();
      if (signatureInputRef.current) signatureInputRef.current.value = '';
      setSignatureError(null);
      setSignatureData(null);
      setSignaturePreview(null);
      setSubmitError(null);
      setIsSubmitting(false);

      const msg =
        kind === 'approve'
          ? 'Surat berhasil disetujui'
          : kind === 'reject'
            ? 'Surat ditolak'
            : 'Surat berhasil direvisi';
      showActionSuccess(kind, msg);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses aksi';
      setSubmitError(errorMessage);
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const handleAssignNumber = async () => {
    if (!letter?.id || !numberInput.trim()) return;

    setIsAssigningNumber(true);
    setNumberError(null);

    try {
      await letterService.assignNumber(letter.id, numberInput.trim().toUpperCase(), numberDate);
      await refetch();
      await refetchQueue();
      showActionSuccess('number', 'Nomor surat berhasil ditetapkan');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menetapkan nomor';
      setNumberError(errorMessage);
    } finally {
      setIsAssigningNumber(false);
    }
  };

  const handleOpenAttachmentPreview = (attachment: {
    id: string;
    filename: string;
    category: string | null;
    createdAt: Date;
  }) => {
    const fileExtension = attachment.filename?.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
    const isPdf = fileExtension === 'pdf';
    const url = `${API_URL}/letter/${letter?.id}/attachments/${attachment.id}/download`;
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

  if (error || !letter) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Surat tidak ditemukan'}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const formValues = letter.values as Record<string, any>;
  const stepHistory = letter.stepHistory || [];
  const attachments = letter.attachments || [];
  const sortedHistory = [...stepHistory].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const letterNumber = letter.letterNumber || letter.numbering?.numberString || null;
  const isFinalDocument = !!letterNumber;

  const activeRole = user?.roles?.map((r: { name?: string }) => r.name).find((n) =>
    APPROVER_ROLES.includes(n as typeof APPROVER_ROLES[number])
  ) ?? null;
  const myStep = activeRole ? ROLE_TO_STEP[activeRole] : null;
  const approvedEntry = myStep != null && user?.id
    ? stepHistory.find(
        (h) =>
          h.action === 'APPROVED' &&
          h.step === myStep &&
          (h.actorUserId === user.id || (h.actor as { id?: string } | undefined)?.id === user.id)
      )
    : undefined;
  const approvedByMe = !!approvedEntry;
  const approvedAt = approvedEntry?.createdAt;
  const viewOnly = searchParams.get('view') === '1' || approvedByMe;
  const isCompleted = letter?.status === 'COMPLETED';

  const SummaryItem = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#86868B]">{label}</span>
      <span className="text-sm font-medium text-[#1D1D1F] break-words">{value || '-'}</span>
    </div>
  );

  const DetailRow = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 py-3 px-5 border-b border-[#E5E5E7] last:border-0">
      <div className="text-sm text-[#86868B]">{label}</div>
      <div className="text-sm font-medium text-[#1D1D1F]">{value || '-'}</div>
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
    animDelay = 0,
  }: {
    role: string;
    time: string;
    status: string;
    note?: string | null;
    action: string;
    isLatest?: boolean;
    isLast?: boolean;
    animDelay?: number;
  }) => {
    const StatusIcon = getTimelineIcon(action);
    const colorClass = getTimelineStatusColor(action);
    return (
      <div
        className="group relative pl-7 animate-in fade-in slide-in-from-left-2 duration-300"
        style={{ animationDelay: `${animDelay}ms`, animationFillMode: 'both' }}
      >
        {!isLast && (
          <div
            className={`absolute left-[6px] top-5 bottom-0 w-px transition-colors duration-200 ${
              isLatest ? 'bg-[#0071E3]' : 'bg-[#E5E5E7] group-hover:bg-[#0071E3]'
            }`}
          />
        )}
        <div
          className={`absolute left-0 top-4 w-3 h-3 rounded-full border-2 transition-all duration-200 ${
            isLatest ? 'border-[#0071E3] bg-[#0071E3]' : 'border-[#E5E5E7] bg-white'
          }`}
        />
        <div
          className={`relative -ml-1 rounded-xl px-4 py-3 transition-colors duration-200 ${isLast ? 'pb-0' : 'pb-4'} ${
            isLatest ? '' : 'hover:bg-[#F5F5F7]/80'
          }`}
        >
          <div>
            <p className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">{role}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-[#86868B]">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{time}</span>
            </div>
          </div>
          <div className={`mt-2.5 flex items-center gap-2 ${colorClass}`}>
            <StatusIcon className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold">{status}</span>
          </div>
          {note && (
            <div className="mt-3 rounded-r-lg border-l-2 border-[#E5E5E7] bg-[#F5F5F7]/90 py-2.5 pl-3.5 pr-1">
              <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-1">Catatan</p>
              <p className="text-sm text-[#1D1D1F] leading-relaxed whitespace-pre-line">
                {note}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center text-[16px] text-[#86868B] mb-[32px] font-lexend">
          <button
            onClick={() => router.push('/dashboard/approval/queue')}
            className="text-[#0071E3] hover:text-[#0051A3] transition-colors"
          >
            Antrian Approval
          </button>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <span className="font-medium text-[#1D1D1F]">Detail Approval</span>
        </div>

        {/* Success feedback */}
        {actionSuccess && (() => {
          const config = {
            approve: { Icon: CheckCircle2, border: 'border-[#1E8E3E]/30', bg: 'bg-[#1E8E3E]/5', text: 'text-[#1E8E3E]', bar: 'bg-[#1E8E3E]' },
            reject: { Icon: XCircle, border: 'border-[#D93025]/30', bg: 'bg-[#D93025]/5', text: 'text-[#D93025]', bar: 'bg-[#D93025]' },
            revise: { Icon: RotateCcw, border: 'border-[#B26A00]/30', bg: 'bg-[#B26A00]/5', text: 'text-[#B26A00]', bar: 'bg-[#B26A00]' },
            number: { Icon: FileCheck, border: 'border-[#0071E3]/30', bg: 'bg-[#0071E3]/5', text: 'text-[#0071E3]', bar: 'bg-[#0071E3]' },
          };
          const { Icon, border, bg, text, bar } = config[actionSuccess.kind];
          return (
            <div
              className={`relative overflow-hidden rounded-xl border ${border} ${bg} px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 mb-6`}
              role="status"
              aria-live="polite"
            >
              <Icon className={`w-5 h-5 shrink-0 ${text} animate-in zoom-in duration-300`} />
              <p className={`font-semibold text-[15px] ${text}`}>{actionSuccess.message}</p>
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${bar} opacity-40 rounded-b-xl animate-success-bar-shrink`} />
            </div>
          );
        })()}

        {/* Header */}
        <div className="mb-[32px]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-lexend font-bold text-[30px] leading-[36px] tracking-[-0.5px] text-[#1D1D1F] mb-2">
                Review Surat
              </h1>
              <p className="font-lexend font-normal text-[16px] leading-[24px] text-[#86868B]">
                Step: {getStepLabel(letter.currentStep)}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/approval/queue')}
              className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="flex flex-col gap-6">
            <Card className="bg-white border-[#E5E5E7] shadow-sm">
              <CardHeader className="border-b border-[#E5E5E7]">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                  Ringkasan Surat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SummaryItem label="ID Surat" value={letter.id} />
                  <SummaryItem label="Jenis Surat" value={letter.letterType?.name || 'PKL'} />
                  <SummaryItem label="Status" value={getStatusDisplayLabel(letter.status, letter.currentStep)} />
                  <SummaryItem label="Step Saat Ini" value={getStepLabel(letter.currentStep)} />
                  <SummaryItem label="Nomor Surat" value={letterNumber} />
                  <SummaryItem label="Diajukan Oleh" value={letter.createdBy?.name} />
                  <SummaryItem label="Email Pengaju" value={letter.createdBy?.email} />
                  <SummaryItem label="Tanggal Pengajuan" value={formatDateTime(letter.createdAt)} />
                  <SummaryItem label="Terakhir Diperbarui" value={formatDateTime(letter.updatedAt)} />
                </div>
              </CardContent>
            </Card>

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

            <Card className="bg-white border-[#E5E5E7] shadow-sm">
              <CardHeader className="border-b border-[#E5E5E7]">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                  Detail Surat Pengajuan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                {(letterNumber || letter.numbering?.numberString) && (
                  <DetailRow label="Nomor Surat" value={letterNumber} />
                )}
                <DetailRow label="Status" value={getStatusDisplayLabel(letter.status, letter.currentStep)} />
              </CardContent>
            </Card>

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
                    {attachments.map((attachment) => {
                      const fileExtension = attachment.filename?.split('.').pop()?.toLowerCase() || '';
                      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                      const isPdf = fileExtension === 'pdf';
                      const downloadUrl = `${API_URL}/letter/${letter.id}/attachments/${attachment.id}/download`;

                      return (
                        <div key={attachment.id} className="border border-[#E5E5E7] rounded-lg overflow-hidden">
                          <div className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F5F7]">
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-[#E5E5E7]">
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
                                  {attachment.filename}
                                </span>
                                <span className="text-xs text-[#86868B]">
                                  {getAttachmentCategoryLabel(attachment.category)} • {formatDateTime(attachment.createdAt)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAttachmentPreview(attachment)}
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
            <Card className="bg-white border-[#E5E5E7] shadow-sm">
              <CardHeader className="border-b border-[#E5E5E7]">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                  Surat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {isSupervisor && (
                  <Button
                    onClick={() => router.push(`/dashboard/approval/${letter.id}/edit`)}
                    className="w-full bg-[#0071E3] text-white hover:bg-[#0051A3]"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Surat
                  </Button>
                )}
                <div className={isSupervisor ? 'pt-4 border-t border-[#E5E5E7]' : ''}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#1D1D1F]">
                        {isFinalDocument ? 'Surat Final' : 'Preview Surat Sementara'}
                      </p>
                      <p className="text-xs text-[#86868B]">
                        {isLoadingPreview
                          ? 'Memuat preview...'
                          : previewData
                            ? isFinalDocument
                              ? 'Surat final sudah tersedia.'
                              : 'Surat masih sementara. Final tersedia setelah penomoran.'
                            : 'Preview tidak tersedia.'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDocumentPreview(true)}
                      disabled={isLoadingPreview || !previewData}
                      className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                    >
                      {isFinalDocument ? 'Lihat Final' : 'Lihat Draft'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isCompleted ? (
              <Card className="bg-white border-[#E5E5E7] shadow-sm">
                <CardContent className="p-6">
                  <Alert className="border-[#E7F9EE] bg-[#E7F9EE]/50 text-[#1E8E3E]">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Surat telah diterbitkan
                      {letterNumber ? ` (${letterNumber})` : ''}.
                      Gunakan tombol &quot;Lihat Final&quot; di atas untuk melihat atau mengunduh surat.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : viewOnly ? (
              <Card className="bg-white border-[#E5E5E7] shadow-sm">
                <CardContent className="p-6">
                  <Alert className="border-[#E7F9EE] bg-[#E7F9EE]/50 text-[#1E8E3E]">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Anda telah menyetujui surat ini
                      {approvedAt ? ` pada ${formatDateTime(approvedAt)}` : ''}.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : isUPA ? (
              <Card className="bg-white border-[#E5E5E7] shadow-sm">
                <CardHeader className="border-b border-[#E5E5E7]">
                  <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                    Penomoran Surat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-[#86868B] mb-4">
                    Masuk ke halaman proses penomoran untuk mengisi nomor surat dan menerbitkannya.
                  </p>
                  <Button
                    onClick={() => router.push(`/dashboard/approval/${letter.id}/proses`)}
                    className="w-full bg-[#0071E3] text-white hover:bg-[#0051A3]"
                  >
                    Proses Penomoran
                  </Button>
                </CardContent>
              </Card>
            ) : isWD1 ? (
              <Card className="bg-white border-[#E5E5E7] shadow-sm">
                <CardHeader className="border-b border-[#E5E5E7]">
                  <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">Tindakan Approval</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {submitError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Komentar (opsional)</label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tambahkan komentar untuk reject/revisi (wajib min. 10 karakter)"
                        className="min-h-[100px] bg-white border-[#E5E5E7] focus:border-[#0071E3]"
                      />
                    </div>
                    <p className="text-sm text-[#86868B]">Masuk ke halaman proses tanda tangan untuk menandatangani dan menyetujui surat.</p>
                    <Button onClick={() => router.push(`/dashboard/approval/${letter.id}/proses`)} className="w-full bg-[#0071E3] text-white hover:bg-[#0051A3]">
                      Proses TTD
                    </Button>
                    <div className="flex flex-col gap-3 pt-2 border-t border-[#E5E5E7]">
                      <Button onClick={() => handleAction('reject')} disabled={isSubmitting} variant="destructive" className="w-full">
                        {isSubmitting && actionType === 'reject' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</> : <><XCircle className="w-4 h-4 mr-2" /> Tolak</>}
                      </Button>
                      <Button onClick={() => handleAction('revise')} disabled={isSubmitting} variant="outline" className="w-full bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]">
                        {isSubmitting && actionType === 'revise' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</> : <><Edit className="w-4 h-4 mr-2" /> Revisi</>}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white border-[#E5E5E7] shadow-sm">
                <CardHeader className="border-b border-[#E5E5E7]">
                  <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                    Tindakan Approval
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {submitError && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
                        Komentar {needsSignature && '(Opsional)'}
                      </label>
                      <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tambahkan komentar (opsional untuk approve, wajib min. 10 karakter untuk reject/revisi)"
                        className="min-h-[100px] bg-white border-[#E5E5E7] focus:border-[#0071E3]"
                      />
                    </div>

                    {needsSignature && (
                      <div>
                        <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
                          Tanda Tangan <span className="text-[#FF3B30]">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Button
                            type="button"
                            onClick={() => switchSignatureMode('draw')}
                            variant={signatureMode === 'draw' ? 'default' : 'outline'}
                            className="h-8 px-3 text-xs"
                          >
                            Tanda Tangan Langsung
                          </Button>
                          <Button
                            type="button"
                            onClick={() => switchSignatureMode('upload')}
                            variant={signatureMode === 'upload' ? 'default' : 'outline'}
                            className="h-8 px-3 text-xs"
                          >
                            Upload Gambar
                          </Button>
                        </div>

                        {signatureMode === 'draw' ? (
                          <div className="space-y-2">
                            <div className="rounded-lg border border-[#E5E5E7] bg-white p-3">
                              <p className="text-xs text-[#86868B] mb-2">
                                Gunakan mouse atau sentuhan untuk menulis tanda tangan.
                              </p>
                              <canvas
                                ref={signatureCanvasRef}
                                className="w-full h-40 border border-dashed border-[#D2D2D7] rounded-md touch-none cursor-crosshair bg-white"
                                onPointerDown={handleSignaturePointerDown}
                                onPointerMove={handleSignaturePointerMove}
                                onPointerUp={finalizeSignatureDrawing}
                                onPointerLeave={finalizeSignatureDrawing}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-[#86868B]">
                                {hasDrawnSignature ? 'Tanda tangan siap digunakan.' : 'Belum ada tanda tangan.'}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                onClick={clearSignatureCanvas}
                              >
                                Hapus
                              </Button>
                            </div>
                            {signatureError && (
                              <p className="text-xs text-[#FF3B30]">{signatureError}</p>
                            )}
                          </div>
                        ) : (
                          <>
                            <Input
                              ref={signatureInputRef}
                              type="file"
                              accept="image/png,image/jpeg"
                              onChange={handleSignatureChange}
                              className="bg-white border-[#E5E5E7] focus:border-[#0071E3]"
                            />
                            {signatureError && (
                              <p className="text-xs text-[#FF3B30] mt-2">{signatureError}</p>
                            )}
                            {signaturePreview && (
                              <div className="mt-3 p-3 border border-[#E5E5E7] rounded-lg bg-white">
                                <img
                                  src={signaturePreview}
                                  alt="Preview Tanda Tangan"
                                  className="max-h-32 object-contain"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                      <Button
                        onClick={() => handleAction('approve')}
                        disabled={isSubmitting || (needsSignature && !signatureData)}
                        className="w-full bg-[#0071E3] text-white hover:bg-[#0051A3] disabled:opacity-50"
                      >
                        {isSubmitting && actionType === 'approve' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Setujui
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleAction('reject')}
                        disabled={isSubmitting}
                        variant="destructive"
                        className="w-full"
                      >
                        {isSubmitting && actionType === 'reject' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Tolak
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleAction('revise')}
                        disabled={isSubmitting}
                        variant="outline"
                        className="w-full bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                      >
                        {isSubmitting && actionType === 'revise' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Edit className="w-4 h-4 mr-2" />
                            Revisi
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white border border-[#E5E5E7] shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-[#E5E5E7] py-5 px-6">
                <CardTitle className="text-[18px] font-semibold text-[#1D1D1F] tracking-tight">
                  Riwayat Proses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {sortedHistory.length === 0 ? (
                  <p className="text-sm text-[#86868B] text-center py-4">Belum ada riwayat</p>
                ) : (
                  <>
                    {(() => {
                      const limit = 3;
                      const expanded = historyExpanded;
                      const displayed = expanded ? sortedHistory : sortedHistory.slice(0, limit);
                      const hasMore = sortedHistory.length > limit;
                      return (
                        <>
                          <div className="flex flex-col gap-0">
                            {displayed.map((history, index) => (
                              <TimelineItem
                                key={history.id}
                                role={history.actor?.name || history.actorRole || 'System'}
                                time={formatDateTime(history.createdAt)}
                                status={getStatusLabel(history.action, history.step)}
                                note={history.comment}
                                action={history.action}
                                isLatest={index === 0}
                                isLast={index === displayed.length - 1}
                                animDelay={index * 50}
                              />
                            ))}
                          </div>
                          {hasMore && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setHistoryExpanded(!expanded)}
                              className="mt-4 w-full rounded-xl py-2 text-[#0071E3] hover:bg-[#0071E3]/5 hover:text-[#0051A3] font-medium transition-colors"
                            >
                              {expanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-2" />
                                  Tutup
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-2" />
                                  Tampilkan {sortedHistory.length - limit} lagi
                                </>
                              )}
                            </Button>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Konfirmasi {actionType === 'approve' ? 'Persetujuan' : actionType === 'reject' ? 'Penolakan' : 'Revisi'}
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <span>Apakah Anda yakin ingin {actionType === 'approve' ? 'menyetujui' : actionType === 'reject' ? 'menolak' : 'merevisi'} surat ini?</span>
              </div>
            </DialogDescription>
          </DialogHeader>
          {comment && (
            <div className="mt-2 p-3 bg-[#F5F5F7] rounded-lg">
              <p className="text-sm font-medium mb-1">Komentar:</p>
              <p className="text-sm text-[#86868B]">{comment}</p>
            </div>
          )}
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={confirmAction}
              disabled={isSubmitting}
              className={actionType === 'reject' ? 'bg-[#FF3B30] hover:bg-[#D32F2F]' : 'bg-[#0071E3] hover:bg-[#0051A3]'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Konfirmasi'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                    {getAttachmentCategoryLabel(previewAttachment.category)} • {formatDateTime(previewAttachment.createdAt)}
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

      <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
        <DialogContent className="max-w-[1100px] w-[92vw] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-[#E5E5E7] pr-12">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg">
                  {isFinalDocument ? 'Surat Final' : 'Preview Surat Sementara'}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#86868B]">
                  {isFinalDocument
                    ? 'Surat final sudah bernomor dan siap didistribusikan.'
                    : 'Surat ini masih draft. Surat final tersedia setelah penomoran.'}
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
