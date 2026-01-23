"use client";

import { useState, useRef } from "react";
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
import { UploadCloud, FileText, Image as ImageIcon, Eye, Trash2, X } from "lucide-react";
import { usePKLFormStore } from "@/stores/pklFormStore";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export default function Step3Lampiran() {
  const router = useRouter();
  const { attachments, addAttachment, removeAttachment, updateAttachmentCategory } = usePKLFormStore();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tambahanInputRef = useRef<HTMLInputElement>(null);

  // Standarisasi styling dengan shadcn
  const cardClass = "w-full bg-card rounded-xl border shadow-sm p-6 flex flex-col items-center gap-6";
  const uploadAreaClass = `w-full max-w-4xl h-40 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors ${
    dragActive ? 'border-primary bg-primary/5' : 'border-border'
  }`;
  const fileItemClass = "w-full max-w-4xl h-18 flex items-center justify-between p-3 border rounded-lg bg-card";

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} terlalu besar. Maksimal 5MB.`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Format file ${file.name} tidak didukung. Hanya PDF, JPG, PNG.`;
    }
    return null;
  };

  const handleFileSelect = (files: FileList | null, category: 'file' | 'foto' | 'tambahan') => {
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent, category: 'file' | 'foto' | 'tambahan') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files, category);
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

  const utamaFiles = attachments.filter(att => att.category === 'file' || att.category === 'foto');
  const tambahanFiles = attachments.filter(att => att.category === 'tambahan');

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-7 pt-12 pb-32 px-4">
      <div className="w-full flex flex-col gap-2 items-start">
         <h1 className="text-3xl font-black tracking-tight text-foreground">
            Lampiran
         </h1>
         <p className="text-base font-normal text-muted-foreground">
            Lampirkan dokumen pendukung yang diperlukan.
         </p>
      </div>
      <div className="w-full py-0.5 px-7">
         <Stepper currentStep={3} />
      </div>

      {error && (
        <div className="w-full max-w-4xl bg-destructive/10 border border-destructive/20 rounded-lg p-4">
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
        <div className="w-full max-w-4xl flex flex-col gap-1">
           <h3 className="font-semibold text-lg text-foreground">
              Lampiran Utama<span className="text-destructive">*</span>
           </h3>
           <p className="font-normal text-sm text-muted-foreground">
              Wajib. Unggah minimal 1 dokumen pendukung utama. Format: PDF, JPG, PNG. Maks: 5MB/file.
           </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files, 'file')}
        />

        <div
          className={uploadAreaClass}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, 'file')}
          onClick={() => fileInputRef.current?.click()}
        >
           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-primary" />
           </div>
           
           <div className="text-center">
              <span className="font-semibold text-base text-foreground">
                Seret & lepas atau <span className="text-primary">pilih file</span>
              </span>
           </div>
           
           <span className="font-normal text-xs text-muted-foreground mt-1">
              untuk diunggah
           </span>
        </div>

        <div className="w-full max-w-[846px] flex flex-col gap-[12px]">
          {utamaFiles.map((attachment, index) => {
            const actualIndex = attachments.findIndex(att => att === attachment);
            return (
              <div key={actualIndex} className={fileItemClass}>
                <div className="flex items-center gap-[16px]">
                   <div className={`w-10 h-10 rounded-lg ${getFileIconBg(attachment.file)} flex items-center justify-center`}>
                      {getFileIcon(attachment.file)}
                   </div>
                   
                   <div className="flex flex-col">
                      <span className="font-medium text-base text-foreground">
                         {attachment.file.name}
                      </span>
                      <span className="font-normal text-sm text-muted-foreground">
                         {formatFileSize(attachment.file.size)}
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-[8px]">
                   <Select
                     value={attachment.category}
                     onValueChange={(value) => updateAttachmentCategory(actualIndex, value as 'file' | 'foto')}
                   >
                      <SelectTrigger className="w-32 h-9 rounded-md text-sm">
                         <SelectValue placeholder="Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="file">File</SelectItem>
                         <SelectItem value="foto">Foto</SelectItem>
                      </SelectContent>
                   </Select>

                   {attachment.preview && (
                     <button
                       className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent hover:border-border hover:bg-muted transition-all"
                       onClick={() => window.open(attachment.preview, '_blank')}
                     >
                        <Eye className="w-5 h-5 text-foreground" />
                     </button>
                   )}

                   <button
                     className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent hover:border-destructive/20 hover:bg-destructive/10 transition-all"
                     onClick={() => removeAttachment(actualIndex)}
                   >
                      <Trash2 className="w-5 h-5 text-destructive" />
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cardClass}>
         <div className="w-full max-w-[846px] flex flex-col gap-[4px]">
           <h3 className="font-inter font-semibold text-[18px] leading-[22.5px] text-[#111418]">
              Lampiran Tambahan
           </h3>
           <p className="font-inter font-normal text-[14px] leading-[21px] text-[#617589]">
              Opsional. Tambahkan dokumen pendukung lainnya jika diperlukan.
           </p>
        </div>

        <input
          ref={tambahanInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files, 'tambahan')}
        />

        <div
          className={uploadAreaClass}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={(e) => handleDrop(e, 'tambahan')}
          onClick={() => tambahanInputRef.current?.click()}
        >
           <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-primary" />
           </div>
           
           <div className="text-center">
              <span className="font-semibold text-base text-foreground">
                Seret & lepas atau <span className="text-primary">pilih file</span>
              </span>
           </div>
           
           <span className="font-normal text-xs text-muted-foreground mt-1">
              untuk diunggah
           </span>
        </div>

        {tambahanFiles.length > 0 && (
          <div className="w-full max-w-4xl flex flex-col gap-3">
            {tambahanFiles.map((attachment, index) => {
              const actualIndex = attachments.findIndex(att => att === attachment);
              return (
                <div key={actualIndex} className={fileItemClass}>
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-lg ${getFileIconBg(attachment.file)} flex items-center justify-center`}>
                        {getFileIcon(attachment.file)}
                     </div>
                     
                     <div className="flex flex-col">
                        <span className="font-medium text-base text-foreground">
                           {attachment.file.name}
                        </span>
                        <span className="font-normal text-sm text-muted-foreground">
                           {formatFileSize(attachment.file.size)}
                        </span>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     {attachment.preview && (
                       <button
                         className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent hover:border-border hover:bg-muted transition-all"
                         onClick={() => window.open(attachment.preview, '_blank')}
                       >
                          <Eye className="w-5 h-5 text-foreground" />
                       </button>
                     )}

                     <button
                       className="w-9 h-9 flex items-center justify-center rounded-md border border-transparent hover:border-destructive/20 hover:bg-destructive/10 transition-all"
                       onClick={() => removeAttachment(actualIndex)}
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

      <div className="w-full max-w-5xl flex justify-between items-center mt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.back()}
        >
          Kembali
        </Button>
        <Button
          size="lg"
          onClick={() => {
            if (utamaFiles.length === 0) {
              setError('Minimal 1 lampiran utama wajib diunggah');
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
