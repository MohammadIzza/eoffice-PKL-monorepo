"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar } from "lucide-react";



import Stepper from "@/components/features/pkl/Stepper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// --- SCHEMA VALIDASI KETAT (AC COMPLIANT) ---
const formSchema = z.object({
  namaLengkap: z.string().min(1, "Nama Lengkap wajib diisi"),
  role: z.string().default("Mahasiswa"),
  nim: z
    .string()
    .min(12, "NIM minimal 12 digit")
    .max(14, "NIM maksimal 14 digit")
    .regex(/^\d+$/, "NIM harus berupa angka"), 
  email: z.string().email("Format email tidak valid"),
  departemen: z.string().min(1, "Departemen wajib diisi"),
  programStudi: z.string().min(1, "Prodi wajib diisi"),
  tempatLahir: z.string().min(1, "Tempat Lahir wajib diisi"),
  tanggalLahir: z.string().refine((date) => new Date(date) <= new Date(), {
    message: "Tanggal lahir tidak valid",
  }),
  noHp: z
    .string()
    .min(10, "No HP minimal 10 digit")
    .regex(/^\d+$/, "No HP harus berupa angka"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  ipk: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0.00 && num <= 4.00;
  }, { message: "IPK harus antara 0.00 - 4.00" }),
  sks: z
    .string()
    .min(1, "SKS wajib diisi")
    .regex(/^\d+$/, "SKS harus berupa angka"),
});

type FormData = z.infer<typeof formSchema>;

export default function Step1identitas() {
  const router = useRouter();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // 2. Set Default Values dari Store (Biar data muncul lagi pas kembali)
    defaultValues: {
      namaLengkap: "Ahmad Syaifullah", // Dummy Default
      role: "Mahasiswa", 
      nim: "24060121130089",
      email: "ahmadsyaifullah@students.undip.ac.id",
      departemen: "Informatika",
      programStudi: "S1 - Informatika",
      tempatLahir: "Blora",
      tanggalLahir: "2006-03-18",
      noHp: "",
      alamat: "",
      ipk: "",
      sks: "",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Data Step 1 Submit:", data);
    
    // Redirect ke dashboard route
    router.push("/dashboard/pengajuan/pkl/detail-pengajuan");
  };

  // --- STYLES ---
  const inputBaseClass = "h-[42px] px-[12px] py-[8px] rounded-[8px] text-sm shadow-none focus-visible:ring-1 transition-all";
  const readOnlyClass = `${inputBaseClass} bg-[#F6F7F8] border border-[#F6F7F8] text-[#111418] cursor-default`;
  const editableClass = `${inputBaseClass} bg-white border border-[#D1D5D8] text-[#111418] placeholder:text-gray-400`;
  const labelClass = "text-[14px] font-medium leading-[20px] text-[#111418] font-inter mb-[6px] block";
  
  const btnKembali = "h-[44px] min-w-[84px] px-[24px] rounded-[8px] border border-[#D1D5DB] bg-white text-[#374151] font-bold text-[14px] hover:bg-gray-50";
  const btnSimpan = "h-[44px] min-w-[84px] px-[24px] rounded-[8px] border border-[#137FEC] bg-white text-[#137FEC] font-bold text-[14px] hover:bg-blue-50";
  const btnLanjut = "h-[44px] min-w-[84px] px-[24px] rounded-[8px] bg-[#D1D5DB] text-white font-bold text-[14px] hover:bg-gray-400";

  return (
    <div className="w-full max-w-[1117px] mx-auto flex flex-col items-center gap-[32px] pt-[48px] pb-[122px] px-[16px]">
      
      <div className="w-full max-w-[1073px] flex flex-col gap-[8px] items-start">
        <h1 className="text-[36px] font-black tracking-[-1.19px] text-[#111418] font-inter">Identitas Pemohon</h1>
        <p className="text-[16px] text-[#6B7280] font-inter">Data berikut diisi secara otomatis berdasarkan data Anda. Mohon periksa kembali.</p>
      </div>
      <div className="w-full max-w-[1073px]"><Stepper currentStep={1} /></div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center gap-10">
          
          <Card className="w-full max-w-[1073px] bg-white rounded-xl border-none shadow-sm">
            <CardContent className="p-[44px] px-[56px]">
              <div className="grid grid-cols-2 gap-x-[24px] gap-y-[24px]">
                
                {/* READ ONLY FIELDS */}
                <FormField control={form.control} name="namaLengkap" render={({ field }) => (
                  <FormItem><FormLabel className={labelClass}>Nama Lengkap</FormLabel><FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem><FormLabel className={labelClass}>Role</FormLabel><FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nim" render={({ field }) => (
                  <FormItem><FormLabel className={labelClass}>NIM</FormLabel><FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel className={labelClass}>Email</FormLabel><FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="departemen" render={({ field }) => (
                  <FormItem><FormLabel className={labelClass}>Departemen</FormLabel><FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="programStudi" render={({ field }) => (
                  <FormItem><FormLabel className={labelClass}>Program Studi</FormLabel><FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tempatLahir" render={({ field }) => (
                  <FormItem><FormLabel className={labelClass}>Tempat Lahir</FormLabel><FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="tanggalLahir" render={({ field }) => (
                  <FormItem><FormLabel className={labelClass}>Tanggal Lahir</FormLabel>
                    <div className="relative">
                      <FormControl><Input {...field} readOnly className={`${readOnlyClass} pr-10`} /></FormControl>
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  <FormMessage /></FormItem>
                )} />

                {/* EDITABLE FIELDS WITH RESTRICTIONS & STORE */}
                
                <FormField control={form.control} name="noHp" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>No. HP</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className={editableClass} 
                        placeholder="Contoh: 0812..." 
                        onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="alamat" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Alamat</FormLabel>
                    <FormControl><Input {...field} className={editableClass} placeholder="Masukkan Alamat" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="ipk" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>IPK</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className={editableClass} 
                        placeholder="Contoh: 3.85" 
                        onChange={(e) => {
                            // Hanya izinkan angka dan titik (blokir koma)
                            if (/^[0-9.]*$/.test(e.target.value)) field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sks" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>SKS</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className={editableClass} 
                        placeholder="Masukkan SKS" 
                        onChange={(e) => {
                            if (/^\d*$/.test(e.target.value)) field.onChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

              </div>
            </CardContent>
          </Card>

          <div className="w-full max-w-[1073px] flex justify-between items-center">
            <Button type="button" variant="outline" className={btnKembali}>Kembali</Button>
            <div className="flex gap-4">
              <Button type="button" variant="outline" className={btnSimpan}>Simpan Draft</Button>
              <Button type="submit" className={btnLanjut}>Lanjut</Button>
            </div>
          </div>

        </form>
      </Form>
    </div>
  );
}