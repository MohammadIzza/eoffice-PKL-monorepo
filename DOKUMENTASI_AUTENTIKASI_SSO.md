# 🏁 PANDUAN INDUK: Implementasi End-to-End SSO Bridge
## Standar Operasional Pengembangan (Standard Operating Procedure) - FSM UNDIP

Dokumen ini disusun sebagai panduan teknis mandiri (self-contained) bagi tim pengembang untuk membangun, mengintegrasikan, dan memelihara sistem autentikasi SSO di lingkungan Fakultas Sains dan Matematika.

---

## 🏗️ 1. PEMAHAMAN ARSITEKTUR (LOGIKA DASAR)

Sistem ini tidak menggunakan token dari SSO pusat secara langsung untuk mengakses data aplikasi. Sebaliknya, aplikasi Anda bertindak sebagai "Penerbit Sesi Mandiri".

1. **Akses**: Pengguna masuk ke Portal SSO (`/sso`).
2. **Identitas**: Server SSO memberikan token identitas ke Frontend Anda.
3. **Pertukaran (Bridge)**: Frontend mengirim token tersebut ke Backend Anda.
4. **Validasi**: Backend Anda bertanya ke Server SSO pusat apakah token itu valid.
5. **Sesi Lokal**: Jika valid dan email pengguna ada di database Anda, Backend Anda menerbitkan **JWT Lokal** aplikasi Anda sendiri.

---

## 🛠️ 2. PERSIAPAN INFRASTRUKTUR & DATABASE

Sebelum menyentuh kode, selesaikan persiapan berikut:

### A. Tabel Database (Prisma/SQL)
Anda **WAJIB** memiliki tabel `User` dengan kolom `email`. Tanpa ini, sistem tidak bisa melakukan otorisasi (membedakan mana user aplikasi Anda dan mana user FSM umum).
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique // Ini akan disamakan dengan username dari SSO
  name      String
  role      String   @default("user") // admin, operator, mahasiswa, dll
  createdAt DateTime @default(now())
}
```

### B. Konfigurasi Domain & Path
Tentukan "Base Path" tim Anda. Contoh: `/persuratan-pkl`. Ini harus unik antar tim.

---

## ⚙️ 3. IMPLEMENTASI BACKEND (NODE.JS / ELYSIA / EXPRESS)

Backend adalah pusat keamanan. Di sini Anda melakukan validasi dan penerbitan sesi.

### A. Variabel Environment (.env)
```env
SSO_HOST="https://apps-fsm.undip.ac.id/sso_api"
FRONTEND_URL="https://apps-fsm.undip.ac.id/persuratan-pkl"
JWT_SECRET="Gunakan_String_Random_Sangat_Kuat_Dan_Unik_Per_Tim"
```

### B. Route Penukar Token (Contoh: `src/routes/auth/sso.ts`)
```typescript
/**
 * Alur:
 * 1. Tarik Authorization: Bearer <TOKEN_SSO> dari header.
 * 2. Fetch ke ${SSO_HOST}/users/me untuk verifikasi.
 * 3. JIKA SUKSES -> Cari email di DB lokal.
 * 4. JIKA USER ADA -> Buat JWT Lokal (durasi 7 hari).
 * 5. RETURN -> JSON berisi callback_url.
 */

// Step Validasi ke SSO Pusat
const ssoResponse = await fetch(`${process.env.SSO_HOST}/users/me`, {
    headers: { Authorization: `Bearer ${ssoToken}` }
});

if (!ssoResponse.ok) throw new Error("Token SSO tidak valid");
const ssoUser = await ssoResponse.json();
const emailFromSSO = ssoUser.data.username; // Field 'username' di SSO berisi email

// Step Whitelisting (Otorisasi)
const userLocal = await db.user.findUnique({ where: { email: emailFromSSO } });
if (!userLocal) throw new Error("Akses ditolak: Anda belum terdaftar di aplikasi ini.");

// Step Pembuatan JWT Lokal
const localToken = jwt.sign(
    { id: userLocal.id, email: userLocal.email, role: userLocal.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
);

return { 
    success: true, 
    callback_url: `${process.env.FRONTEND_URL}/sso/callback?token=${localToken}` 
};
```

---

## 🖥️ 4. IMPLEMENTASI FRONTEND (NEXT.JS / REACT)

Frontend menangani perpindahan halaman dan penyimpanan sesi.

### A. Tombol Login
Pada halaman `/login`, tautkan tombol "Login SSO" langsung ke Portal:
```typescript
const handleSSOLogin = () => {
    window.location.href = "https://apps-fsm.undip.ac.id/sso";
};
```

### B. Halaman Callback (`/sso/callback/page.tsx`)
Halaman ini tidak menampilkan konten, hanya memproses data:
1. Ambil `token` dari URL: `window.location.search`.
2. Simpan token ke `localStorage` (Auth Store).
3. Arahkan user ke Dashboard: `window.location.href = withBasePath("/dashboard")`.

### C. Utilitas Navigasi (Wajib di Setiap Link)
Buat file `src/lib/navigation.ts` untuk mencegah error 404:
```typescript
export const withBasePath = (path: string) => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${basePath}${cleanPath}`;
};
```
*Gunakan `withBasePath` untuk SEMUA link, redirect, dan sumber gambar.*

---

## 🛰️ 5. DEPLOYMENT & NGINX PROXY

Aplikasi Anda tidak berdiri sendiri, melainkan di balik Nginx Proxy pusat.

1. **Header Forwarding**: Pastikan Nginx mengirimkan header Host dan Proto asli agar redirect tidak rusak.
2. **Sub-path Pathing**: Jika Frontend Anda berada di `/app-tim-A`, pastikan `NEXT_PUBLIC_BASE_PATH` Anda diset ke `/app-tim-A`.
3. **Rebuild Frontend**: Setelah mengubah `.env`, Anda **WAJIB** menjalankan `npm run build` ulang agar variabel tertanam ke dalam kode statis.

---

## 🚨 6. PANDUAN TROUBLESHOOTING (SOLUSI MANDIRI)

1. **Kenapa Muncul 404?**
   - Cek apakah Anda memanggil link tanpa `withBasePath`.
   - Cek apakah `NEXT_PUBLIC_BASE_PATH` di `.env` sudah sama dengan konfigurasi Nginx.
2. **Kenapa Tombol Login SSO Hanya Refresh Halaman?**
   - Pastikan URL redirect di Portal SSO pusat sudah didaftarkan (minta bantuan Admin Server FSM).
3. **Kenapa Sering Terlempar ke Login Lagi?**
   - `JWT_SECRET` di Backend dan Frontend tidak cocok.
   - Jam server berbeda dengan jam browser pengguna.
4. **Gagal Login: "User Not Found"**
   - Ini bukan error SSO, tapi tanda bahwa email user tersebut belum di-backup atau dimasukkan ke tabel `User` oleh Admin aplikasi Anda.

---
**DOKUMEN INI ADALAH STANDAR BAKU FSM.**
*Tidak diperkenankan mengubah alur keamanan tanpa persetujuan Admin Sistem Pusat.*
