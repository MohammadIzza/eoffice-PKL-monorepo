'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { PenTool, Upload, Eraser, CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';
import { API_URL } from '@/lib/constants';

export default function SignatureManagementPage() {
  const { user, checkSession, isLoading: isAuthLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Session check removed to prevent infinite loops. 
  // DashboardLayout already guarantees a session.

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'draw' | 'upload');
    if (value === 'draw') {
      setSelectedFile(null);
      setPreviewUrl(null);
    } else {
      sigCanvas.current?.clear();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }
    
    if (!file.type.startsWith('image/')) {
        toast.error("File harus berupa gambar (JPG/PNG)");
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
        credentials: "include", 
        body: JSON.stringify({ signatureData: base64Data }),
      });

      if (!res.ok) {
        let errorMessage;
        try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || "Gagal menyimpan tanda tangan";
        } catch (e) {
            errorMessage = `Gagal menyimpan (${res.status}: ${res.statusText})`;
        }
        throw new Error(errorMessage);
      }

      await res.json();
      toast.success("Tanda tangan berhasil disimpan!");
      await checkSession(); // Refresh data user untuk update UI
      
      // Reset form
      if (activeTab === 'draw') {
        sigCanvas.current?.clear();
      } else {
        setSelectedFile(null);
        setPreviewUrl(null);
      }
      
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    // DRAWING MODE
    if (activeTab === 'draw' && sigCanvas.current) {
      if (sigCanvas.current.isEmpty()) {
        toast.error("Area tanda tangan masih kosong");
        return;
      }
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      await submitSignature(dataUrl);
    } 
    // UPLOAD MODE
    else if (activeTab === 'upload') {
        if (!selectedFile) {
            toast.error("Silakan pilih gambar tanda tangan terlebih dahulu");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            await submitSignature(base64);
        };
        reader.onerror = () => {
            toast.error("Gagal membaca file gambar");
        };
        reader.readAsDataURL(selectedFile);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
           <Skeleton className="h-8 w-64" />
           <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F5F5F7]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1D1D1F] tracking-tight mb-2">Manajemen Tanda Tangan</h1>
          <p className="text-[#86868B]">Atur tanda tangan digital Anda untuk keperluan dokumen digital.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Signature Card */}
          <Card className="shadow-sm border-[#E5E5E7] bg-white h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#0071E3]" />
                Tanda Tangan Saat Ini
              </CardTitle>
              <CardDescription>
                Preview tanda tangan yang aktif digunakan saat ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.signatureUrl ? (
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#E5E5E7] rounded-xl bg-[#FBFBFD]">
                  <img 
                    src={user.signatureUrl} 
                    alt="Current Signature" 
                    className="max-h-32 object-contain" 
                  />
                  <p className="mt-4 text-xs text-[#86868B]">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}</p>
                </div>
              ) : (
                <Alert variant="destructive" className="bg-[#FFF2F2] border-[#FFD6D6]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Belum ada tanda tangan</AlertTitle>
                  <AlertDescription>
                    Anda belum mengatur tanda tangan digital. Silakan buat baru di panel sebelah kanan.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Create/Update Signature Card */}
          <Card className="shadow-sm border-[#E5E5E7] bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#0071E3]" />
                Buat Tanda Tangan Baru
              </CardTitle>
              <CardDescription>
                Gambar langsung atau upload file gambar tanda tangan Anda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="draw">Gambar</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                </TabsList>

                <TabsContent value="draw" className="space-y-4">
                  <div className="border-2 border-dashed border-[#E5E5E7] rounded-xl bg-white relative overflow-hidden group">
                    <div className="absolute top-2 right-2 z-10 transition-opacity opacity-0 group-hover:opacity-100">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        onClick={clearSignature} 
                        className="h-8 w-8 hover:bg-[#FF3B30]/10 hover:text-[#FF3B30]" 
                        title="Bersihkan Canvas"
                      >
                        <Eraser className="w-4 h-4" />
                      </Button>
                    </div>
                    <SignatureCanvas 
                      ref={sigCanvas}
                      penColor="black"
                      canvasProps={{
                        className: "w-full h-[240px] cursor-crosshair bg-white"
                      }}
                    />
                    <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
                       <p className="text-xs text-[#86868B]/50">Area Tanda Tangan</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#86868B]">
                    Gunakan mouse (PC) atau jari (Tablet/HP) untuk menggambar tanda tangan di dalam kotak.
                  </p>
                </TabsContent>

                <TabsContent value="upload" className="space-y-4">
                  <div className={`
                    flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-200
                    ${previewUrl ? 'border-[#0071E3] bg-[#0071E3]/5' : 'border-[#E5E5E7] bg-[#FBFBFD] hover:bg-[#F5F5F7]'}
                  `}>
                    {previewUrl ? (
                      <div className="relative w-full flex justify-center">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-40 object-contain" 
                        />
                        <Button
                           variant="ghost"
                           size="sm"
                           className="absolute top-0 right-0 text-[#FF3B30] hover:bg-[#FF3B30]/10"
                           onClick={() => {
                             setSelectedFile(null);
                             setPreviewUrl(null);
                           }}
                        >
                          <Eraser className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center cursor-pointer w-full h-full">
                        <Upload className="w-10 h-10 text-[#86868B] mb-3" />
                        <span className="text-sm font-medium text-[#1D1D1F]">Klik untuk pilih gambar</span>
                        <span className="text-xs text-[#86868B] mt-1">PNG atau JPG (Maks. 2MB)</span>
                        <Input 
                          type="file" 
                          className="hidden" 
                          accept="image/png, image/jpeg"
                          onChange={handleFileUpload}
                        />
                      </label>
                    )}
                  </div>
                </TabsContent>

                <div className="pt-6 mt-6 border-t border-[#E5E5E7]">
                    <Button 
                      onClick={handleSave} 
                      disabled={isSubmitting} 
                      className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium h-11"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Simpan Tanda Tangan
                        </>
                      )}
                    </Button>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
