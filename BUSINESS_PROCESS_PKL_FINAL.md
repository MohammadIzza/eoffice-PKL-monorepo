# PROSES BISNIS (SRS) — APLIKASI PERSURATAN FAKULTAS (PKL)

**Scope dokumen ini (FINAL untuk fase sekarang):**
- Aplikasi hanya menangani **1 jenis surat**: **Surat Pengantar PKL**
- Workflow hanya **1** dan **fix** (tidak configurable pada fase ini)
- Proses approval bersifat **sequential** (tidak boleh skip step)

Dokumen ini menjadi acuan implementasi agar proses coding tidak menyimpang dari kebutuhan bisnis yang sudah disepakati.

---

## 1. Gambaran Umum Sistem

Aplikasi Persuratan Fakultas adalah sistem digital untuk mengelola proses pengajuan dan penerbitan surat resmi fakultas secara terstruktur, berjenjang, dan terdokumentasi.

Output akhir sistem adalah **surat resmi** yang:
- Telah diverifikasi semua pihak terkait (sesuai urutan step)
- Telah ditandatangani pejabat berwenang (WD1)
- Telah memiliki nomor surat resmi (UPA)
- Dapat dipreview dan diunduh oleh mahasiswa

---

## 2. Aktor dalam Sistem

Aktor yang terlibat dalam proses bisnis ini:
1. Mahasiswa (pemohon surat)
2. Dosen Pembimbing
3. Dosen Koordinator
4. Ketua Program Studi
5. Admin Fakultas
6. Supervisor Akademik (memiliki hak edit redaksi dokumen)
7. Manajer Tata Usaha
8. Wakil Dekan 1 (TTD digital)
9. UPA (penomoran surat)
10. Sistem (event otomatis: generate dokumen, logging, audit)

> **Catatan:** “Sistem” bukan step approval utama, melainkan event otomatis yang terjadi pada momen-momen tertentu.

---

## 3. Prinsip Dasar Workflow

1. Proses bersifat **sequential approval**.
2. Satu surat hanya aktif pada **1 tahap verifikasi** (1 current step).
3. Setiap tahap memiliki:
   - aksi
   - status per-step (mis. Disetujui/Ditolak/Direvisi pada step tersebut)
   - komentar
   - timestamp
   - aktor (user + role)
4. Seluruh aksi dicatat sebagai **stepper history** (audit trail, append-only).
5. Surat memiliki **versi dokumen** (major version) dan semua versi lama **wajib bisa diunduh**.
6. Tidak ada tahap yang boleh dilewati.
7. Surat hanya bisa maju jika tahap sebelumnya **disetujui**.

---

## 4. Definisi Workflow PKL (Urutan Step FINAL)

Urutan step fix dari awal sampai selesai:
1. **Mahasiswa** (Submit pengajuan)
2. **Dosen Pembimbing** (Verifikasi)
3. **Dosen Koordinator** (Verifikasi)
4. **Ketua Program Studi** (Verifikasi)
5. **Admin Fakultas** (Verifikasi)
6. **Supervisor Akademik** (Verifikasi + **Edit Dokumen**)
7. **Manajer Tata Usaha** (Verifikasi)
8. **Wakil Dekan 1** (Verifikasi + **TTD Digital**)
9. **UPA** (Penomoran + Lock dokumen)
10. **Distribusi ke Mahasiswa** (Selesai & download)

---

## 5. Assignment (Penentuan Approver)

### 5.1 Prinsip assignment
- Mahasiswa saat submit membawa data **Program Studi (prodi)**.
- **Dosen Pembimbing** dipilih oleh mahasiswa (wajib tepat 1 orang; kandidat banyak).
- **Dosen Koordinator** & **Kaprodi** ditentukan berdasarkan **prodi** mahasiswa.
- **Supervisor Akademik**, **Manajer TU**, **Wakil Dekan 1**, **UPA** masing-masing **hanya 1 user per role** (fix).

### 5.2 Kepemilikan role
- Secara umum: **1 role dimiliki oleh 1 user**.
- Pengecualian: **role Dosen Pembimbing** dapat dimiliki oleh banyak user.
- **1 user dapat memiliki lebih dari 1 role** (user memilih mode/tampilan role saat masuk).

### 5.3 Blocking rule (master data wajib lengkap)
- Jika ada role/assignment wajib yang belum terisi (misal Kaprodi belum ditentukan) maka:
  - **Submit surat diblok**.
  - Superadmin bertugas memastikan master data lengkap sebelum sistem dipakai.

