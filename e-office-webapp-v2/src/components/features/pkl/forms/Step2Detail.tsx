"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Stepper from "@/components/features/pkl/navigation/Stepper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormInputWithInfo } from "@/components/ui/form-input-with-info";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useDosenPembimbing, useKoordinatorKaprodi } from "@/hooks/api";
import { usePKLFormStore } from "@/stores/pklFormStore";
import { useAuthStore } from "@/stores";

import { step2DetailSchema, type Step2DetailFormData } from "@/lib/validations";

export default function Step2Detail() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { formData, setFormData } = usePKLFormStore();
  const prodiId = user?.mahasiswa?.programStudi?.id || formData.programStudiId || null;
  const { dosen, isLoading: isLoadingDosen, error: dosenError } = useDosenPembimbing(prodiId);
  const { data: koordinatorKaprodi, isLoading: isLoadingKoordinatorKaprodi } = useKoordinatorKaprodi(prodiId);
  const [selectedDosen, setSelectedDosen] = useState<{ id: string; name: string; nip: string | null } | null>(null);
  
  const form = useForm<Step2DetailFormData>({
    // NOTE: zodResolver typing currently mismatches Zod v4 types; runtime is fine.
    resolver: zodResolver(step2DetailSchema as any),
    defaultValues: {
      jenisSurat: "Surat Pengantar PKL",
      tujuanSurat: formData.tujuanSurat || "",
      jabatan: formData.jabatan || "",
      namaInstansi: formData.namaInstansi || "",
      alamatInstansi: formData.alamatInstansi || "",
      judul: formData.judul || "",
      dosenPembimbingId: formData.dosenPembimbingId || "",
      namaDosenKoordinator: formData.namaDosenKoordinator || "",
      nipDosenKoordinator: formData.nipDosenKoordinator || "",
      namaKaprodi: formData.namaKaprodi || "",
      nipKaprodi: formData.nipKaprodi || "",
    },
  });

  useEffect(() => {
    if (formData.dosenPembimbingId && dosen.length > 0) {
      const foundDosen = dosen.find(d => d.id === formData.dosenPembimbingId);
      if (foundDosen) {
        setSelectedDosen({ id: foundDosen.id, name: foundDosen.name, nip: foundDosen.nip });
      }
    }
  }, [formData.dosenPembimbingId, dosen]);

  useEffect(() => {
    if (koordinatorKaprodi) {
      if (koordinatorKaprodi.koordinator) {
        form.setValue("namaDosenKoordinator", koordinatorKaprodi.koordinator.name);
        if (koordinatorKaprodi.koordinator.nip) {
          form.setValue("nipDosenKoordinator", koordinatorKaprodi.koordinator.nip);
        }
      }
      if (koordinatorKaprodi.kaprodi) {
        form.setValue("namaKaprodi", koordinatorKaprodi.kaprodi.name);
        if (koordinatorKaprodi.kaprodi.nip) {
          form.setValue("nipKaprodi", koordinatorKaprodi.kaprodi.nip);
        }
      }
    }
  }, [koordinatorKaprodi, form]);

  const handleDosenChange = (dosenId: string) => {
    const foundDosen = dosen.find(d => d.id === dosenId);
    if (foundDosen) {
      setSelectedDosen({ id: foundDosen.id, name: foundDosen.name, nip: foundDosen.nip });
      form.setValue("dosenPembimbingId", dosenId);
    }
  };

  const onSubmit = (data: Step2DetailFormData) => {
    setFormData({
      ...formData,
      ...data,
    });
    router.push("/dashboard/pengajuan/pkl/lampiran");
  };

  const cardClass = "w-full max-w-5xl bg-white rounded-3xl border border-[rgba(0,0,0,0.08)] shadow-sm flex flex-col p-6";
  const headerClass = "text-xs font-bold text-[#1D1D1F] uppercase tracking-wide mb-4"; 
  const labelClass = "text-xs font-medium text-[#1D1D1F] mb-1.5 block";
  
  const readOnlyInput = "h-9 bg-[rgba(0,0,0,0.02)] border-[rgba(0,0,0,0.08)] text-[#86868B] cursor-default text-sm rounded-lg pr-10";
  const editInput = "h-9 bg-white border-[rgba(0,0,0,0.08)] text-[#1D1D1F] placeholder:text-[#86868B] text-sm rounded-lg pr-10";

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-4 pt-8 pb-20 px-4 bg-white min-h-screen">
      {/* HEADER & STEPPER */}
      <div className="w-full max-w-5xl flex flex-col gap-1.5 items-start">
         <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Detail Pengajuan</h1>
         <p className="text-sm text-[#86868B]">Lengkapi detail utama dari surat yang akan diajukan.</p>
      </div>
      <div className="w-full max-w-5xl"><Stepper currentStep={2} /></div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center gap-4">
          <div className={cardClass}>
            <div className={headerClass}>KEPERLUAN</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <FormField control={form.control} name="jenisSurat" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Jenis Surat</FormLabel>
                  <FormInputWithInfo info="Jenis surat yang akan diajukan. Untuk PKL, jenis surat adalah Surat Pengantar PKL.">
                    <FormControl><Input {...field} readOnly className={readOnlyInput} /></FormControl>
                  </FormInputWithInfo>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="tujuanSurat" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Tujuan Surat</FormLabel>
                  <FormInputWithInfo info="Masukkan nama lengkap atau pihak yang akan menerima surat pengantar PKL ini. Contoh: PT. ABC, CV. XYZ, atau nama instansi/perusahaan.">
                    <FormControl><Input {...field} className={editInput} placeholder="Tuliskan nama/ pihak yang dituju" /></FormControl>
                  </FormInputWithInfo>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="jabatan" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Jabatan</FormLabel>
                  <FormInputWithInfo info="Masukkan jabatan atau posisi pihak yang dituju di instansi/perusahaan. Contoh: HR Manager, Direktur, atau Kepala Divisi.">
                    <FormControl><Input {...field} className={editInput} placeholder="Tuliskan jabatan pihak yang dituju" /></FormControl>
                  </FormInputWithInfo>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="namaInstansi" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Nama Instansi</FormLabel>
                  <FormInputWithInfo info="Masukkan nama lengkap instansi atau perusahaan tempat Anda akan melaksanakan PKL. Pastikan nama instansi sesuai dengan dokumen resmi.">
                    <FormControl><Input {...field} className={editInput} placeholder="Tuliskan nama instansi yang dituju" /></FormControl>
                  </FormInputWithInfo>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="alamatInstansi" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className={labelClass}>Alamat Instansi</FormLabel>
                  <FormInputWithInfo info="Masukkan alamat lengkap instansi atau perusahaan tempat PKL akan dilaksanakan. Sertakan jalan, nomor, kelurahan, kecamatan, kota, dan kode pos jika ada.">
                    <FormControl><Input {...field} className={editInput} placeholder="Tuliskan alamat instansi yang dituju" /></FormControl>
                  </FormInputWithInfo>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
          <div className={cardClass}>
            <div className={headerClass}>DATA LANJUTAN</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <FormField control={form.control} name="judul" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className={labelClass}>Judul</FormLabel>
                  <FormInputWithInfo info="Masukkan judul atau topik PKL yang akan Anda lakukan. Judul harus jelas dan menggambarkan kegiatan PKL yang akan dilaksanakan. Contoh: 'Pengembangan Sistem Informasi Manajemen' atau 'Analisis Data dengan Machine Learning'.">
                    <FormControl><Input {...field} className={editInput} placeholder="Tuliskan judul" /></FormControl>
                  </FormInputWithInfo>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dosenPembimbingId" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Nama Dosen Pembimbing</FormLabel>
                  <div className="relative">
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleDosenChange(value);
                      }} 
                      value={field.value}
                      disabled={isLoadingDosen || !prodiId}
                    >
                      <FormControl>
                        <SelectTrigger className={`${editInput} pr-12`}>
                          <SelectValue placeholder={isLoadingDosen ? "Memuat..." : dosenError ? "Error memuat dosen" : "Pilih Dosen"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dosen.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                        {dosen.length === 0 && !isLoadingDosen && (
                          <SelectItem value="" disabled>Tidak ada dosen tersedia</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.04)] transition-colors focus:outline-none pointer-events-auto"
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
                            <p className="leading-relaxed">Pilih dosen pembimbing yang akan membimbing Anda selama melaksanakan PKL. Dosen pembimbing akan memantau dan memberikan bimbingan terkait kegiatan PKL Anda.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <FormMessage />
                  {selectedDosen && selectedDosen.nip && (
                    <p className="text-xs text-muted-foreground mt-1">NIP: {selectedDosen.nip}</p>
                  )}
                </FormItem>
              )} />
              <div className="space-y-2">
                <label className={labelClass}>NIP Dosen Pembimbing</label>
                <FormInputWithInfo info="NIP (Nomor Induk Pegawai) dosen pembimbing akan terisi otomatis setelah Anda memilih dosen pembimbing.">
                  <Input 
                    value={selectedDosen?.nip || ""}
                    readOnly
                    className={readOnlyInput}
                    placeholder="NIP akan terisi otomatis"
                  />
                </FormInputWithInfo>
              </div>
              
              <FormField control={form.control} name="namaDosenKoordinator" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Nama Dosen Koordinator PKL</FormLabel>
                  <FormInputWithInfo info="Nama dosen koordinator PKL akan terisi otomatis berdasarkan program studi Anda. Dosen koordinator bertanggung jawab mengkoordinasikan kegiatan PKL di program studi.">
                    <FormControl><Input {...field} readOnly className={readOnlyInput} placeholder={isLoadingKoordinatorKaprodi ? "Memuat..." : "Akan terisi otomatis"} /></FormControl>
                  </FormInputWithInfo>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="nipDosenKoordinator" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>NIP Dosen Koordinator</FormLabel>
                  <FormInputWithInfo info="NIP (Nomor Induk Pegawai) dosen koordinator PKL akan terisi otomatis berdasarkan program studi Anda.">
                    <FormControl>
                        <Input 
                            {...field} 
                            readOnly
                            className={readOnlyInput}
                            placeholder={isLoadingKoordinatorKaprodi ? "Memuat..." : "Akan terisi otomatis"}
                        />
                    </FormControl>
                  </FormInputWithInfo>
                    <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="namaKaprodi" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Nama Kaprodi</FormLabel>
                  <FormInputWithInfo info="Nama Ketua Program Studi akan terisi otomatis berdasarkan program studi Anda. Kaprodi bertanggung jawab mengelola program studi dan akan meninjau pengajuan surat PKL Anda.">
                    <FormControl>
                      <Input {...field} readOnly className={readOnlyInput} placeholder={isLoadingKoordinatorKaprodi ? "Memuat..." : "Akan terisi otomatis"} />
                    </FormControl>
                  </FormInputWithInfo>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="nipKaprodi" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>NIP Kaprodi</FormLabel>
                  <FormInputWithInfo info="NIP (Nomor Induk Pegawai) Ketua Program Studi akan terisi otomatis berdasarkan program studi Anda.">
                    <FormControl>
                        <Input 
                            {...field} 
                            readOnly
                            className={readOnlyInput}
                            placeholder={isLoadingKoordinatorKaprodi ? "Memuat..." : "Akan terisi otomatis"}
                        />
                    </FormControl>
                  </FormInputWithInfo>
                    <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
          <div className="w-full max-w-5xl flex justify-between items-center">
            <Button type="button" variant="outline" size="default" onClick={() => router.back()} className="min-w-[84px]">
              Kembali
            </Button>
            <Button type="submit" size="default" className="min-w-[84px]">
              Lanjut
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
