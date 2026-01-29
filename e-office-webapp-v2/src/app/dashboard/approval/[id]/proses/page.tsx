'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useLetter } from '@/hooks/api';
import { letterService } from '@/services';
import { formatDate, formatDateTime } from '@/lib/utils/date.utils';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileSignature,
  Hash,
} from 'lucide-react';

const WD1_STEP = 7;
const UPA_STEP = 8;

export default function ProsesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { letter, isLoading, error, refetch } = useLetter(id);

  const [previewData, setPreviewData] = useState<{
    previewUrl: string;
    htmlContent?: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // WD1: signature
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  // UPA: numbering
  const [numberDate, setNumberDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [numberInput, setNumberInput] = useState('');
  const [numberSuggestion, setNumberSuggestion] = useState('');
  const [previewNumber, setPreviewNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const previewNumberDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWD1 = letter?.currentStep === WD1_STEP;
  const isUPA = letter?.currentStep === UPA_STEP;
  const mode = isWD1 ? 'wd1' : isUPA ? 'upa' : null;

  // Redirect if not WD1 or UPA, or surat sudah diterbitkan
  useEffect(() => {
    if (isLoading || !letter) return;
    if (!mode || letter.status === 'COMPLETED') {
      router.replace(`/dashboard/approval/${id}`);
      return;
    }
  }, [id, isLoading, letter, mode, router]);

  // Load preview: WD1 no number, UPA use previewNumber when set
  useEffect(() => {
    if (!letter?.id || !mode) return;
    setIsLoadingPreview(true);
    const number = isUPA && previewNumber.trim() ? previewNumber.trim() : undefined;
    letterService
      .getPreview(letter.id, number)
      .then((p) => {
        setPreviewData({
          previewUrl: (p as any).previewUrl,
          htmlContent: (p as any).htmlContent,
        });
      })
      .catch((e) => {
        console.error('Preview load error:', e);
        setPreviewData(null);
      })
      .finally(() => setIsLoadingPreview(false));
  }, [letter?.id, mode, isUPA, previewNumber]);

  // UPA: suggestion + default previewNumber
  useEffect(() => {
    if (!letter?.id || !isUPA) return;
    letterService
      .getNumberingSuggestion(letter.id, numberDate)
      .then((d) => {
        setNumberSuggestion(d.suggestion);
        setNumberInput(d.suggestion);
        if (!previewNumber) setPreviewNumber(d.suggestion);
      })
      .catch((e) => console.error('Suggestion error:', e));
  }, [letter?.id, isUPA, numberDate]);

  // UPA: debounce previewNumber from numberInput
  useEffect(() => {
    if (!isUPA) return;
    if (previewNumberDebounceRef.current) clearTimeout(previewNumberDebounceRef.current);
    previewNumberDebounceRef.current = setTimeout(() => {
      setPreviewNumber(numberInput);
      previewNumberDebounceRef.current = null;
    }, 400);
    return () => {
      if (previewNumberDebounceRef.current) clearTimeout(previewNumberDebounceRef.current);
    };
  }, [isUPA, numberInput]);

  // Canvas setup (WD1 draw)
  const setupCanvas = () => {
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
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = signaturePreview;
    }
  };

  useEffect(() => {
    if (!isWD1 || signatureMode !== 'draw') return;
    setupCanvas();
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isWD1, signatureMode, signaturePreview]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (signatureMode !== 'draw') return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const p = getPoint(e);
    if (!p) return;
    isDrawingRef.current = true;
    hasDrawnRef.current = true;
    setHasDrawnSignature(true);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const p = getPoint(e);
    if (!p) return;
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const onPointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (e && signatureCanvasRef.current) signatureCanvasRef.current.releasePointerCapture(e.pointerId);
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (!hasDrawnRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureData(dataUrl);
    setSignaturePreview(dataUrl);
    setSignatureError(null);
  };

  const clearCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasDrawnRef.current = false;
    setHasDrawnSignature(false);
    setSignatureData(null);
    setSignaturePreview(null);
  };

  const switchMode = (m: 'draw' | 'upload') => {
    setSignatureMode(m);
    setSignatureError(null);
    setSignatureData(null);
    setSignaturePreview(null);
    hasDrawnRef.current = false;
    setHasDrawnSignature(false);
    if (signatureInputRef.current) signatureInputRef.current.value = '';
  };

  const onSignatureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignatureError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSignatureData(null);
      setSignaturePreview(null);
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setSignatureError('Format harus PNG atau JPG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setSignatureError('Ukuran maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setSignatureData(res);
      setSignaturePreview(res);
    };
    reader.onerror = () => setSignatureError('Gagal membaca file');
    reader.readAsDataURL(file);
  };

  const handleSaveAndSign = async () => {
    if (!letter?.id || !signatureData) {
      setSubmitError('Tanda tangan wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await letterService.approve(letter.id, undefined, {
        method: signatureMode === 'draw' ? 'DRAW' : 'UPLOAD',
        data: signatureData,
      });
      await refetch();
      router.replace(`/dashboard/approval/${letter.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan tanda tangan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTerbitkan = async () => {
    if (!letter?.id || !numberInput.trim()) {
      setSubmitError('Nomor surat wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await letterService.assignNumber(letter.id, numberInput.trim().toUpperCase(), numberDate);
      await refetch();
      router.replace(`/dashboard/approval/${letter.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menerbitkan nomor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => router.push(`/dashboard/approval/${id}`);
  const handleTutup = () => router.push('/dashboard/approval/queue');

  if (isLoading || !letter) {
    return (
      <div className="flex-1 px-6 py-8 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !mode) {
    return (
      <div className="flex-1 px-6 py-8 max-w-7xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Akses ditolak. Halaman ini hanya untuk WD1 atau UPA.'}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push(`/dashboard/approval/${id}`)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Detail
        </Button>
      </div>
    );
  }

  const values = (letter.values || {}) as Record<string, unknown>;
  const applicantName = (values.namaLengkap as string) || (letter.createdBy as { name?: string })?.name || '-';
  const nim = (values.nim as string) || '-';
  const perihal = (values.jenisSurat as string) || (letter.letterType as { name?: string })?.name || 'Surat Pengantar PKL';
  const jenisSurat = (letter.letterType as { name?: string })?.name || 'Surat Pengantar PKL';

  return (
    <div className="flex-1 px-6 py-8 overflow-y-auto bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center text-[16px] text-[#86868B] mb-6 font-lexend">
          <button
            onClick={() => router.push('/dashboard/approval/queue')}
            className="text-[#0071E3] hover:text-[#0051A3] transition-colors"
          >
            Antrian Approval
          </button>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <button
            onClick={() => router.push(`/dashboard/approval/${id}`)}
            className="text-[#0071E3] hover:text-[#0051A3] transition-colors"
          >
            Detail Approval
          </button>
          <span className="mx-2 text-[#CBD5E1]">/</span>
          <span className="font-medium text-[#1D1D1F]">
            {isWD1 ? 'Proses TTD' : 'Proses Penomoran'}
          </span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-lexend font-bold text-[24px] leading-tight tracking-tight text-[#1D1D1F] mb-1">
            {isWD1 ? 'Proses Tanda Tangan Surat' : 'Proses Penomoran Surat'}
          </h1>
          <p className="text-[15px] text-[#86868B]">
            {isWD1
              ? 'Lengkapi tanda tangan dan cek kembali data sebelum nomor surat diterbitkan.'
              : 'Lengkapi nomor surat dan cek kembali data sebelum diterbitkan.'}
          </p>
        </div>

        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: Detail Permohonan + TTD or Number */}
          <div className="flex flex-col gap-6">
            <Card className="bg-white border border-[#E5E5E7] shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-[#E5E5E7] py-4 px-5">
                <CardTitle className="text-[16px] font-semibold text-[#1D1D1F]">
                  Detail Permohonan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-[#86868B]">Pengaju</span>
                  <span className="font-medium text-[#1D1D1F]">{applicantName}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-[#86868B]">NIM</span>
                  <span className="font-medium text-[#1D1D1F] font-mono">{nim}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-[#86868B]">Perihal</span>
                  <span className="font-medium text-[#1D1D1F]">{perihal}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-[#86868B]">Tgl Masuk</span>
                  <span className="font-medium text-[#1D1D1F]">{formatDateTime(letter.createdAt)}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="text-[#86868B]">Jenis Surat</span>
                  <span className="font-medium text-[#1D1D1F]">{jenisSurat}</span>
                </div>
              </CardContent>
            </Card>

            {isWD1 && (
              <Card className="bg-white border border-[#E5E5E7] shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-[#E5E5E7] py-4 px-5">
                  <CardTitle className="text-[16px] font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <FileSignature className="w-4 h-4" />
                    Tanda Tangan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={signatureMode === 'draw' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => switchMode('draw')}
                      className="h-8"
                    >
                      Corat-coret
                    </Button>
                    <Button
                      type="button"
                      variant={signatureMode === 'upload' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => switchMode('upload')}
                      className="h-8"
                    >
                      Upload Gambar
                    </Button>
                  </div>
                  {signatureError && (
                    <p className="text-sm text-[#D93025]">{signatureError}</p>
                  )}
                  {signatureMode === 'draw' ? (
                    <div className="space-y-2">
                      <div className="rounded-xl border-2 border-dashed border-[#E5E5E7] bg-[#F5F5F7] p-4">
                        <p className="text-xs text-[#86868B] mb-2">
                          Gunakan mouse atau sentuhan untuk menulis tanda tangan.
                        </p>
                        <canvas
                          ref={signatureCanvasRef}
                          className="w-full h-36 border border-[#E5E5E7] rounded-lg touch-none cursor-crosshair bg-white"
                          onPointerDown={onPointerDown}
                          onPointerMove={onPointerMove}
                          onPointerUp={onPointerUp}
                          onPointerLeave={() => onPointerUp()}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-[#86868B]">
                          {hasDrawnSignature ? 'Tanda tangan siap.' : 'Belum ada tanda tangan.'}
                        </p>
                        <Button type="button" variant="outline" size="sm" onClick={clearCanvas} className="h-8">
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-[#E5E5E7] bg-[#F5F5F7] cursor-pointer hover:bg-[#EBEBED] transition-colors">
                        <input
                          ref={signatureInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="hidden"
                          onChange={onSignatureFileChange}
                        />
                        {signaturePreview ? (
                          <img
                            src={signaturePreview}
                            alt="Preview TTD"
                            className="max-h-24 object-contain"
                          />
                        ) : (
                          <span className="text-sm text-[#86868B]">Klik untuk upload PNG/JPG (maks. 2MB)</span>
                        )}
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isUPA && (
              <Card className="bg-white border border-[#E5E5E7] shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-[#E5E5E7] py-4 px-5">
                  <CardTitle className="text-[16px] font-semibold text-[#1D1D1F] flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Nomor Surat
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Tanggal</label>
                    <Input
                      type="date"
                      value={numberDate}
                      onChange={(e) => setNumberDate(e.target.value)}
                      className="bg-white border-[#E5E5E7] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1D1D1F] mb-2">Nomor Surat</label>
                    <div className="flex gap-2">
                      <Input
                        value={numberInput}
                        onChange={(e) => setNumberInput(e.target.value.toUpperCase())}
                        placeholder="AK15-01/DD/MM/YYYY"
                        className="bg-white border-[#E5E5E7] rounded-xl flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setNumberInput(numberSuggestion);
                          setPreviewNumber(numberSuggestion);
                        }}
                        disabled={!numberSuggestion}
                        className="shrink-0 border-[#E5E5E7]"
                      >
                        Gunakan Saran
                      </Button>
                    </div>
                    {numberSuggestion && (
                      <p className="text-xs text-[#86868B] mt-2">Saran: {numberSuggestion}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Pratinjau Surat */}
          <Card className="bg-white border border-[#E5E5E7] shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-[#E5E5E7] py-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-[16px] font-semibold text-[#1D1D1F]">
                Pratinjau Surat
              </CardTitle>
              {isUPA && previewNumber && (
                <span className="text-xs text-[#86868B]">Nomor: {previewNumber}</span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="min-h-[520px] bg-[#F5F5F7]">
                {isLoadingPreview ? (
                  <div className="flex items-center justify-center h-[480px]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#86868B]" />
                  </div>
                ) : previewData?.htmlContent ? (
                  <iframe
                    srcDoc={previewData.htmlContent}
                    className="w-full h-[520px] border-none rounded-b-2xl"
                    title="Pratinjau surat"
                  />
                ) : previewData?.previewUrl ? (
                  <iframe
                    src={previewData.previewUrl}
                    className="w-full h-[520px] border-none rounded-b-2xl"
                    title="Pratinjau surat"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[480px] text-[#86868B] text-sm">
                    Preview tidak tersedia
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            className="bg-white border-[#E5E5E7] text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <Button
            variant="outline"
            onClick={handleTutup}
            className="border-[#D93025] text-[#D93025] hover:bg-[#D93025]/10"
          >
            Tutup
          </Button>
          {isWD1 && (
            <Button
              onClick={handleSaveAndSign}
              disabled={isSubmitting || !signatureData}
              className="bg-[#0071E3] text-white hover:bg-[#0051A3] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan & Tandatangani'
              )}
            </Button>
          )}
          {isUPA && (
            <Button
              onClick={handleTerbitkan}
              disabled={isSubmitting || !numberInput.trim()}
              className="bg-[#0071E3] text-white hover:bg-[#0051A3] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menerbitkan...
                </>
              ) : (
                'Terbitkan'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
