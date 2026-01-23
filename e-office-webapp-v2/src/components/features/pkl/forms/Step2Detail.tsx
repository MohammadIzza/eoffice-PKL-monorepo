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
    resolver: zodResolver(step2DetailSchema),
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

  // Standarisasi styling dengan shadcn
  const cardClass = "w-full max-w-5xl bg-card rounded-xl border shadow-sm flex flex-col p-8 pt-6 mb-8";
  const headerClass = "text-sm font-bold text-foreground uppercase tracking-wide mb-6"; 
  const labelClass = "text-sm font-medium text-foreground mb-1.5 block";
  
  const readOnlyInput = "h-10 bg-muted border-muted text-muted-foreground cursor-default";
  const editInput = "h-10 bg-background border-input text-foreground placeholder:text-muted-foreground";

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8 pt-12 pb-32 px-4">
      {/* HEADER & STEPPER */}
      <div className="w-full max-w-5xl flex flex-col gap-2 items-start">
         <h1 className="text-4xl font-black tracking-tight text-foreground">Detail Pengajuan</h1>
         <p className="text-base text-muted-foreground">Lengkapi detail utama dari surat yang akan diajukan.</p>
      </div>
      <div className="w-full max-w-5xl"><Stepper currentStep={2} /></div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center">
          <div className={cardClass}>
            <div className={headerClass}>KEPERLUAN</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <FormField control={form.control} name="jenisSurat" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Jenis Surat</FormLabel><FormControl><Input {...field} readOnly className={readOnlyInput} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="tujuanSurat" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Tujuan Surat</FormLabel><FormControl><Input {...field} className={editInput} placeholder="Tuliskan nama/ pihak yang dituju" /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="jabatan" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Jabatan</FormLabel><FormControl><Input {...field} className={editInput} placeholder="Tuliskan jabatan pihak yang dituju" /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="namaInstansi" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Nama Instansi</FormLabel><FormControl><Input {...field} className={editInput} placeholder="Tuliskan nama instansi yang dituju" /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="alamatInstansi" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel className={labelClass}>Alamat Instansi</FormLabel><FormControl><Input {...field} className={editInput} placeholder="Tuliskan alamat instansi yang dituju" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>
          <div className={cardClass}>
            <div className={headerClass}>DATA LANJUTAN</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <FormField control={form.control} name="judul" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel className={labelClass}>Judul</FormLabel><FormControl><Input {...field} className={editInput} placeholder="Tuliskan judul" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="dosenPembimbingId" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Nama Dosen Pembimbing</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleDosenChange(value);
                    }} 
                    value={field.value}
                    disabled={isLoadingDosen || !prodiId}
                  >
                    <FormControl>
                      <SelectTrigger className={editInput}>
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
                  <FormMessage />
                  {selectedDosen && selectedDosen.nip && (
                    <p className="text-xs text-muted-foreground mt-1">NIP: {selectedDosen.nip}</p>
                  )}
                </FormItem>
              )} />
              <div className="space-y-2">
                <label className={labelClass}>NIP Dosen Pembimbing</label>
                <Input 
                  value={selectedDosen?.nip || ""}
                  readOnly
                  className={readOnlyInput}
                  placeholder="NIP akan terisi otomatis"
                />
              </div>
              
              <FormField control={form.control} name="namaDosenKoordinator" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Nama Dosen Koordinator PKL</FormLabel><FormControl><Input {...field} readOnly className={readOnlyInput} placeholder={isLoadingKoordinatorKaprodi ? "Memuat..." : "Akan terisi otomatis"} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="nipDosenKoordinator" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>NIP Dosen Koordinator</FormLabel>
                    <FormControl>
                        <Input 
                            {...field} 
                            readOnly
                            className={readOnlyInput}
                            placeholder={isLoadingKoordinatorKaprodi ? "Memuat..." : "Akan terisi otomatis"}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="namaKaprodi" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Nama Kaprodi</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className={readOnlyInput} placeholder={isLoadingKoordinatorKaprodi ? "Memuat..." : "Akan terisi otomatis"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="nipKaprodi" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>NIP Kaprodi</FormLabel>
                    <FormControl>
                        <Input 
                            {...field} 
                            readOnly
                            className={readOnlyInput}
                            placeholder={isLoadingKoordinatorKaprodi ? "Memuat..." : "Akan terisi otomatis"}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
          <div className="w-full max-w-5xl flex justify-between items-center mt-2">
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()} className="min-w-[84px]">
              Kembali
            </Button>
            <Button type="submit" size="lg" className="min-w-[84px]">
              Lanjut
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
