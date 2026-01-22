# KONTRAK TEKNIS (API + DATA MODEL) — SISTEM PERSURATAN PKL

Dokumen ini adalah **kontrak teknis** yang menjadi acuan implementasi backend & frontend untuk sistem persuratan **Surat Pengantar PKL**.

Sumber bisnis: `BUSINESS_PROCESS_PKL_FINAL.md`.

---

## 0) Scope

- Hanya 1 jenis surat: **PKL**
- Workflow **fix** dan sequential:
  1) Mahasiswa → 2) Dosen Pembimbing → 3) Dosen Koordinator → 4) Kaprodi → 5) Admin Fakultas → 6) Supervisor Akademik (edit) → 7) Manajer TU → 8) WD1 (TTD) → 9) UPA (Nomor) → 10) Selesai
- Tidak ada fitur override.

---

## 1) Identitas & Auth

### 1.1 Session/Auth model (high-level)
- Backend memakai **better-auth** (session-based).
- Semua endpoint protected harus memakai `authGuardPlugin` (session wajib).

### 1.2 Mode user (multi-role)
- 1 user bisa punya banyak role.
- Client memilih **activeRole** untuk membuka queue dan melakukan action.
- `activeRole` dikirim via header (disarankan):
  - `X-Active-Role: <role_name>`

---

## 2) Enum & Konstanta FINAL

### 2.1 Roles (nama role persis)

> Ini adalah **kontrak string role** yang akan dipakai di DB/API/UI.

- `mahasiswa`
- `dosen_pembimbing`
- `dosen_koordinator`
- `ketua_program_studi`
- `admin_fakultas`
- `supervisor_akademik`
- `manajer_tu`
- `wakil_dekan_1`
- `upa`
- `superadmin` (untuk master data/config, bukan workflow action)

### 2.2 Workflow step keys

> Step key digunakan untuk current step dan history.

Urutan fix:
1. `DOSEN_PEMBIMBING`
2. `DOSEN_KOORDINATOR`
3. `KETUA_PROGRAM_STUDI`
4. `ADMIN_FAKULTAS`
5. `SUPERVISOR_AKADEMIK`
6. `MANAJER_TU`
7. `WAKIL_DEKAN_1`
8. `UPA`

Catatan:
- Mahasiswa bukan “approver step”, tetapi merupakan origin submit + actor revisi/cancel.
- Setelah `UPA` selesai → surat terminal `SELESAI`.

### 2.3 Status surat (global)

Disarankan minimal untuk state machine global:
- `DRAFT`
- `PROCESSING`
- `REJECTED` (terminal)
- `CANCELLED` (terminal)
- `COMPLETED` (terminal)

> Status konseptual bisnis seperti “Menunggu Verifikasi [Role]”, “Ditandatangani”, “Dinomori” diturunkan dari kombinasi: `currentStep` + milestone flags + history.

### 2.4 Status per-step (untuk history)
- `PENDING` (step aktif saat ini)
- `APPROVED`
- `REVISED`
- `REJECTED`

### 2.5 Penomoran (FINAL)
- Format final nomor: `AK15-{counter2digit}/{DD}/{MM}/{YYYY}`
- Unik berdasarkan: `(jenis_surat=PKL, tanggal)` dengan pembeda `counter`.
- Contoh: `AK15-01/22/01/2026`, `AK15-02/22/01/2026`.

---

## 3) Rules bisnis yang wajib di-hardcode (bukan sekadar UI)

### 3.1 Satu surat aktif per mahasiswa
Mahasiswa hanya boleh punya **1 surat PKL aktif** sampai terminal (COMPLETED/REJECTED/CANCELLED).

### 3.2 Cancel rule
Mahasiswa boleh cancel **sebelum** WD1 melakukan tanda tangan.
Setelah surat masuk milestone “signed” → cancel ditolak.

### 3.3 Preview rule
Mulai setelah submit, setiap approver di setiap step dapat melihat **preview surat versi terbaru** sebelum mengambil aksi.

### 3.4 Revision rule (rollback 1 step)
Ada 2 tipe revisi:
- `revise` oleh approver
- `self-revise` oleh mahasiswa

Aturan:
- Rollback **mundur 1 step dari current step yang sedang pending**.
- Step yang terkena rollback harus **approve ulang** (reset), tetapi history tetap tersimpan (append-only).

### 3.5 Versioning rule (major version)
- Setiap perubahan apapun menghasilkan **versi dokumen baru** (major: v1, v2, v3, ...).
- Semua versi lama harus bisa di-download (audit).
- Approver selalu melihat versi terbaru (bukan memilih versi).
- Perubahan template oleh superadmin hanya berlaku untuk pengajuan baru (tidak regenerate surat berjalan).

---

## 4) Model data konseptual (untuk Prisma schema Phase-1)

> Nama tabel final akan disesuaikan Prisma naming; yang penting struktur & relasinya.

### 4.1 Letter (PKL)
`Letter` merepresentasikan 1 surat PKL yang berjalan.

Fields minimum:
- `id`
- `type = PKL`
- `createdByUserId` (mahasiswa)
- `prodiId` (untuk assignment)
- `status` (global)
- `currentStep` (step key) — null jika DRAFT
- `assignedDosenPembimbingUserId`
- `assignedDosenKoordinatorUserId`
- `assignedKaprodiUserId`
- `assignedAdminFakultasUserId`
- `assignedSupervisorAkademikUserId`
- `assignedManajerTuUserId`
- `assignedWakilDekan1UserId`
- `assignedUpaUserId`
- Milestone:
  - `signedAt` (nullable)
  - `numberedAt` (nullable)
  - `letterNumber` (nullable, final)