---

## 6. Proses Bisnis Utama (End-to-End)

### 6.1 Pengajuan Surat oleh Mahasiswa

Langkah:
1. Mahasiswa memilih jenis surat (PKL)
2. Mengisi formulir pengajuan
3. Memilih **1** dosen pembimbing
4. Mengirim pengajuan surat

Saat pengajuan dikirim, Sistem melakukan event otomatis:
- menyimpan data pengajuan
- membuat **draft dokumen awal** berdasarkan template
- mencatat history: “Diajukan oleh Mahasiswa”
- mengirim surat ke **Dosen Pembimbing** (current step berpindah ke Dosen Pembimbing)

**Preview surat (mulai setelah submit):**
- Setelah status menjadi “Diajukan oleh Mahasiswa”, surat dapat di-**preview** oleh pihak yang terlibat pada proses berikutnya.
- Pada setiap step verifikasi, approver dapat melihat **preview surat versi terbaru** sebelum mengambil aksi (setujui/tolak/revisi).

Mahasiswa dapat:
- melihat daftar surat miliknya
- melihat detail surat + progress verifikasi
- melakukan revisi (self-revise) sesuai aturan
- membatalkan surat **sebelum** WD1 tanda tangan

### 6.2 Verifikasi oleh Dosen Pembimbing

Aksi:
- Setujui
- Tolak
- Revisi

Fitur pendukung:
- **Preview surat (versi terbaru)**
- Komentar pada setiap aksi
- Melihat riwayat proses

Jika:
- Setujui → lanjut ke Dosen Koordinator
- Revisi → kembali ke mahasiswa (dengan aturan rollback 1 step, lihat bagian Revisi)
- Tolak → proses berhenti (terminal)

### 6.3 Verifikasi oleh Dosen Koordinator

Aksi:
- Setujui
- Tolak
- Revisi

Fitur pendukung:
- **Preview surat (versi terbaru)**
- Komentar pada setiap aksi
- Melihat riwayat proses

Jika disetujui → lanjut ke Ketua Program Studi.

### 6.4 Verifikasi oleh Ketua Program Studi

Aksi:
- Setujui
- Tolak
- Revisi

Fitur pendukung:
- **Preview surat (versi terbaru)**
- Komentar pada setiap aksi
- Melihat riwayat proses

Jika disetujui → lanjut ke Admin Fakultas.

### 6.5 Verifikasi oleh Admin Fakultas

Aksi:
- Setujui
- Tolak
- Revisi

Fitur pendukung:
- **Preview surat (versi terbaru)**
- Komentar pada setiap aksi
- Melihat riwayat proses

Jika disetujui → lanjut ke Supervisor Akademik.

### 6.6 Verifikasi & Editing oleh Supervisor Akademik (Khusus)

Supervisor Akademik dapat:
- Setujui
- Tolak
- Revisi
- **Edit isi surat di website (Word-like editor)** — hanya role ini yang boleh melakukan edit redaksi.

Fitur pendukung:
- **Preview surat (versi terbaru)** sebelum dan/atau sesudah edit
- Komentar pada setiap aksi
- Melihat riwayat proses

Ketentuan editing:
- Editing dilakukan sebelum tanda tangan dan penomoran.
- Editing dapat mengubah redaksi dan format.
- **Setiap perubahan apapun menghasilkan versi dokumen baru (major version)**.
- Versi sebelumnya tetap tersimpan dan **dapat diunduh**.
- Setelah Supervisor menyetujui, dokumen tersedia sebagai **PDF** untuk dipreview step selanjutnya.
- Approver di step selanjutnya melihat **versi terbaru saja** (bukan memilih versi).

Jika disetujui → lanjut ke Manajer TU.

### 6.7 Verifikasi oleh Manajer Tata Usaha

Aksi:
- Setujui
- Tolak
- Revisi

Fitur pendukung:
- **Preview surat (versi terbaru)**
- Komentar pada setiap aksi
- Melihat riwayat proses

Jika disetujui → lanjut ke Wakil Dekan 1.

### 6.8 Verifikasi & Tanda Tangan oleh Wakil Dekan 1

Aksi:
- Setujui
- Tolak
- Revisi

Fitur pendukung:
- **Preview surat (versi terbaru)**
- Komentar pada setiap aksi
- Melihat riwayat proses

