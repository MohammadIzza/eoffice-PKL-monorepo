"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import Stepper from "@/components/features/pkl/Stepper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- 1. SCHEMA VALIDASI SESUAI AC ---
const formSchema = z.object({
  // AC: Jenis surat otomatis "Surat Pengantar"
  jenisSurat: z.string().default("Surat Pengantar"),
  
  // AC: Dropdown Pengantar Untuk (Required)
  pengantarUntuk: z.string().min(1, "Wajib dipilih"),
  
  // AC: Field text input required
  tujuanSurat: z.string().min(1, "Tujuan surat wajib diisi"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  namaInstansi: z.string().min(1, "Nama Instansi wajib diisi"),
  alamatInstansi: z.string().min(1, "Alamat Instansi wajib diisi"),
  
  // SECTION DATA LANJUTAN
  judul: z.string().min(1, "Judul wajib diisi"),
  dosenPembimbing: z.string().min(1, "Dosen Pembimbing wajib dipilih"),
  
  // AC: NIP wajib diisi (Kita kasih validasi angka biar makin mantap)
  nipDosenPembimbing: z.string().min(1, "NIP wajib diisi").regex(/^\d+$/, "NIP harus angka"),
  
  // AC: Dosen Koordinator Auto/Readonly
  dosenKoordinator: z.string().default("Dosen Koordinator PKL"),
  
  namaDosenKoordinator: z.string().min(1, "Nama Dosen Koordinator wajib diisi"),
  nipDosenKoordinator: z.string().min(1, "NIP Koordinator wajib diisi").regex(/^\d+$/, "NIP harus angka"),
  
  namaKaprodi: z.string().min(1, "Kaprodi wajib dipilih"),
  nipKaprodi: z.string().min(1, "NIP Kaprodi wajib diisi").regex(/^\d+$/, "NIP harus angka"),
});

type FormData = z.infer<typeof formSchema>;

export default function Step2Detail() {
  const router = useRouter();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jenisSurat: "Surat Pengantar",
      pengantarUntuk: "", // Kosongkan biar user wajib milih (Dropdown)
      tujuanSurat: "",
      jabatan: "",
      namaInstansi: "",
      alamatInstansi: "",
      judul: "",
      dosenPembimbing: "",
      nipDosenPembimbing: "",
      dosenKoordinator: "Dosen Koordinator PKL", // Default Value sesuai AC
      namaDosenKoordinator: "",
      nipDosenKoordinator: "",
      namaKaprodi: "",
      nipKaprodi: "",
    },
  });

  // AC: Navigasi ke step 3 setelah validasi berhasil
  const onSubmit = (data: FormData) => {
    console.log("Data Step 2 Valid:", data);
    router.push("/pengajuan/pkl/lampiran");
  };

  // --- STYLES (Pixel Perfect Sesuai Screenshot Desain) ---
  const cardClass = "w-[945px] bg-white rounded-[12px] flex flex-col p-[32px] pt-[24px] shadow-sm mb-[32px]";
  const headerClass = "text-[14px] font-bold text-[#111418] uppercase tracking-wide mb-[24px] font-roboto"; 
  const labelClass = "text-[14px] font-medium text-[#111418] mb-[6px] block font-inter";
  
  const inputBase = "h-[42px] px-[12px] rounded-[8px] text-sm focus-visible:ring-1 w-full";
  const readOnlyInput = `${inputBase} bg-[#F6F7F8] border border-[#F6F7F8] text-[#6B7280] cursor-default`;
  const editInput = `${inputBase} bg-white border border-[#D1D5D8] text-[#111418] placeholder:text-gray-400`;

  // Tombol Styles
  const btnKembali = "h-[44px] min-w-[84px] px-[24px] rounded-[8px] border border-[#D1D5DB] bg-white text-[#374151] font-bold text-[14px] hover:bg-gray-50";
  const btnSimpan = "h-[44px] min-w-[84px] px-[24px] rounded-[8px] border border-[#137FEC] bg-white text-[#137FEC] font-bold text-[14px] hover:bg-blue-50";
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
          
          {/* CARD 1: KEPERLUAN */}
          <div className={cardClass}>
            <div className={headerClass}>KEPERLUAN</div>
            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[20px]">
              
              {/* AC: Jenis surat otomatis terisi "Surat Pengantar" & Read-Only */}
              <FormField control={form.control} name="jenisSurat" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Jenis Surat</FormLabel><FormControl><Input {...field} readOnly className={readOnlyInput} /></FormControl><FormMessage /></FormItem>
              )} />
              
              {/* AC: Dropdown Pengantar Untuk */}
              <FormField control={form.control} name="pengantarUntuk" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Pengantar Untuk</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className={editInput}><SelectValue placeholder="Pilih Pengantar" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {/* AC: Pilihan "Praktik Kerja Lapangan" */}
                        <SelectItem value="Praktik Kerja Lapangan">Praktik Kerja Lapangan</SelectItem>
                        <SelectItem value="Izin Penelitian">Izin Penelitian</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              
              {/* AC: Placeholder sesuai spek */}
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
                <FormItem><FormLabel className={labelClass}>Alamat Instansi</FormLabel><FormControl><Input {...field} className={editInput} placeholder="Tuliskan alamat instansi yang dituju" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </div>

          {/* CARD 2: DATA LANJUTAN (AC: Section Data Lanjutan ditampilkan) */}
          <div className={cardClass}>
            <div className={headerClass}>DATA LANJUTAN</div>
            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[20px]">
              
              <FormField control={form.control} name="judul" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel className={labelClass}>Judul</FormLabel><FormControl><Input {...field} className={editInput} placeholder="Tuliskan judul" /></FormControl><FormMessage /></FormItem>
              )} />
              
              {/* AC: Dropdown Nama Dosen Pembimbing */}
              <FormField control={form.control} name="dosenPembimbing" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Nama Dosen Pembimbing</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className={editInput}><SelectValue placeholder="Pilih Dosen" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Pak Indra">Pak Indra</SelectItem>
                        <SelectItem value="Bu Retno">Bu Retno</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              
              {/* AC: NIP Dosen Pembimbing (Kita tambah satpam angka) */}
              <FormField control={form.control} name="nipDosenPembimbing" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>NIP Dosen Pembimbing</FormLabel>
                    <FormControl>
                        <Input 
                            {...field} 
                            className={editInput} 
                            placeholder="Tuliskan NIP Dosen" 
                            onChange={(e) => { if (/^\d*$/.test(e.target.value)) field.onChange(e.target.value); }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )} />
              
              {/* AC: Field Dosen Koordinator otomatis terisi / read-only */}
              <FormField control={form.control} name="dosenKoordinator" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel className={labelClass}>Dosen Koordinator</FormLabel><FormControl><Input {...field} readOnly className={readOnlyInput} /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="namaDosenKoordinator" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Nama Dosen Koordinator</FormLabel><FormControl><Input {...field} className={editInput} placeholder="Tuliskan Nama Dosen" /></FormControl><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="nipDosenKoordinator" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>NIP Dosen Koordinator</FormLabel>
                    <FormControl>
                        <Input 
                            {...field} 
                            className={editInput} 
                            placeholder="Tuliskan NIP Dosen" 
                            onChange={(e) => { if (/^\d*$/.test(e.target.value)) field.onChange(e.target.value); }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )} />
              
              {/* AC: Dropdown Nama Kaprodi */}
              <FormField control={form.control} name="namaKaprodi" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>Nama Kaprodi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger className={editInput}><SelectValue placeholder="Pilih Kaprodi" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Pak Aris">Pak Aris</SelectItem>
                        <SelectItem value="Bu Beta">Bu Beta</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              
              <FormField control={form.control} name="nipKaprodi" render={({ field }) => (
                <FormItem><FormLabel className={labelClass}>NIP Kaprodi</FormLabel>
                    <FormControl>
                        <Input 
                            {...field} 
                            className={editInput} 
                            placeholder="Tuliskan NIP Dosen" 
                            onChange={(e) => { if (/^\d*$/.test(e.target.value)) field.onChange(e.target.value); }}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="w-full max-w-[1085px] flex justify-between items-center mt-2">
            {/* AC: Navigasi kembali ke step 1 */}
            <Button type="button" variant="outline" onClick={() => router.back()} className={btnKembali}>Kembali</Button>
            <div className="flex gap-4">
              <Button type="button" variant="outline" className={btnSimpan}>Simpan Draft</Button>
              {/* AC: Validasi sebelum lanjut (Type Submit) */}
              <Button type="submit" className={btnLanjut}>Lanjut</Button>
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}