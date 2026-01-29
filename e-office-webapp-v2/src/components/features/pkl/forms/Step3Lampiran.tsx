"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Stepper from "@/components/features/pkl/navigation/Stepper";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, FileText, Image as ImageIcon, Eye, Trash2, X, ChevronDown, CheckCircle2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePKLFormStore } from "@/stores/pklFormStore";
import { useAuthStore } from "@/stores";
import { useMyLetters } from "@/hooks/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export default function Step3Lampiran() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { attachments, addAttachment, removeAttachment, updateAttachmentCategory, restoreAttachments, _hasHydrated, revisiLetterId } = usePKLFormStore();
  const { hasLetterInProgress, isLoading: lettersLoading } = useMyLetters();

  const isMahasiswa = user?.roles?.some((r: { name?: string }) => r.name === "mahasiswa") ?? false;
  const isRevisi = !!revisiLetterId;

  useEffect(() => {
    if (!isMahasiswa || lettersLoading) return;
    if (hasLetterInProgress && !isRevisi) {
      router.replace("/dashboard/surat?blocked=1");
    }
  }, [isMahasiswa, lettersLoading, hasLetterInProgress, isRevisi, router]);

  useEffect(() => {
    const storedMetadata = JSON.parse(localStorage.getItem('pkl-attachments-metadata') || '[]');
    const hasMetadata = storedMetadata.length > 0;
    const hasAttachments = attachments.length > 0;
    
    if ((hasMetadata && !hasAttachments) || (!_hasHydrated && hasMetadata)) {
      restoreAttachments().catch(error => {
        console.error('[Step3Lampiran] Error restoring attachments:', error);
      });
    }
  }, []);
  const [dragActive, setDragActive] = useState<{ proposal: boolean; ktm: boolean }>({ proposal: false, ktm: false });
  const [error, setError] = useState<string | null>(null);
  const [isTambahanOpen, setIsTambahanOpen] = useState(false);
  const proposalInputRef = useRef<HTMLInputElement>(null);
  const ktmInputRef = useRef<HTMLInputElement>(null);
  const tambahanInputRef = useRef<HTMLInputElement>(null);

  const cardClass = "w-full max-w-5xl bg-card rounded-xl border shadow-sm p-5 flex flex-col items-center gap-5";
  const uploadAreaClass = `w-full h-36 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors ${
    dragActive ? 'border-primary bg-primary/5' : 'border-border'
  }`;
  const fileItemClass = "w-full flex items-center justify-between p-3 border rounded-lg bg-card";

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} terlalu besar. Maksimal 5MB.`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Format file ${file.name} tidak didukung. Hanya PDF, JPG, PNG.`;
    }
    return null;
  };

  const handleFileSelectMultiple = (files: FileList | null, category: 'proposal' | 'ktm' | 'tambahan') => {
    if (!files || files.length === 0) return;

    setError(null);
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        addAttachment(file, category);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
  };

  const handleDrag = (e: React.DragEvent, type: 'proposal' | 'ktm') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'proposal' | 'ktm') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file, type);
    }
  };

  const handleFileSelect = (file: File | null, type: 'proposal' | 'ktm') => {
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      setError(error);
      return;
    }
    
    const existingAttachment = attachments.find(att => att.category === type);
    if (existingAttachment) {
      removeAttachment(existingAttachment.id);
    }
    
    addAttachment(file, type);
  };

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

  const proposalFile = attachments.find(att => att.category === 'proposal');
  const ktmFile = attachments.find(att => att.category === 'ktm');
  const tambahanFiles = attachments.filter(att => att.category === 'tambahan');

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-4 pt-8 pb-20 px-4 bg-white min-h-screen">
      <div className="w-full max-w-5xl flex flex-col gap-1.5 items-start">
         <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">
            Lampiran
         </h1>
         <p className="text-sm font-normal text-[#86868B]">
            Lampirkan dokumen pendukung yang diperlukan.
         </p>
      </div>
      <div className="w-full max-w-5xl">
         <Stepper currentStep={3} />
      </div>

      {error && (
        <div className="w-full max-w-5xl bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <X className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive whitespace-pre-line">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div className="w-full flex flex-col gap-1 mb-2">
           <h3 className="font-semibold text-base text-foreground">
              Lampiran Utama<span className="text-destructive">*</span>
           </h3>
           <p className="font-normal text-xs text-muted-foreground">
              Wajib. Unggah File Proposal dan File KTM. Format: PDF, JPG, PNG. Maks: 5MB/file.
           </p>
        </div>

        {/* File Proposal */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-foreground">
              File Proposal<span className="text-destructive">*</span>
            </label>
          </div>

        <div className="relative">
          <input
            ref={proposalInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0], 'proposal');
              }
            }}
          />

          {proposalFile ? (
              <div className={`${fileItemClass} border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${getFileIconBg(proposalFile.file)} flex items-center justify-center relative`}>
                    {getFileIcon(proposalFile.file)}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center border-2 border-card">
                      <CheckCircle2 className="w-3 h-3 text-success-foreground" />
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {proposalFile.file.name.replace(/^(proposal_|ktm_)/i, '') || proposalFile.file.name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Terunggah
                      </span>
                    </div>
                    <span className="font-normal text-xs text-muted-foreground">
                      {formatFileSize(proposalFile.file.size)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {proposalFile.preview && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => {
                        const newWindow = window.open('', '_blank');
                        if (newWindow && proposalFile.preview) {
                          const displayName = proposalFile.file.name.replace(/^(proposal_|ktm_)/i, '') || proposalFile.file.name;
                          const fileExtension = proposalFile.file.name.split('.').pop()?.toLowerCase() || '';
                          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                          const isPdf = fileExtension === 'pdf';
                          
                          if (isImage) {
                            newWindow.document.write(`
                              <html>
                                <head><title>${displayName}</title></head>
                                <body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
                                  <img src="${proposalFile.preview}" alt="${displayName}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                </body>
                              </html>
                            `);
                          } else if (isPdf) {
                            newWindow.location.href = proposalFile.preview;
                          } else {
                            newWindow.document.write(`
                              <html>
                                <head><title>${displayName}</title></head>
                                <body style="margin:0;padding:20px;font-family:Arial;">
                                  <p>Preview tidak tersedia untuk tipe file ini.</p>
                                  <p>File: ${displayName}</p>
                                </body>
                              </html>
                            `);
                          }
                        }
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (proposalFile) removeAttachment(proposalFile.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div
                  className={`w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer transition-all duration-300 ${
                    dragActive.proposal 
                    ? 'border-primary bg-primary/5 scale-[1.02] shadow-md' 
                    : 'border-border hover:bg-muted hover:border-primary/30'
                }`}
                onDragEnter={(e) => handleDrag(e, 'proposal')}
                onDragLeave={(e) => handleDrag(e, 'proposal')}
                onDragOver={(e) => handleDrag(e, 'proposal')}
                onDrop={(e) => handleDrop(e, 'proposal')}
                onClick={() => proposalInputRef.current?.click()}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-sm text-foreground">
                    Seret & lepas atau <span className="text-primary">pilih file</span>
                  </span>
                </div>
                <span className="font-normal text-[10px] text-muted-foreground mt-0.5">
                  untuk diunggah
                </span>
              </div>
              <div className="absolute right-3 top-3 pointer-events-none">
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.04)] transition-colors focus:outline-none p-0.5 pointer-events-auto"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Info className="w-3.5 h-3.5 text-[#86868B] hover:text-[#0071E3] transition-colors" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="left" 
                      className="max-w-xs text-xs p-3 rounded-xl shadow-lg bg-[#1D1D1F] text-white border-0"
                      sideOffset={8}
                    >
                      <p className="leading-relaxed">Unggah file proposal PKL Anda. File harus berisi rencana kegiatan PKL yang akan dilaksanakan, termasuk tujuan, metode, dan timeline. Format yang diterima: PDF, JPG, atau PNG. Maksimal ukuran file: 5MB.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
                   
          {/* File KTM */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-foreground">
                File KTM<span className="text-destructive">*</span>
              </label>
            </div>
            
            <div className="relative">
              <input
                ref={ktmInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0], 'ktm');
                  }
                }}
              />

              {ktmFile ? (
              <div className={`${fileItemClass} border-2 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${getFileIconBg(ktmFile.file)} flex items-center justify-center relative`}>
                    {getFileIcon(ktmFile.file)}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center border-2 border-card">
                      <CheckCircle2 className="w-3 h-3 text-success-foreground" />
                    </div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {ktmFile.file.name.replace(/^(proposal_|ktm_)/i, '') || ktmFile.file.name}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/10 text-success border border-success/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Terunggah
                      </span>
                    </div>
                    <span className="font-normal text-xs text-muted-foreground">
                      {formatFileSize(ktmFile.file.size)}
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ktmFile.preview && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => {
                        const newWindow = window.open('', '_blank');
                        if (newWindow && ktmFile.preview) {
                          const displayName = ktmFile.file.name.replace(/^(proposal_|ktm_)/i, '') || ktmFile.file.name;
                          const fileExtension = displayName.split('.').pop()?.toLowerCase() || '';
                          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
                          const isPdf = fileExtension === 'pdf';
                          
                          if (isImage) {
                            newWindow.document.write(`
                              <html>
                                <head><title>${displayName}</title></head>
                                <body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
                                  <img src="${ktmFile.preview}" alt="${displayName}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                </body>
                              </html>
                            `);
                          } else if (isPdf) {
                            newWindow.location.href = ktmFile.preview;
                          } else {
                            newWindow.document.write(`
                              <html>
                                <head><title>${displayName}</title></head>
                                <body style="margin:0;padding:20px;font-family:Arial;">
                                  <p>Preview tidak tersedia untuk tipe file ini.</p>
                                  <p>File: ${displayName}</p>
                                </body>
                              </html>
                            `);
                          }
                        }
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Lihat
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (ktmFile) removeAttachment(ktmFile.id);
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div
                  className={`w-full h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer transition-all duration-300 ${
                    dragActive.ktm 
                      ? 'border-primary bg-primary/5 scale-[1.02] shadow-md' 
                      : 'border-border hover:bg-muted hover:border-primary/30'
                  }`}
                  onDragEnter={(e) => handleDrag(e, 'ktm')}
                  onDragLeave={(e) => handleDrag(e, 'ktm')}
                  onDragOver={(e) => handleDrag(e, 'ktm')}
                  onDrop={(e) => handleDrop(e, 'ktm')}
                  onClick={() => ktmInputRef.current?.click()}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <UploadCloud className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="font-semibold text-sm text-foreground">
                      Seret & lepas atau <span className="text-primary">pilih file</span>
                    </span>
                  </div>
                  <span className="font-normal text-[10px] text-muted-foreground mt-0.5">
                    untuk diunggah
                  </span>
                </div>
                <div className="absolute right-3 top-3 pointer-events-none">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.04)] transition-colors focus:outline-none p-0.5 pointer-events-auto"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Info className="w-3.5 h-3.5 text-[#86868B] hover:text-[#0071E3] transition-colors" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="left" 
                        className="max-w-xs text-xs p-3 rounded-xl shadow-lg bg-[#1D1D1F] text-white border-0"
                        sideOffset={8}
                      >
                        <p className="leading-relaxed">Unggah foto atau scan Kartu Tanda Mahasiswa (KTM) Anda yang masih berlaku. Pastikan KTM terlihat jelas dan tidak terpotong. Format yang diterima: PDF, JPG, atau PNG. Maksimal ukuran file: 5MB.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={`${cardClass} border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)]`}>
         <div 
           className="w-full flex items-center justify-between cursor-pointer transition-all duration-300 hover:bg-[rgba(0,0,0,0.04)] rounded-lg p-2 -m-2"
           onClick={() => setIsTambahanOpen(!isTambahanOpen)}
         >
           <div className="flex flex-col gap-1">
             <h3 className="font-semibold text-base text-[#86868B]">
              Lampiran Tambahan
           </h3>
             <p className="font-normal text-xs text-[#86868B]">
              Opsional. Tambahkan dokumen pendukung lainnya jika diperlukan.
           </p>
           </div>
           <ChevronDown 
             className={`w-5 h-5 text-[#86868B] transition-transform duration-300 ease-in-out ${isTambahanOpen ? 'rotate-180' : ''}`}
           />
        </div>

         {isTambahanOpen && (
           <div className="w-full flex flex-col gap-4 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
        <input
          ref={tambahanInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
               onChange={(e) => handleFileSelectMultiple(e.target.files, 'tambahan')}
        />

        <div
               className="w-full h-36 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-[rgba(0,0,0,0.02)] cursor-pointer transition-all duration-300 border-[rgba(0,0,0,0.12)] hover:bg-[rgba(0,0,0,0.04)] hover:border-[rgba(0,0,0,0.2)] hover:scale-[1.01]"
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFileSelectMultiple(e.dataTransfer.files, 'tambahan');
            }
          }}
          onClick={() => tambahanInputRef.current?.click()}
        >
                <div className="w-10 h-10 rounded-full bg-[rgba(0,0,0,0.08)] flex items-center justify-center mb-2">
                   <UploadCloud className="w-5 h-5 text-[#86868B]" />
           </div>
           
           <div className="text-center">
                   <span className="font-semibold text-sm text-[#1D1D1F]">
                     Seret & lepas atau <span className="text-[#86868B]">pilih file</span>
              </span>
           </div>
           
                <span className="font-normal text-[10px] text-[#86868B] mt-0.5">
              untuk diunggah
           </span>
        </div>

        {tambahanFiles.length > 0 && (
               <div className="w-full flex flex-col gap-3">
                 {tambahanFiles.map((attachment) => {
              return (
                     <div key={attachment.id} className={`${fileItemClass} border-[rgba(0,0,0,0.1)] bg-[rgba(0,0,0,0.02)] animate-in fade-in slide-in-from-left-2 duration-300`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${attachment.file.type === 'application/pdf' ? 'bg-[rgba(0,0,0,0.08)]' : 'bg-[rgba(0,0,0,0.08)]'} flex items-center justify-center`}>
                        {attachment.file.type === 'application/pdf' ? (
                          <FileText className="w-5 h-5 text-[#86868B]" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-[#86868B]" />
                        )}
                     </div>
                     
                     <div className="flex flex-col">
                             <span className="font-medium text-base text-[#1D1D1F]">
                           {attachment.file.name}
                        </span>
                             <span className="font-normal text-sm text-[#86868B]">
                           {formatFileSize(attachment.file.size)}
                        </span>
                     </div>
                  </div>
                       <div className="flex items-center gap-2">
                     {attachment.preview && (
                       <button
                              className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent hover:border-[rgba(0,0,0,0.15)] hover:bg-[rgba(0,0,0,0.04)] transition-all"
                         onClick={() => window.open(attachment.preview, '_blank')}
                       >
                               <Eye className="w-5 h-5 text-[#86868B]" />
                       </button>
                     )}

                     <button
                            className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent hover:border-destructive/20 hover:bg-destructive/10 transition-all"
                            onClick={() => removeAttachment(attachment.id)}
                     >
                             <Trash2 className="w-5 h-5 text-destructive" />
                     </button>
                  </div>
                </div>
              );
            })}
               </div>
             )}
          </div>
        )}
      </div>

      <div className="w-full max-w-5xl flex justify-between items-center">
        <Button
          variant="outline"
          size="default"
          onClick={() => router.back()}
        >
          Kembali
        </Button>
        <Button
          size="default"
          onClick={() => {
            if (!proposalFile || !ktmFile) {
              setError('File Proposal dan File KTM wajib diunggah');
              return;
            }
            router.push("/dashboard/pengajuan/pkl/review");
          }}
        >
          Lanjut
        </Button>
      </div>
    </div>
  );
}