- `createdAt`, `updatedAt`

### 4.2 LetterStepHistory (append-only)
Mencatat event workflow.

Fields minimum:
- `id`
- `letterId`
- `step` (nullable untuk event mahasiswa submit/cancel/self-revise)
- `action` (`SUBMITTED`, `APPROVED`, `REJECTED`, `REVISED`, `SELF_REVISED`, `CANCELLED`, `NUMBERED`, `SIGNED`, `EDITED`)
- `actorUserId`
- `actorRole`
- `comment` (nullable/required sesuai aturan UI)
- `fromStep`, `toStep` (nullable)
- `documentVersionId` (nullable)
- `createdAt`

### 4.3 LetterDocumentVersion (major versions)
Fields minimum:
- `id`
- `letterId`
- `versionNumber` (1..N)
- `createdByUserId`
- `createdByRole`
- `reason` (`SUBMIT`, `RESUBMIT`, `EDIT_SUPERVISOR`, `SIGN`, `NUMBERING`, `ATTACHMENT_CHANGE`, etc.)
- `storageKey` / `url` (MinIO)
- `mimeType` (`application/pdf`, dll)
- `createdAt`

### 4.4 Attachment
Fields minimum:
- `id`
- `letterId`
- `fileName`
- `storageKey` / `url`
- `category` (mis. `LAMPIRAN`)
- `createdByUserId`
- `createdAt`
- `isActive` (untuk “diganti” tapi tetap menyimpan yang lama)

### 4.5 Signature (WD1)
Fields minimum:
- `id`
- `letterId`
- `signedByUserId`
- `method` (`UPLOAD`, `PAD`)
- `storageKey` / `url`
- `createdAt`

### 4.6 Numbering (UPA)
Fields minimum:
- `id`
- `letterId`
- `assignedByUserId`
- `date` (DD/MM/YYYY sebagai date object di DB)
- `counter` (int)
- `numberString` (final, `AK15-xx/DD/MM/YYYY`)
- `createdAt`

---

## 5) Kontrak API (draft endpoint list)

> Semua endpoint di bawah **protected** kecuali sign-in/register.
> Response dibungkus standar `{ success, data?, message?, error? }` (atau mengikuti style backend yang dipakai).

### 5.1 Public
- `POST /public/sign-in`
- `POST /public/register`

### 5.2 Common
- `GET /me` → info user + roles
- `GET /letter/:id` → detail surat + currentStep + history + latestVersion + attachments + letterNumber (jika ada)
- `GET /letter/:id/preview` → stream/file preview **versi terbaru**
- `GET /letter/:id/versions` → list semua versi
- `GET /letter/:id/versions/:versionId/download` → download versi tertentu

### 5.3 Mahasiswa
- `POST /letter/pkl/submit`
- `GET /letter/my`
- `POST /letter/:id/cancel` (hanya sebelum WD1 sign)
- `POST /letter/:id/self-revise` (rollback 1 step dari current pending)
- `POST /letter/:id/attachments` (upload/tambah/ganti; boleh selama belum sign)

### 5.4 Approver (semua role approver)
- `GET /letter/queue` (berdasarkan `X-Active-Role`)
- `POST /letter/:id/approve`
- `POST /letter/:id/reject`
- `POST /letter/:id/revise`

### 5.5 Supervisor Akademik (khusus)
- `POST /letter/:id/edit` (save perubahan → create document version baru)

### 5.6 Wakil Dekan 1 (khusus)
- approve request membawa signature payload:
  - `signatureMethod = UPLOAD|PAD`
  - `signatureFile` atau `signatureData`

### 5.7 UPA (khusus)
- `GET /letter/:id/numbering/suggestion` → suggestion nomor berikutnya untuk tanggal hari ini (atau tanggal input)
- `POST /letter/:id/numbering` → set nomor final (manual bisa override suggestion)

---

## 6) Request/Response minimal (schema ringkas)

### 6.1 Submit PKL (Mahasiswa)
`POST /letter/pkl/submit`

Request minimal:
- `prodiId`
- `dosenPembimbingUserId`
- `formData` (struktur final mengikuti form PKL)
- `attachments` (opsional, atau upload terpisah)

Response minimal:
- `letterId`
- `status = PROCESSING`
- `currentStep = DOSEN_PEMBIMBING`

### 6.2 Queue Approver
`GET /letter/queue` + header `X-Active-Role`

Response:
- list surat yang `currentStep` sesuai role dan status global `PROCESSING`.

### 6.3 Approve/Reject/Revise
`POST /letter/:id/approve|reject|revise`

Request:
- `comment` (wajib untuk revise/reject; optional untuk approve)

Rule:
- Hanya bisa dilakukan oleh user yang sesuai assignment step saat itu.

### 6.4 Numbering
`POST /letter/:id/numbering`

Request:
- `numberString` (opsional jika pakai suggestion)
- `date` (opsional; default today)

Rule:
- Setelah numbering sukses → global status `COMPLETED`, dokumen read-only.

---

## 7) Error contract (minimal)

- `401 Unauthorized`: session tidak valid
- `403 Forbidden`: role/permission salah atau bukan assignee step
- `409 Conflict`: race condition / step sudah berubah / nomor duplikat
- `422 Unprocessable Entity`: melanggar rule bisnis (mis. cancel setelah signed, submit saat masih ada surat aktif, numbering sebelum signed)

---

## 8) Catatan implementasi yang sengaja “ditunda”

Agar bertahap:
- Editor supervisor: akan dibuat minimal viable di Phase 4 (tapi kontraknya sudah dicantumkan)
- Notifikasi real-time: out of scope fase ini

