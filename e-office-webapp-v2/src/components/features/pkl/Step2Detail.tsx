"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import Stepper from "@/components/features/pkl/Stepper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDosenPembimbing, useKoordinatorKaprodi } from "@/hooks/api";
import { usePKLFormStore } from "@/stores/pklFormStore";
import { useAuthStore } from "@/stores";

const formSchema = z.object({
  jenisSurat: z.string().default("Surat Pengantar PKL"),
  tujuanSurat: z.string().min(1, "Tujuan surat wajib diisi"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  namaInstansi: z.string().min(1, "Nama Instansi wajib diisi"),
  alamatInstansi: z.string().min(1, "Alamat Instansi wajib diisi"),
  judul: z.string().min(1, "Judul wajib diisi"),
  dosenPembimbingId: z.string().min(1, "Dosen Pembimbing wajib dipilih"),
  namaDosenKoordinator: z.string().min(1, "Nama Dosen Koordinator wajib diisi"),
  nipDosenKoordinator: z.string().min(1, "NIP Koordinator wajib diisi").regex(/^\d+$/, "NIP harus angka"),
  namaKaprodi: z.string().min(1, "Kaprodi wajib diisi"),
  nipKaprodi: z.string().min(1, "NIP Kaprodi wajib diisi").regex(/^\d+$/, "NIP harus angka"),
});

type FormData = z.infer<typeof formSchema>;

export default function Step2Detail() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { formData, setFormData } = usePKLFormStore();
  const prodiId = user?.mahasiswa?.programStudi?.id || formData.programStudiId || null;
  const { dosen, isLoading: isLoadingDosen, error: dosenError } = useDosenPembimbing(prodiId);
  const { data: koordinatorKaprodi, isLoading: isLoadingKoordinatorKaprodi } = useKoordinatorKaprodi(prodiId);
  const [selectedDosen, setSelectedDosen] = useState<{ id: string; name: string; nip: string | null } | null>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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

  const onSubmit = (data: FormData) => {
    setFormData({
      ...formData,
      ...data,
    });
    router.push("/dashboard/pengajuan/pkl/lampiran");
  };

  const cardClass = "w-[945px] bg-white rounded-[12px] flex flex-col p-[32px] pt-[24px] shadow-sm mb-[32px]";
  const headerClass = "text-[14px] font-bold text-[#111418] uppercase tracking-wide mb-[24px] font-roboto"; 
  const labelClass = "text-[14px] font-medium text-[#111418] mb-[6px] block font-inter";
  
  const inputBase = "h-[42px] px-[12px] rounded-[8px] text-sm focus-visible:ring-1 w-full";
  const readOnlyInput = `${inputBase} bg-[#F6F7F8] border border-[#F6F7F8] text-[#6B7280] cursor-default`;
  const editInput = `${inputBase} bg-white border border-[#D1D5D8] text-[#111418] placeholder:text-gray-400`;
  const btnKembali = "h-[44px] min-w-[84px] px-[24px] rounded-[8px] border border-[#D1D5DB] bg-white text-[#374151] font-bold text-[14px] hover:bg-gray-50";
  const btnLanjut = "h-[44px] min-w-[84px] px-[24px] rounded-[8px] bg-[#D1D5DB] text-white font-bold text-[14px] hover:bg-gray-400";

  return (
    <div className="w-full max-w-[1117px] mx-auto flex flex-col items-center gap-[32px] pt-[48px] pb-[122px] px-[16px]">
      
      {/* HEADER & STEPPER */}
      <div className="w-full max-w-[1085px] flex flex-col gap-[8px] items-start">
         <h1 className="text-[36px] font-black tracking-[-1.19px] text-[#111418] font-inter">Detail Pengajuan</h1>
         <p className="text-[16px] text-[#6B7280] font-inter">Lengkapi detail utama dari surat yang akan diajukan.</p>
      </div>
      <div className="w-full max-w-[1085px]"><Stepper currentStep={2} /></div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center">
          <div className={cardClass}>
            <div className={headerClass}>KEPERLUAN</div>
            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[20px]">
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
            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[20px]">
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
                    <p className="text-xs text-gray-500 mt-1">NIP: {selectedDosen.nip}</p>
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
          <div className="w-full max-w-[1085px] flex justify-between items-center mt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} className={btnKembali}>Kembali</Button>
            <Button type="submit" className={btnLanjut}>Lanjut</Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
