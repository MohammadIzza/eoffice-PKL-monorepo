"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar } from "lucide-react";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";
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
import { useAuthStore } from "@/stores";
import { usePKLFormStore } from "@/stores/pklFormStore";

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
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi").transform((date) => {
    if (!date || date.trim() === "") return "";
    try {
      let parsedDate: Date;
      const dateStr = date.trim();
      
      if (dateStr.includes("T")) {
        parsedDate = new Date(dateStr);
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        parsedDate = new Date(dateStr + "T00:00:00");
      } else if (dateStr.match(/^\d{1,2}\s+\w+\s+\d{4}$/)) {
        try {
          parsedDate = parse(dateStr, "dd MMMM yyyy", new Date(), { locale: id });
        } catch {
          parsedDate = new Date(dateStr);
        }
      } else {
        parsedDate = new Date(dateStr);
      }
      
      if (isNaN(parsedDate.getTime())) {
        return dateStr;
      }
      return parsedDate.toISOString().split('T')[0];
    } catch {
      return date;
    }
  }).refine((date) => {
    if (!date || date.trim() === "") return false;
    try {
      let parsedDate: Date;
      const dateStr = date.trim();
      
      if (dateStr.includes("T")) {
        parsedDate = new Date(dateStr);
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        parsedDate = new Date(dateStr + "T00:00:00");
      } else {
        parsedDate = new Date(dateStr);
      }
      
      if (isNaN(parsedDate.getTime())) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsedDate <= today;
    } catch {
      return false;
    }
  }, {
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
  const { user } = useAuthStore();
  const { formData, setFormData } = usePKLFormStore();
  
  const normalizeDateValue = (dateValue: string | null | undefined): string => {
    if (!dateValue || (typeof dateValue === 'string' && dateValue.trim() === "")) return "";
    try {
      let date: Date;
      const dateStr = String(dateValue).trim();
      
      if (dateStr.includes("T")) {
        date = new Date(dateStr);
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateStr + "T00:00:00");
      } else if (dateStr.match(/^\d{1,2}\s+\w+\s+\d{4}$/)) {
        try {
          date = parse(dateStr, "dd MMMM yyyy", new Date(), { locale: id });
        } catch {
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateStr);
      }
      
      if (isNaN(date.getTime())) {
        return "";
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      return "";
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      namaLengkap: formData.namaLengkap || user?.name || "",
      role: "Mahasiswa", 
      nim: formData.nim || user?.mahasiswa?.nim || "",
      email: formData.email || user?.email || "",
      departemen: formData.departemen || user?.mahasiswa?.departemen?.name || "",
      programStudi: formData.programStudi || user?.mahasiswa?.programStudi?.name || "",
      tempatLahir: formData.tempatLahir || user?.mahasiswa?.tempatLahir || "",
      tanggalLahir: normalizeDateValue(formData.tanggalLahir || user?.mahasiswa?.tanggalLahir || ""),
      noHp: formData.noHp || user?.mahasiswa?.noHp || "",
      alamat: formData.alamat || user?.mahasiswa?.alamat || "",
      ipk: formData.ipk || "",
      sks: formData.sks || "",
    },
  });

  useEffect(() => {
    if (user?.mahasiswa) {
      const mahasiswa = user.mahasiswa;
      form.reset({
        namaLengkap: user.name || "",
        role: "Mahasiswa",
        nim: mahasiswa.nim || "",
        email: user.email || "",
        departemen: mahasiswa.departemen?.name || "",
        programStudi: mahasiswa.programStudi?.name || "",
        tempatLahir: mahasiswa.tempatLahir || "",
        tanggalLahir: normalizeDateValue(mahasiswa.tanggalLahir || ""),
        noHp: mahasiswa.noHp || "",
        alamat: mahasiswa.alamat || "",
        ipk: formData.ipk || "",
        sks: formData.sks || "",
      });
    }
  }, [user, form, formData]);

  const formatTanggalLahir = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "dd MMMM yyyy", { locale: id });
    } catch {
      return dateString;
    }
  };

  const onSubmit = (data: FormData) => {
    setFormData({
      ...formData,
      ...data,
      tanggalLahir: normalizeDateValue(data.tanggalLahir),
      programStudiId: user?.mahasiswa?.programStudi?.id || "",
      departemenId: user?.mahasiswa?.departemen?.id || "",
    });
    router.push("/dashboard/pengajuan/pkl/detail-pengajuan");
  };

  const inputBaseClass = "h-[42px] px-[12px] py-[8px] rounded-[8px] text-sm shadow-none focus-visible:ring-1 transition-all";
  const readOnlyClass = `${inputBaseClass} bg-[#F6F7F8] border border-[#F6F7F8] text-[#111418] cursor-default`;
  const editableClass = `${inputBaseClass} bg-white border border-[#D1D5D8] text-[#111418] placeholder:text-gray-400`;
  const labelClass = "text-[14px] font-medium leading-[20px] text-[#111418] font-inter mb-[6px] block";
  
  const btnKembali = "h-[44px] min-w-[84px] px-[24px] rounded-[8px] border border-[#D1D5DB] bg-white text-[#374151] font-bold text-[14px] hover:bg-gray-50";
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
                <FormField 
                  control={form.control} 
                  name="tanggalLahir" 
                  render={({ field }) => {
                    const displayValue = formatTanggalLahir(field.value);
                    return (
                      <FormItem>
                        <FormLabel className={labelClass}>Tanggal Lahir</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              value={displayValue}
                              readOnly 
                              className={`${readOnlyClass} pr-10`}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }} 
                />
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
            <Button type="submit" className={btnLanjut}>Lanjut</Button>
          </div>

        </form>
      </Form>
    </div>
  );
}