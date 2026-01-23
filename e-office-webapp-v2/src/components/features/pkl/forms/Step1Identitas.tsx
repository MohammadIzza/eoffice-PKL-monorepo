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
import { FormInputWithInfo } from "@/components/ui/form-input-with-info";
import { useAuthStore } from "@/stores";
import { usePKLFormStore } from "@/stores/pklFormStore";
import { step1IdentitasSchema, type Step1IdentitasFormData } from "@/lib/validations";
import { normalizeDateValue, formatTanggalLahir } from "@/lib/utils/date.utils";

export default function Step1Identitas() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { formData, setFormData } = usePKLFormStore();

  const form = useForm<Step1IdentitasFormData>({
    // NOTE: zodResolver typing currently mismatches Zod v4 types; runtime is fine.
    resolver: zodResolver(step1IdentitasSchema as any),
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

  const readOnlyClass = "h-9 bg-muted border-muted text-foreground cursor-default text-sm pr-10";
  const editableClass = "h-9 bg-background border-input text-foreground placeholder:text-muted-foreground text-sm pr-10";
  const labelClass = "text-xs font-medium text-foreground mb-1.5";

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-4 pt-8 pb-20 px-4 bg-white min-h-screen">
      <div className="w-full max-w-5xl flex flex-col gap-1.5 items-start">
        <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Identitas Pemohon</h1>
        <p className="text-sm text-[#86868B]">Data berikut diisi secara otomatis berdasarkan data Anda. Mohon periksa kembali.</p>
      </div>
      <div className="w-full max-w-5xl"><Stepper currentStep={1} /></div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col items-center gap-4">
          <Card className="w-full max-w-5xl bg-white border border-[rgba(0,0,0,0.08)] shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <FormField control={form.control} name="namaLengkap" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Nama Lengkap</FormLabel>
                    <FormInputWithInfo info="Nama lengkap Anda sesuai dengan data akademik yang terdaftar di sistem.">
                      <FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl>
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Role</FormLabel>
                    <FormInputWithInfo info="Peran Anda dalam sistem. Untuk pengajuan PKL, role adalah Mahasiswa.">
                      <FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl>
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nim" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>NIM</FormLabel>
                    <FormInputWithInfo info="Nomor Induk Mahasiswa (NIM) Anda. NIM digunakan sebagai identitas resmi dalam dokumen surat.">
                      <FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl>
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Email</FormLabel>
                    <FormInputWithInfo info="Alamat email aktif Anda. Email ini digunakan untuk notifikasi terkait pengajuan surat PKL.">
                      <FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl>
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="departemen" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Departemen</FormLabel>
                    <FormInputWithInfo info="Departemen tempat Anda terdaftar. Data ini digunakan untuk routing approval di sistem.">
                      <FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl>
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="programStudi" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Program Studi</FormLabel>
                    <FormInputWithInfo info="Program studi tempat Anda terdaftar. Program studi menentukan dosen koordinator dan kaprodi yang akan meninjau pengajuan.">
                      <FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl>
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tempatLahir" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Tempat Lahir</FormLabel>
                    <FormInputWithInfo info="Kota atau tempat kelahiran Anda sesuai dengan dokumen identitas resmi.">
                      <FormControl><Input {...field} readOnly className={readOnlyClass} /></FormControl>
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField 
                  control={form.control} 
                  name="tanggalLahir" 
                  render={({ field }) => {
                    const displayValue = formatTanggalLahir(field.value);
                    return (
                      <FormItem>
                        <FormLabel className={labelClass}>Tanggal Lahir</FormLabel>
                        <FormInputWithInfo info="Tanggal kelahiran Anda sesuai dengan dokumen identitas resmi. Format: DD Bulan YYYY." hasOtherIcon={true}>
                          <div className="relative">
                            <FormControl>
                              <Input 
                                value={displayValue}
                                readOnly 
                                className={`${readOnlyClass} pr-20`}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <Calendar className="absolute right-12 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </FormInputWithInfo>
                        <FormMessage />
                      </FormItem>
                    );
                  }} 
                />
                <FormField control={form.control} name="noHp" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>No. HP</FormLabel>
                    <FormInputWithInfo info="Nomor handphone aktif Anda. Pastikan nomor dapat dihubungi untuk keperluan komunikasi terkait pengajuan surat PKL.">
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
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="alamat" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Alamat</FormLabel>
                    <FormInputWithInfo info="Alamat lengkap tempat tinggal Anda saat ini. Sertakan jalan, nomor, kelurahan, kecamatan, kota, dan kode pos jika ada.">
                      <FormControl><Input {...field} className={editableClass} placeholder="Masukkan Alamat" /></FormControl>
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="ipk" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>IPK</FormLabel>
                    <FormInputWithInfo info="Indeks Prestasi Kumulatif (IPK) terakhir Anda. Masukkan nilai IPK dengan format angka desimal, contoh: 3.85. IPK digunakan untuk verifikasi kelayakan PKL.">
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
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sks" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>SKS</FormLabel>
                    <FormInputWithInfo info="Jumlah Satuan Kredit Semester (SKS) yang telah Anda ambil. Masukkan angka tanpa desimal. SKS digunakan untuk verifikasi kelayakan PKL.">
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
                    </FormInputWithInfo>
                    <FormMessage />
                  </FormItem>
                )} />

              </div>
            </CardContent>
          </Card>

          <div className="w-full max-w-5xl flex justify-between items-center">
            <Button type="button" variant="outline" size="default" className="min-w-[84px]">
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
