import * as z from "zod";
import { parse } from "date-fns";
import { id } from "date-fns/locale";

export const step1IdentitasSchema = z.object({
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

export const step2DetailSchema = z.object({
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

export type Step1IdentitasFormData = z.infer<typeof step1IdentitasSchema>;
export type Step2DetailFormData = z.infer<typeof step2DetailSchema>;
