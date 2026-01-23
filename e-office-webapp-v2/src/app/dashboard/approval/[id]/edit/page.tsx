'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useLetter } from '@/hooks/api';
import { letterService } from '@/services';
import { 
  Loader2, 
  FileText, 
  AlertCircle, 
  Save,
  Send,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { useAuthStore } from '@/stores';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

// Dynamic import untuk Quill (client-side only)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

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

export default function DocumentEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { letter, isLoading, error, refetch } = useLetter(id);
  const { user } = useAuthStore();
  
  const [htmlContent, setHtmlContent] = useState('');
  const [originalHtml, setOriginalHtml] = useState('');
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishComment, setPublishComment] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isSupervisor = letter?.currentStep === 5;
  const hasChanges = htmlContent !== originalHtml;

  // Load editable document
  useEffect(() => {
    if (letter?.id && isSupervisor) {
      setIsLoadingDocument(true);
      letterService.getEditableDocument(letter.id)
        .then((data) => {
          setHtmlContent(data.html);
          setOriginalHtml(data.html);
        })
        .catch((err) => {
          console.error('Error loading editable document:', err);
          setSaveError(err instanceof Error ? err.message : 'Gagal memuat dokumen');
        })
        .finally(() => {
          setIsLoadingDocument(false);
        });
    }
  }, [letter?.id, isSupervisor]);

  // Auto-save draft setiap 30 detik jika ada perubahan
  useEffect(() => {
    if (htmlContent && hasChanges && !isSaving && !isPublishing && letter?.id) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveDraft();
      }, 30000); // 30 detik

      return () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlContent, hasChanges, isSaving, isPublishing]);

  const handleSaveDraft = async () => {
    if (!letter || !hasChanges) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await letterService.saveDraft(letter.id, htmlContent);
      setLastSaved(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menyimpan draft';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!letter) return;

    setIsPublishing(true);
    setSaveError(null);

    try {
      await letterService.publishVersion(letter.id, htmlContent, publishComment || undefined);
      
      // Refresh data
      await refetch();
      
      // Redirect to approval detail
      router.push(`/dashboard/approval/${letter.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mempublish versi';
      setSaveError(errorMessage);
      setIsPublishing(false);
      setShowPublishDialog(false);
    }
  };

  const handlePreview = () => {
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  };

  // Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  if (isLoading || isLoadingDocument) {
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

  if (!isSupervisor) {
    return (
      <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
        <div className="max-w-7xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Hanya Supervisor Akademik yang dapat mengedit dokumen pada step ini.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-[40px] py-[32px] overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center text-[16px] text-[#86868B] mb-[32px] font-lexend">
          <button
            onClick={() => router.push(`/dashboard/approval/${letter.id}`)}
            className="text-[#0071E3] hover:text-[#0051A3] transition-colors"
          >
            Detail Approval
          </button>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <span className="font-medium text-[#1D1D1F]">Edit Dokumen</span>
        </div>

        {/* Header */}
        <div className="mb-[32px]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-lexend font-bold text-[30px] leading-[36px] tracking-[-0.5px] text-[#1D1D1F] mb-2">
                Edit Dokumen
              </h1>
              <p className="font-lexend font-normal text-[16px] leading-[24px] text-[#86868B]">
                Step: {getStepLabel(letter.currentStep)} - Versi: {letter.latestEditableVersion || 1}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/approval/${letter.id}`)}
              className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        {saveError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {lastSaved && (
          <Alert className="mb-6 bg-[#F5F5F7] border-[#E5E5E7]">
            <AlertDescription className="text-[#86868B]">
              Draft terakhir disimpan: {lastSaved.toLocaleTimeString('id-ID')}
            </AlertDescription>
          </Alert>
        )}

        {/* Editor */}
        <Card className="bg-white border-[#E5E5E7] shadow-sm mb-6">
          <CardHeader className="border-b border-[#E5E5E7]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[18px] font-semibold text-[#1D1D1F]">
                Editor Dokumen
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <span className="text-xs text-[#FF9500] font-medium">
                    Ada perubahan yang belum disimpan
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="border border-[#E5E5E7] rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={htmlContent}
                onChange={setHtmlContent}
                modules={quillModules}
                style={{ minHeight: '600px' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-white border-[#E5E5E7] shadow-sm">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Button
                onClick={handleSaveDraft}
                disabled={isSaving || !hasChanges}
                variant="outline"
                className="flex-1 bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Draft
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowPublishDialog(true)}
                disabled={isPublishing || !hasChanges}
                className="flex-1 bg-[#0071E3] text-white hover:bg-[#0051A3]"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Mempublish...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publish Versi Baru
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-[#86868B] mt-4 text-center">
              Publish versi baru akan membuat versi dokumen baru dan dapat dilihat oleh approver berikutnya.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Versi Baru</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mempublish versi baru dokumen ini? Versi baru akan tersedia untuk approver berikutnya.
              {hasChanges && (
                <div className="mt-4 p-3 bg-[#F5F5F7] rounded-lg">
                  <p className="text-sm font-medium mb-1">Perubahan:</p>
                  <p className="text-sm text-[#86868B]">
                    Dokumen telah dimodifikasi. Versi baru akan dibuat dengan perubahan ini.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] mb-2">
                Komentar (Opsional)
              </label>
              <textarea
                value={publishComment}
                onChange={(e) => setPublishComment(e.target.value)}
                placeholder="Tambahkan komentar tentang perubahan dokumen..."
                className="w-full min-h-[100px] p-3 border border-[#E5E5E7] rounded-lg focus:border-[#0071E3] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowPublishDialog(false);
                setPublishComment('');
              }}
              disabled={isPublishing}
            >
              Batal
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-[#0071E3] hover:bg-[#0051A3]"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mempublish...
                </>
              ) : (
                'Publish'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