Ketentuan TTD:
- TTD digital dilakukan **otomatis saat approve**.
- Metode TTD yang diterima:
  - upload gambar (PNG)
  - live signature pad
- TTD menjadi bagian dari dokumen (tercatat sebagai versi dokumen).

Jika disetujui + TTD → lanjut ke penomoran (UPA).

### 6.9 Penomoran Surat oleh UPA

Tahap penomoran dilakukan setelah tanda tangan.

Proses:
- sistem menampilkan suggestion nomor surat
- UPA dapat menerima suggestion atau input manual
- nomor dimasukkan ke dokumen
- dokumen dikunci (**read-only**, terminal untuk perubahan konten)

Fitur pendukung:
- **Preview surat (versi terbaru)** sebelum penomoran dan setelah nomor ditetapkan
- Melihat riwayat proses

### 6.10 Distribusi Surat ke Mahasiswa

Setelah selesai:
- status surat menjadi **Selesai**
- surat tersedia untuk mahasiswa:
  - preview dokumen final
  - download surat resmi

---

## 7. Mekanisme Revisi (Rollback 1 Step)

Jenis revisi:
1. **Revisi diminta approver** (action: Revisi) → surat kembali ke mahasiswa.
2. **Self-revise oleh mahasiswa** → surat mundur 1 step dari **current step yang sedang pending**.

Aturan rollback:
- Rollback selalu **mundur 1 step**.
- Step yang sudah pernah disetujui dan terdampak rollback:
  - wajib **approve ulang** (reset),
  - namun riwayat lama **tetap tersimpan** di history.

---

## 8. Aturan Surat Aktif & Pembatalan

### 8.1 Batas 1 surat aktif per mahasiswa
- **1 mahasiswa hanya boleh memiliki 1 surat PKL aktif** sampai terminal:
  - Selesai, atau
  - Dibatalkan, atau
  - Ditolak

### 8.2 Pembatalan oleh mahasiswa
- Mahasiswa boleh membatalkan surat **sebelum** WD1 melakukan tanda tangan.
- Setelah WD1 tanda tangan → tidak bisa dibatalkan oleh mahasiswa.

---

## 9. Status Surat (Konseptual)

Status konseptual yang dipakai untuk komunikasi UI/UX:
- Draft
- Diajukan
- Menunggu Verifikasi [Role]
- Disetujui (status **per-step**)
- Direvisi
- Ditolak (terminal)
- Ditandatangani (milestone setelah WD1)
- Dinomori (milestone setelah UPA)
- Selesai (terminal)

> Implementasi teknis boleh memisahkan “status surat global” vs “status per-step”, namun definisi bisnis di atas harus tetap terpenuhi.

---

## 10. Audit Trail & Versioning

Setiap surat menyimpan:
- riwayat proses lengkap (stepper history, append-only)
- riwayat komentar
- riwayat versi dokumen (major version) dan **semua versi bisa diunduh**
- log waktu dan aktor

---

## 11. Penomoran Surat (FINAL)

### 11.1 Format nomor surat PKL
- Format final (uppercase):

`AK15-{counter2digit}/{DD}/{MM}/{YYYY}`

Contoh (22 Jan 2026):
- `AK15-01/22/01/2026`
- `AK15-02/22/01/2026`
- `AK15-03/22/01/2026`

### 11.2 Aturan uniqueness
- Unik berdasarkan **tanggal + jenis surat (PKL)**.
- Jika dalam 1 tanggal ada banyak surat PKL, dibedakan dengan **counter/sequence**.

---

## 12. Hak Akses & Visibilitas Data (Ringkas)

- Mahasiswa:
  - hanya dapat melihat surat miliknya
- Approver:
  - hanya melihat surat yang **menunggu approval** pada role tersebut (queue)
- Superadmin:
  - memastikan master data/assignment approver lengkap (karena submit diblok jika assignment belum lengkap)
  - mengelola konfigurasi sistem yang diperlukan (mis. template untuk pengajuan baru)

---

## 13. Catatan Implementasi (Non-Fungsional, untuk menghindari bug)

Untuk menghindari kesalahan implementasi di masa coding:
- Semua transisi step harus atomic (gunakan locking/transaction).
- Semua history wajib append-only (jangan update history lama).
- Setelah WD1 TTD dan/atau UPA numbering, validasi ketat agar perubahan data/dokumen tidak melanggar aturan read-only.

