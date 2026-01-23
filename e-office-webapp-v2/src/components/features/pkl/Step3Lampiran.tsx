"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Stepper from "@/components/features/pkl/Stepper";
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

  const cardClass = "w-full bg-white rounded-[12px] border border-[#E5E7EB] p-[24px] flex flex-col items-center gap-[24px]";
  const uploadAreaClass = `w-full max-w-[846px] h-[156px] flex flex-col items-center justify-center border-[2px] border-dashed rounded-[8px] bg-[#FAFAFA] cursor-pointer hover:bg-gray-50 transition-colors ${
    dragActive ? 'border-[#137FEC] bg-blue-50' : 'border-[#E5E7EB]'
  }`;
  const fileItemClass = "w-full max-w-[846px] h-[70px] flex items-center justify-between p-[12px] border border-[#E5E7EB] rounded-[8px] bg-white";

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
      return <FileText className="w-[20px] h-[20px] text-[#EF4444]" />;
    }
    return <ImageIcon className="w-[20px] h-[20px] text-[#3B82F6]" />;
  };

  const getFileIconBg = (file: File) => {
    if (file.type === 'application/pdf') {
      return 'bg-[#FEE2E2]';
    }
    return 'bg-[#DBEAFE]';
  };

  const utamaFiles = attachments.filter(att => att.category === 'file' || att.category === 'foto');
  const tambahanFiles = attachments.filter(att => att.category === 'tambahan');

  return (
    <div className="w-full max-w-[1085px] mx-auto flex flex-col items-center gap-[28px] pt-[48px] pb-[122px] px-[16px]">
      <div className="w-full flex flex-col gap-[8px] items-start">
         <h1 className="text-[30px] leading-[37.5px] font-black tracking-[-0.99px] text-[#111418] font-inter">
            Lampiran
         </h1>
         <p className="text-[16px] leading-[24px] font-normal text-[#617589] font-inter">
            Lampirkan dokumen pendukung yang diperlukan.
         </p>
      </div>
      <div className="w-full py-[1px] px-[27px]">
         <Stepper currentStep={3} />
      </div>

      {error && (
        <div className="w-full max-w-[846px] bg-red-50 border border-red-200 rounded-[8px] p-4">
          <div className="flex items-start gap-2">
            <X className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className={cardClass}>
        <div className="w-full max-w-[846px] flex flex-col gap-[4px]">
           <h3 className="font-inter font-semibold text-[18px] leading-[22.5px] text-[#111418]">
              Lampiran Utama<span className="text-[#EF4444]">*</span>
           </h3>
           <p className="font-inter font-normal text-[14px] leading-[21px] text-[#617589]">
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
           <div className="w-[48px] h-[48px] rounded-full bg-[#137FEC1A] flex items-center justify-center mb-[12px]">
              <UploadCloud className="w-[24px] h-[24px] text-[#137FEC]" />
           </div>
           
           <div className="text-center">
              <span className="font-inter font-semibold text-[16px] leading-[24px] text-[#111418]">
                Seret & lepas atau <span className="text-[#137FEC]">pilih file</span>
              </span>
           </div>
           
           <span className="font-inter font-normal text-[12px] leading-[16px] text-[#617589] mt-[4px]">
              untuk diunggah
           </span>
        </div>

        <div className="w-full max-w-[846px] flex flex-col gap-[12px]">
          {utamaFiles.map((attachment, index) => {
            const actualIndex = attachments.findIndex(att => att === attachment);
            return (
              <div key={actualIndex} className={fileItemClass}>
                <div className="flex items-center gap-[16px]">
                   <div className={`w-[40px] h-[40px] rounded-[8px] ${getFileIconBg(attachment.file)} flex items-center justify-center`}>
                      {getFileIcon(attachment.file)}
                   </div>
                   
                   <div className="flex flex-col">
                      <span className="font-inter font-medium text-[16px] leading-[24px] text-[#111418]">
                         {attachment.file.name}
                      </span>
                      <span className="font-inter font-normal text-[14px] leading-[20px] text-[#617589]">
                         {formatFileSize(attachment.file.size)}
                      </span>
                   </div>
                </div>
                <div className="flex items-center gap-[8px]">
                   <Select
                     value={attachment.category}
                     onValueChange={(value) => updateAttachmentCategory(actualIndex, value as 'file' | 'foto')}
                   >
                      <SelectTrigger className="w-[128px] h-[36px] rounded-[6px] border border-[#E5E7EB] text-[14px]">
                         <SelectValue placeholder="Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="file">File</SelectItem>
                         <SelectItem value="foto">Foto</SelectItem>
                      </SelectContent>
                   </Select>

                   {attachment.preview && (
                     <button
                       className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#E5E7EB] hover:bg-gray-50 transition-all"
                       onClick={() => window.open(attachment.preview, '_blank')}
                     >
                        <Eye className="w-[20px] h-[20px] text-[#111418]" />
                     </button>
                   )}

                   <button
                     className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#FEE2E2] hover:bg-[#FEF2F2] transition-all"
                     onClick={() => removeAttachment(actualIndex)}
                   >
                      <Trash2 className="w-[20px] h-[20px] text-[#EF4444]" />
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
           <div className="w-[48px] h-[48px] rounded-full bg-[#137FEC1A] flex items-center justify-center mb-[12px]">
              <UploadCloud className="w-[24px] h-[24px] text-[#137FEC]" />
           </div>
           
           <div className="text-center">
              <span className="font-inter font-semibold text-[16px] leading-[24px] text-[#111418]">
                Seret & lepas atau <span className="text-[#137FEC]">pilih file</span>
              </span>
           </div>
           
           <span className="font-inter font-normal text-[12px] leading-[16px] text-[#617589] mt-[4px]">
              untuk diunggah
           </span>
        </div>

        {tambahanFiles.length > 0 && (
          <div className="w-full max-w-[846px] flex flex-col gap-[12px]">
            {tambahanFiles.map((attachment, index) => {
              const actualIndex = attachments.findIndex(att => att === attachment);
              return (
                <div key={actualIndex} className={fileItemClass}>
                  <div className="flex items-center gap-[16px]">
                     <div className={`w-[40px] h-[40px] rounded-[8px] ${getFileIconBg(attachment.file)} flex items-center justify-center`}>
                        {getFileIcon(attachment.file)}
                     </div>
                     
                     <div className="flex flex-col">
                        <span className="font-inter font-medium text-[16px] leading-[24px] text-[#111418]">
                           {attachment.file.name}
                        </span>
                        <span className="font-inter font-normal text-[14px] leading-[20px] text-[#617589]">
                           {formatFileSize(attachment.file.size)}
                        </span>
                     </div>
                  </div>
                  <div className="flex items-center gap-[8px]">
                     {attachment.preview && (
                       <button
                         className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#E5E7EB] hover:bg-gray-50 transition-all"
                         onClick={() => window.open(attachment.preview, '_blank')}
                       >
                          <Eye className="w-[20px] h-[20px] text-[#111418]" />
                       </button>
                     )}

                     <button
                       className="w-[36px] h-[36px] flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#FEE2E2] hover:bg-[#FEF2F2] transition-all"
                       onClick={() => removeAttachment(actualIndex)}
                     >
                        <Trash2 className="w-[20px] h-[20px] text-[#EF4444]" />
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-full max-w-[1085px] flex justify-between items-center mt-2">
        <Button
          variant="outline"
          className="h-11 px-6 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 rounded-[8px]"
          onClick={() => router.back()}
        >
          Kembali
        </Button>
        <Button
          className="h-11 px-6 bg-[#0079BD] text-white font-bold hover:bg-blue-700 cursor-pointer rounded-[8px]"
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
