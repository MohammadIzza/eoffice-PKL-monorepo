'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useLetter, useApprovalQueue } from '@/hooks/api';
import { letterService } from '@/services';
import { 
  Loader2, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  XCircle,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { letter, isLoading, error, refetch } = useLetter(id);
  const { refetch: refetchQueue } = useApprovalQueue();
  const { user } = useAuthStore();
  
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    previewUrl: string;
    htmlContent?: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revise' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isWD1 = letter?.currentStep === 7;
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

  const handleAction = async (type: 'approve' | 'reject' | 'revise') => {
    if (!letter) return;

    if (type === 'reject' || type === 'revise') {
      if (!comment.trim()) {
        setSubmitError(`${type === 'reject' ? 'Penolakan' : 'Revisi'} memerlukan komentar`);
        return;
      }
    }

    if (type === 'approve' && needsSignature) {
      // TODO: Implement signature upload for WD1
      setSubmitError('Tanda tangan diperlukan untuk Wakil Dekan 1');
      return;
    }

    setActionType(type);
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    if (!letter || !actionType) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (actionType === 'approve') {
        await letterService.approve(letter.id, comment || undefined);
      } else if (actionType === 'reject') {
        await letterService.reject(letter.id, comment);
      } else if (actionType === 'revise') {
        await letterService.revise(letter.id, comment);
      }

      // Refresh data
      await refetch();
      await refetchQueue();
      
      // Redirect to queue
      router.push('/dashboard/approval/queue');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal memproses aksi';
      setSubmitError(errorMessage);
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
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

  const values = letter.values as Record<string, any>;

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

        {/* Preview */}
        <Card className="bg-white border-[#E5E5E7] shadow-sm mb-6">
          <CardHeader className="border-b border-[#E5E5E7]">
            <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
              Preview Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoadingPreview ? (
              <Skeleton className="h-96 w-full" />
            ) : previewData ? (
              <div className="border border-[#E5E5E7] rounded-lg overflow-hidden">
                {previewData.htmlContent ? (
                  <iframe
                    srcDoc={previewData.htmlContent}
                    className="w-full h-[800px] border-none"
                    title="Document Preview"
                  />
                ) : (
                  <iframe
                    src={previewData.previewUrl}
                    className="w-full h-[800px] border-none"
                    title="Document Preview"
                  />
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-[#86868B]">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Preview tidak tersedia</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Form */}
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
                  placeholder="Tambahkan komentar (opsional untuk approve, wajib untuk reject/revisi)"
                  className="min-h-[100px] bg-white border-[#E5E5E7] focus:border-[#0071E3]"
                />
              </div>

              {needsSignature && (
                <div>
                  <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
                    Tanda Tangan <span className="text-[#FF3B30]">*</span>
                  </label>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Fitur upload tanda tangan untuk Wakil Dekan 1 akan segera tersedia.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={isSubmitting || (needsSignature && true)}
                  className="flex-1 bg-[#0071E3] text-white hover:bg-[#0051A3] disabled:opacity-50"
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
                  className="flex-1"
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
                  className="flex-1 bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
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
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Konfirmasi {actionType === 'approve' ? 'Persetujuan' : actionType === 'reject' ? 'Penolakan' : 'Revisi'}
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin {actionType === 'approve' ? 'menyetujui' : actionType === 'reject' ? 'menolak' : 'merevisi'} surat ini?
              {comment && (
                <div className="mt-4 p-3 bg-[#F5F5F7] rounded-lg">
                  <p className="text-sm font-medium mb-1">Komentar:</p>
                  <p className="text-sm text-[#86868B]">{comment}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
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
    </div>
  );
}
