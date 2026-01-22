# RENCANA IMPLEMENTASI (BERTAHAP) — SISTEM PERSURATAN PKL

Dokumen ini adalah roadmap coding yang **bertahap** untuk membangun sistem persuratan PKL sesuai dokumen proses bisnis final: `BUSINESS_PROCESS_PKL_FINAL.md`.

Tujuan: setiap fase menghasilkan output yang bisa diuji (API/UI) dan mengurangi risiko salah implementasi.

---

## 0) Kondisi project saat ini (baseline)

### Yang sudah ada (usable)
- **Backend** (`e-office-api-v2`):
  - Auth: better-auth (`/public/sign-in`, `/public/register`) + session guard
  - RBAC: Casbin terhubung ke tabel role/permission
  - Master data sebagian: user, mahasiswa, departemen, suratType, suratTemplate
  - Prisma schema sudah ada: `User`, `Role`, `Permission`, `LetterType`, `LetterTemplate`, `LetterInstance`
  - MinIO service sudah ada
  - Locking service (memory) sudah ada
- **Frontend** (`e-office-webapp-v2`):
  - UI flow PKL (multi-step) ada, tapi mayoritas masih dummy/mocked
  - Services letter/approval masih TODO
  - Proteksi dashboard route masih dikomentari

### Gap utama terhadap proses bisnis PKL
- Belum ada modul workflow end-to-end: submit → queue → approve/revise/reject → edit supervisor → sign WD1 → numbering UPA → download
- Belum ada tabel: workflow step history, document versioning, signature, numbering, dll
- Belum ada integrasi FE ke API nyata (login state/headers/cookies juga belum solid)

---

## 1) Prinsip implementasi (agar konsisten & minim bug)

- Semua aksi workflow harus **atomic** (Prisma transaction + locking bila perlu).
- Audit trail **append-only** (riwayat tidak diubah/hapus).
- **Preview** selalu menampilkan **versi dokumen terbaru**; semua versi lama tetap bisa diunduh (audit).
- Template superadmin hanya berlaku untuk pengajuan baru (tidak regenerate surat berjalan).
- Setelah WD1 tanda tangan dan/atau UPA numbering → dokumen menjadi **read-only** sesuai aturan.

---

## 2) Fase implementasi (bertahap)

## Phase 0 — Alignment & “keputusan final” (tanpa coding besar)
**Output:**
- Dokumen proses bisnis final sudah jadi (`BUSINESS_PROCESS_PKL_FINAL.md`) ✅
- Tambahan: daftar **kontrak API** & definisi status/step yang akan dipakai di DB/API/UI

**Checklist keputusan yang harus final sebelum schema DB:**
- Enum step (Mahasiswa, Dospem, Koordinator, Kaprodi, AdminFak, Supervisor, ManajerTU, WD1, UPA)
- Status surat global yang sederhana (mis. DRAFT/PROCESSING/REJECTED/COMPLETED) + status per-step (APPROVED/REVISED/REJECTED/PENDING)
- Format nomor surat final: `AK15-{counter2digit}/{DD}/{MM}/{YYYY}`

## Phase 1 — DB Schema & Migration (pondasi workflow)
**Goal:** DB siap menyimpan workflow, history, dan versi dokumen.

**Yang ditambahkan (model konseptual):**
- `PklLetter`/`LetterInstance` diperluas untuk menyimpan:
  - currentStep + status global + flags (signedAt, numberedAt)
  - assignee per-step (dospem userId, koordinator userId, dst)
- `LetterStepHistory` (append-only): action, step, actor userId, comment, timestamp, fromStep→toStep, reference documentVersionId
- `LetterDocumentVersion` (major): versionNumber, storageKey/url, createdBy, createdAt, reason (submit/edit/resubmit/numbering/sign)
- `LetterAttachment` (lampiran): list file + metadata + status aktif
- `LetterSignature` (WD1): metode (upload/pad), storageKey/url, createdAt
- `LetterNumbering` (UPA): nomor final, counter, tanggal, createdAt, assignedBy

**Acceptance criteria:**
- Migration jalan, seed bisa dibuat untuk role-role PKL
- Tidak ada ambiguity tentang “satu surat aktif per mahasiswa”

## Phase 2 — Backend API minimal (end-to-end tanpa editor dulu)
**Goal:** workflow berjalan sampai selesai dengan dokumen “placeholder” (tanpa Word-like editor dulu), tapi sudah bisa preview.

**Endpoint minimum (draft):**
- Mahasiswa:
  - `POST /letter/pkl/submit`
  - `GET /letter/my`
  - `GET /letter/:id`
  - `POST /letter/:id/cancel` (sebelum WD1 sign)
  - `POST /letter/:id/self-revise` (rollback 1 step dari current pending)
- Approver (per role):
  - `GET /letter/queue` (filter by role yang sedang dipilih)
  - `POST /letter/:id/approve`
  - `POST /letter/:id/reject`
  - `POST /letter/:id/revise`
- WD1:
  - approve mencakup signature payload (upload/pad)
- UPA:
  - `POST /letter/:id/numbering` (suggestion + manual)
- Preview/download:
  - `GET /letter/:id/preview` (latest)
  - `GET /letter/:id/versions` + `GET /letter/:id/versions/:versionId/download`

**Acceptance criteria:**
- Dengan data seed, kita bisa menjalankan skenario:
  - submit → approve berantai → sign WD1 → numbering UPA → status selesai
- Revisi dan self-revise benar-benar rollback 1 step dan memaksa re-approve sesuai aturan

## Phase 3 — Frontend integrasi minimal
**Goal:** UI PKL dan UI approver benar-benar memakai API.

**Deliverables:**
- Login menyimpan state (user + role list) dan route dashboard diproteksi
- PKL multi-step mengirim data ke submit endpoint
- Halaman daftar surat + detail (timeline + preview)
- Mode approver (pilih role) + queue + approve/reject/revise + preview
- Mode UPA: form penomoran dengan suggestion dan validasi uniqueness

**Acceptance criteria:**
- End-to-end bisa dilakukan dari UI tanpa manual API calls

## Phase 4 — Supervisor Akademik editor + versioning major
**Goal:** implement “Word-like editor” di web (minim viable).

**Incremental approach (agar realistis):**
- Mulai dari model: dokumen disimpan sebagai file (mis. HTML/PDF) per version
- UI editor: edit konten surat + save → membuat version baru
- Setelah approve supervisor: versi terbaru dipakai untuk step berikutnya (preview PDF)

**Acceptance criteria:**
- Edit menghasilkan version baru, versi lama tetap bisa didownload, preview selalu versi terbaru

## Phase 5 — Hardening & quality
**Goal:** kurangi bug operasional dan lock spek.

**Checklist:**
- Transactions + locking untuk race condition approve/revise/numbering
- RBAC matrix lengkap untuk semua endpoint
- Audit log benar-benar append-only
- Validasi cancel sebelum WD1 sign, read-only setelah numbering
- Seed lengkap 1 user per role fix + banyak dospem + mapping prodi→koordinator/kaprodi

---

## 3) Cara kerja bertahap saat coding (mekanisme kontrol)
- Setiap selesai fase, kita lakukan:
  - smoke test API (minimal: submit + approve chain)
  - verifikasi rule bisnis paling kritis (rollback 1 step, versioning, numbering uniqueness)
- Jangan lanjut fase berikutnya sebelum acceptance criteria fase sekarang terpenuhi.

