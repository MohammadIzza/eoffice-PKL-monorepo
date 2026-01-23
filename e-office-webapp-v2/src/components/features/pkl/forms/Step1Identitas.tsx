"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import Stepper from "@/components/features/pkl/navigation/Stepper";
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
import { step1IdentitasSchema, type Step1IdentitasFormData } from "@/lib/validations";
import { normalizeDateValue, formatTanggalLahir } from "@/lib/utils/date.utils";

export default function Step1Identitas() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { formData, setFormData } = usePKLFormStore();

  const form = useForm<Step1IdentitasFormData>({
    resolver: zodResolver(step1IdentitasSchema),
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

  const onSubmit = (data: Step1IdentitasFormData) => {
    setFormData({
      ...formData,
      ...data,
      tanggalLahir: normalizeDateValue(data.tanggalLahir),
      programStudiId: user?.mahasiswa?.programStudi?.id || "",
      departemenId: user?.mahasiswa?.departemen?.id || "",
    });
    router.push("/dashboard/pengajuan/pkl/detail-pengajuan");
  };

  // Standarisasi styling dengan shadcn
  const readOnlyClass = "h-10 bg-muted border-muted text-foreground cursor-default";
  const editableClass = "h-10 bg-background border-input text-foreground placeholder:text-muted-foreground";
  const labelClass = "text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-8 pt-12 pb-32 px-4">
      <div className="w-full max-w-5xl flex flex-col gap-2 items-start">
        <h1 className="text-4xl font-black tracking-tight text-foreground">Identitas Pemohon</h1>
        <p className="text-base text-muted-foreground">Data berikut diisi secara otomatis berdasarkan data Anda. Mohon periksa kembali.</p>
      </div>
      <div className="w-full max-w-5xl"><Stepper currentStep={1} /></div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center gap-10">
          <Card className="w-full max-w-5xl bg-card border shadow-sm">
            <CardContent className="p-11 px-14">
              <div className="grid grid-cols-2 gap-x-6 gap-y-6">
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
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

          <div className="w-full max-w-5xl flex justify-between items-center">
            <Button type="button" variant="outline" size="lg" className="min-w-[84px]">
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
