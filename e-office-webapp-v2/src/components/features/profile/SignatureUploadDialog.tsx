'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { PenTool, Eraser, Upload, Save, CheckCircle2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { API_URL } from '@/lib/constants';

interface SignatureUploadDialogProps {
  currentSignatureUrl?: string | null;
  onSuccess?: () => void;
}

export function SignatureUploadDialog({ currentSignatureUrl, onSuccess }: SignatureUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { checkSession } = useAuthStore();

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleTabChange = (tab: 'draw' | 'upload') => {
    setActiveTab(tab);
    // Reset states when switching tabs
    if (tab === 'draw') {
        setSelectedFile(null);
        setPreviewUrl(null);
    } else {
        sigCanvas.current?.clear();
    }
  };

  const saveSignature = async () => {
    // SCENARIO 1: DRAWING
    if (activeTab === 'draw' && sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        toast.error("Tanda tangan masih kosong");
        return;
      }
      
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      await submitSignature(dataUrl);
    } 
    // SCENARIO 2: UPLOAD
    else if (activeTab === 'upload') {
        if (!selectedFile) {
            toast.error("Pilih gambar tanda tangan terlebih dahulu");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await submitSignature(base64);
        };
        reader.onerror = () => {
            toast.error("Gagal membaca file");
        };
        reader.readAsDataURL(selectedFile);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }
    
    if (!file.type.startsWith('image/')) {
        toast.error("File harus berupa gambar");
        return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const submitSignature = async (base64Data: string) => {
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_URL}/me/signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for sending cookies
        body: JSON.stringify({ signatureData: base64Data }),
      });

      if (!res.ok) {
        // Try to parse JSON error, fall back to status text if fails (like 401 Unauthorized plain text)
        let errorMessage;
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || "Gagal menyimpan tanda tangan";
        } catch (e) {
            errorMessage = `Gagal menyimpan (${res.status}: ${res.statusText})`;
        }
        throw new Error(errorMessage);
      }

      // Success - parse response
      await res.json();
      
      toast.success("Tanda tangan berhasil disimpan!");
      await checkSession(); // Refresh user data
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentSignatureUrl ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <PenTool className="h-4 w-4" />}
          {currentSignatureUrl ? "Ubah Tanda Tangan" : "Atur Tanda Tangan"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tanda Tangan Digital</DialogTitle>
          <DialogDescription>
             Simpan tanda tangan Anda untuk digunakan pada proses persetujuan dokumen.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mb-4 border-b">
           <button 
             onClick={() => handleTabChange('draw')}
             className={`pb-2 px-4 text-sm font-medium transition-colors ${activeTab === 'draw' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
           >
             Gambar di Layar
           </button>
           <button 
             onClick={() => handleTabChange('upload')}
             className={`pb-2 px-4 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
           >
             Upload Gambar
           </button>
        </div>

        {activeTab === 'draw' ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="border rounded-md bg-white border-dashed border-gray-300 relative">
               <div className="absolute top-2 right-2 z-10">
                   <Button variant="ghost" size="icon" onClick={clearSignature} className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" title="Bersihkan">
                      <Eraser className="w-4 h-4" />
                   </Button>
               </div>
               <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    className: "w-full h-[200px] cursor-crosshair rounded-md"
                  }}
               />
               <p className="text-xs text-center text-gray-400 pb-2 select-none pointer-events-none">
                  Area Tanda Tangan
               </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
             <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md transition-colors ${previewUrl ? 'border-primary/50 bg-primary/5' : 'border-gray-200 bg-gray-50'}`}>
                 
                 {previewUrl ? (
                     <div className="relative w-full h-[150px] mb-4">
                         <Image 
                            src={previewUrl} 
                            alt="Preview Signature" 
                            fill 
                            className="object-contain"
                         />
                         <Button 
                            size="sm" 
                            variant="destructive" 
                            className="absolute top-0 right-0 h-6 w-6 p-0 rounded-full"
                            onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                         >
                            <span className="sr-only">Hapus</span>
                            ×
                         </Button>
                     </div>
                 ) : (
                     <Upload className="w-10 h-10 text-gray-400 mb-4" />
                 )}

                 {!previewUrl && (
                    <p className="text-sm text-center text-gray-500 mb-4">
                        Klik tombol di bawah untuk memilih file (PNG/JPG).<br/>Pastikan latar belakang transparan/putih.
                    </p>
                 )}

                 <div className="relative">
                    <Button variant={previewUrl ? "secondary" : "default"} className="relative pointer-events-none">
                        {previewUrl ? "Ganti File" : "Pilih File"}
                    </Button>
                    <Input 
                        type="file" 
                        accept="image/png, image/jpeg" 
                        onChange={handleFileUpload}
                        disabled={isSubmitting}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                 </div>
                 {selectedFile && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                 )}
             </div>
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
             Batal
          </Button>
          <Button onClick={saveSignature} disabled={isSubmitting || (activeTab === 'upload' && !selectedFile)}>
            {isSubmitting && <span className="animate-spin mr-2">⏳</span>}
            <Save className="w-4 h-4 mr-2" /> Simpan Tanda Tangan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
