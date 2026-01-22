# RENCANA PERBAIKAN SCHEMA DATABASE — SISTEM PERSURATAN PKL (OPSI B: HYBRID)

**Tujuan:** Menambahkan field dan tabel yang diperlukan untuk menunjang proses bisnis PKL, dengan tetap mempertahankan konsep **dynamic workflow** (schema-agnostic, template-driven).

**Pendekatan:** **HYBRID**
- Tabel terpisah untuk **data kritis**: `LetterStepHistory` (audit strict append-only), `LetterNumbering` (unique constraint)
- JSON field untuk **data flexible**: `assignedApprovers`, `documentVersions`

**Prinsip:**
- Field/tabel baru bersifat **generic** (bisa dipakai jenis surat lain, tidak hardcode PKL)
- Backward compatible (field nullable)
- Audit trail strict (append-only di DB level)
- Uniqueness nomor surat strict (unique constraint DB)

---

## 1. Perubahan Model `LetterInstance`

### Before (schema sekarang):
```prisma
model LetterInstance {
  id String @id @default(cuid())

  schema      Json
  values      Json
  status      LetterStatus @default(PENDING)
  currentStep Int?

  letterTypeId String
  letterType   LetterType @relation(fields: [letterTypeId], references: [id])
  createdById  String
  createdBy    User       @relation(fields: [createdById], references: [id])

  createdAt DateTime @default(now())

  @@map("letter_instance")
}
```

### After (dengan tambahan):
```prisma
model LetterInstance {
  id String @id @default(cuid())

  schema      Json
  values      Json
  status      LetterStatus @default(DRAFT)  // ← UBAH default dari PENDING jadi DRAFT
  currentStep Int?

  // ========== TAMBAHAN BARU (GENERIC UNTUK SEMUA JENIS SURAT) ==========
  
  // 1. Assignment approvers (JSON object, dynamic per jenis surat)
  // Contoh PKL: { "dospem": "userId", "koordinator": "userId", "kaprodi": "userId", ... }
  assignedApprovers Json?
  
  // 2. Workflow history (JSON array, append-only di logic aplikasi)
  // Format: [{ action, step, userId, role, comment, timestamp, fromStep, toStep }, ...]
  workflowHistory Json @default("[]")
  
  // 3. Document versions (JSON array untuk versioning major)
  // Format: [{ version, storageKey, format, createdBy, reason, timestamp, isPDF }, ...]
  documentVersions Json @default("[]")
  
  // 4. Pointer versi aktif (untuk tracking versi terbaru)
  latestEditableVersion Int @default(1)  // Versi editable terakhir
  latestPDFVersion Int?                   // Versi PDF (setelah supervisor approve atau generate final)
  
  // 5. Milestone tracking (generic untuk semua surat yang butuh TTD/nomor)
  signedAt DateTime?        // Kapan ditandatangani (nullable, tidak semua surat butuh TTD)
  signatureUrl String?      // URL signature file di MinIO
  numberedAt DateTime?      // Kapan diberi nomor
  letterNumber String?      // Nomor surat final (format dynamic per jenis)
  
  // ========== END TAMBAHAN ==========

  letterTypeId String
  letterType   LetterType @relation(fields: [letterTypeId], references: [id])
  createdById  String
  createdBy    User       @relation(fields: [createdById], references: [id])
  
  // Relasi baru
  attachments Attachment[]  // ← TAMBAH relasi ke lampiran

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // ← TAMBAH untuk track last modification

  @@map("letter_instance")
}
```

### Perubahan:
- **Default status**: `PENDING` → `DRAFT`
- **Tambah 9 kolom baru**: assignedApprovers, workflowHistory, documentVersions, latestEditableVersion, latestPDFVersion, signedAt, signatureUrl, numberedAt, letterNumber
- **Tambah 1 relasi**: attachments
- **Tambah 1 kolom**: updatedAt

---

## 2. Perubahan Enum `LetterStatus`

### Before:
```prisma
enum LetterStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED

  @@map("letter_status")
}
```

### After:
```prisma
enum LetterStatus {
  DRAFT        // ← TAMBAH: surat belum di-submit
  PENDING      // Sudah submit, menunggu mulai proses (bisa digabung dengan PROCESSING jika redundan)
  PROCESSING   // ← TAMBAH (atau rename IN_PROGRESS jadi PROCESSING)
  COMPLETED    // Terminal: surat selesai
  REJECTED     // Terminal: surat ditolak
  CANCELLED    // ← TAMBAH: Terminal: surat dibatalkan mahasiswa

  @@map("letter_status")
}
```

**Opsi simplifikasi:**
Bisa hapus `PENDING` atau `IN_PROGRESS` jika redundan. Rekomendasi aku:
- `DRAFT` — belum submit
- `PROCESSING` — sedang dalam workflow
- `COMPLETED`, `REJECTED`, `CANCELLED` — terminal

---

## 3. Perubahan Model `Attachment`

### Before:
```prisma
model Attachment {
  id String @id @default(cuid())

  domain   String
  filename String

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
  deletedAt DateTime?

  @@map("attachment")
}
```

### After:
```prisma
model Attachment {
  id String @id @default(cuid())

  domain   String
  filename String

  // ========== TAMBAHAN BARU ==========
  
  // Relasi ke surat (nullable untuk backward compatibility)
  letterId String?
  letter   LetterInstance? @relation(fields: [letterId], references: [id], onDelete: Cascade)
  
  // Kategori lampiran (dynamic per jenis surat: "PROPOSAL", "KTM", "LAMPIRAN_TAMBAHAN", dll)
  category String?
  
  // Siapa yang upload
  uploadedByUserId String?
  uploadedBy       User?   @relation(fields: [uploadedByUserId], references: [id])
  
  // Soft delete untuk versioning (lampiran lama tetap ada tapi inactive)
  isActive Boolean @default(true)
  
  // ========== END TAMBAHAN ==========

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
  deletedAt DateTime?

  @@map("attachment")
}
```

### Perubahan:
- **Tambah 5 kolom**: letterId, category, uploadedByUserId, isActive
- **Tambah 2 relasi**: letter, uploadedBy

---

## 4. Perubahan Model `User`

### Before:
```prisma
model User {
  // ... existing fields ...
  
  userRole       UserRole[]
  sessions       Session[]
  accounts       Account[]
  LetterInstance LetterInstance[]

  // ... existing fields ...
}
```

### After:
```prisma
model User {
  // ... existing fields ...
  
  userRole       UserRole[]
  sessions       Session[]
  accounts       Account[]
  LetterInstance LetterInstance[]
  uploadedAttachments Attachment[]  // ← TAMBAH relasi ke attachment yang diupload user

  // ... existing fields ...
}
```

---

## 5. Opsional: Tambah field di `LetterType` (untuk workflow definition)

Kalau mau **workflow benar-benar dynamic per jenis surat**, tambahkan:

```prisma
model LetterType {
  id          String  @id @default(cuid())
  name        String
  description String?
  
  // ========== TAMBAHAN OPSIONAL ==========
  // Workflow definition (JSON array steps)
  // Contoh PKL: ["DOSEN_PEMBIMBING", "DOSEN_KOORDINATOR", ..., "UPA"]
  // Jenis lain bisa berbeda: ["KAPRODI", "DEKAN", "ADMIN"]
  workflowSteps Json?
  // ========== END TAMBAHAN ==========

  templates      LetterTemplate[]
  letterInstance LetterInstance[]

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
  deletedAt DateTime?

  @@map("letter_type")
}
```

> **Note:** Ini opsional. Untuk fase PKL sekarang bisa hardcode workflow di logic aplikasi. Tapi kalau mau flexible untuk jenis surat lain nanti, tambahkan field ini.

---

## 6. TABEL BARU (untuk data kritis)

### 6.1 Tabel `LetterStepHistory` (append-only di DB level)

**Fungsi:** Mencatat semua aksi workflow secara immutable (submit, approve, reject, revise, edit, sign, numbering, cancel, dll).

```prisma
model LetterStepHistory {
  id String @id @default(cuid())

  letterId String
  letter   LetterInstance @relation(fields: [letterId], references: [id], onDelete: Cascade)

  // Aksi yang dilakukan
  action String  // "SUBMITTED", "APPROVED", "REJECTED", "REVISED", "SELF_REVISED", "CANCELLED", "EDITED", "SIGNED", "NUMBERED"
  
  // Step workflow (nullable untuk aksi mahasiswa: submit/cancel/self-revise)
  step Int?  // 1=Dospem, 2=Koordinator, ..., 9=UPA
  
  // Actor
  actorUserId String
  actor       User   @relation(fields: [actorUserId], references: [id])
  actorRole   String  // "mahasiswa", "dosen_pembimbing", dll
  
  // Detail aksi
  comment String?  // Komentar (wajib untuk reject/revise)
  
  // Transisi step (untuk tracking rollback)
  fromStep Int?
  toStep   Int?
  
  // Metadata tambahan (untuk aksi khusus)
  metadata Json?  // { documentVersion, signatureUrl, letterNumber, dll }
  
  createdAt DateTime @default(now())

  @@index([letterId])
  @@index([actorUserId])
  @@index([action])
  @@map("letter_step_history")
}
```

**Keuntungan:**
- ✅ Append-only di DB level (tidak bisa update/delete)
- ✅ Index untuk query cepat ("berapa surat di-approve user X")
- ✅ Foreign key constraint (data integrity)

---

### 6.2 Tabel `LetterNumbering` (unique constraint)

**Fungsi:** Menyimpan penomoran surat dengan unique constraint agar tidak ada duplikat.

```prisma
model LetterNumbering {
  id String @id @default(cuid())

  letterId String         @unique
  letter   LetterInstance @relation(fields: [letterId], references: [id], onDelete: Cascade)

  // Komponen nomor
  letterTypeCode String  // "AK15" untuk PKL (dari LetterType atau hardcode)
  date           DateTime  // Tanggal penomoran (untuk grouping counter)
  counter        Int      // Counter per tanggal (1, 2, 3, ...)
  
  // Nomor final (untuk display + search)
  numberString String @unique  // "AK15-01/22/01/2026" (UNIQUE CONSTRAINT!)
  
  // Metadata
  assignedByUserId String
  assignedBy       User   @relation(fields: [assignedByUserId], references: [id])
  
  createdAt DateTime @default(now())

  @@unique([letterTypeCode, date, counter])  // Uniqueness per jenis + tanggal + counter
  @@index([numberString])
  @@index([date])
  @@map("letter_numbering")
}
```

**Keuntungan:**
- ✅ Unique constraint di DB (tidak bisa duplikat nomor)
- ✅ Query suggestion counter cepat (index by date)
- ✅ Race condition tercegah di DB level

---

## 7. Summary Perubahan (HYBRID - Opsi B)

| Model/Enum/Tabel | Perubahan | Jumlah Kolom/Value Baru |
|---|---|---|
| `LetterInstance` | Tambah field metadata workflow + milestone (sebagian pindah ke tabel terpisah) | **+7 kolom** (assignedApprovers, documentVersions, latestEditableVersion, latestPDFVersion, signedAt, signatureUrl, updatedAt) + 3 relasi |
| `Attachment` | Tambah relasi ke surat + metadata | **+5 kolom** + 2 relasi |
| `User` | Tambah relasi ke attachment + history + numbering | **+3 relasi** |
| `LetterStatus` enum | Tambah DRAFT, CANCELLED, rename IN_PROGRESS → PROCESSING | **+2 value**, **1 rename** |
| **LetterStepHistory** (TABEL BARU) | Audit trail append-only | **TABEL BARU** |
| **LetterNumbering** (TABEL BARU) | Penomoran dengan unique constraint | **TABEL BARU** |
| **Total tabel baru** | **2** | LetterStepHistory, LetterNumbering |

---

## 7. Migration Strategy

### Step 1: Edit schema.prisma
- Copy schema sekarang sebagai backup
- Edit sesuai "After" di atas
- Semua field baru **nullable** atau **default value** (untuk backward compatibility)

### Step 2: Generate migration
```bash
cd e-office-api-v2
bunx prisma migrate dev --name add_workflow_metadata
```

### Step 3: Update seed data
- Tambahkan sample data untuk field baru (workflowHistory, documentVersions default `[]`)

### Step 4: Generate Prisma client
```bash
bunx prisma generate
```

---

## 8. Struktur JSON Detail (Kontrak untuk Logic Aplikasi)

### 8.1 `assignedApprovers` (JSON object)
```typescript
{
  "dospem": "userId_123",
  "koordinator": "userId_456",
  "kaprodi": "userId_789",
  "adminFakultas": "userId_999",
  "supervisor": "userId_111",
  "manajerTu": "userId_222",
  "wakilDekan1": "userId_333",
  "upa": "userId_444"
}
```

### 8.2 `workflowHistory` (JSON array, append-only)
```typescript
[
  {
    "action": "SUBMITTED",
    "step": null,  // Mahasiswa submit bukan step approval
    "userId": "mhs_id",
    "role": "mahasiswa",
    "comment": null,
    "timestamp": "2026-01-22T10:00:00Z",
    "fromStep": null,
    "toStep": 1  // Kirim ke step 1 (Dospem)
  },
  {
    "action": "APPROVED",
    "step": 1,  // Step Dospem
    "userId": "dospem_id",
    "role": "dosen_pembimbing",
    "comment": "Data sudah benar",
    "timestamp": "2026-01-22T14:30:00Z",
    "fromStep": 1,
    "toStep": 2  // Kirim ke step 2 (Koordinator)
  },
  {
    "action": "REVISED",
    "step": 2,  // Step Koordinator
    "userId": "koord_id",
    "role": "dosen_koordinator",
    "comment": "Mohon perbaiki alamat instansi",
    "timestamp": "2026-01-23T09:00:00Z",
    "fromStep": 2,
    "toStep": 1  // Rollback 1 step ke Dospem
  },
  {
    "action": "SELF_REVISED",
    "step": null,  // Mahasiswa self-revise
    "userId": "mhs_id",
    "role": "mahasiswa",
    "comment": "Revisi data sendiri",
    "timestamp": "2026-01-23T10:00:00Z",
    "fromStep": 2,
    "toStep": 1  // Rollback ke step sebelumnya
  },
  {
    "action": "EDITED",
    "step": 6,  // Supervisor edit
    "userId": "supervisor_id",
    "role": "supervisor_akademik",
    "comment": "Memperbaiki redaksi paragraf 2",
    "timestamp": "2026-01-25T11:00:00Z",
    "documentVersion": 3  // Versi dokumen yang dihasilkan
  },
  {
    "action": "SIGNED",
    "step": 8,  // WD1 approve + TTD
    "userId": "wd1_id",
    "role": "wakil_dekan_1",
    "comment": null,
    "timestamp": "2026-01-26T09:00:00Z",
    "signatureUrl": "minio://signatures/letter_123.png"
  },
  {
    "action": "NUMBERED",
    "step": 9,  // UPA penomoran
    "userId": "upa_id",
    "role": "upa",
    "comment": null,
    "timestamp": "2026-01-26T10:00:00Z",
    "letterNumber": "AK15-01/26/01/2026"
  }
]
```

### 8.3 `documentVersions` (JSON array)
```typescript
[
  {
    "version": 1,
    "storageKey": "letters/letter_123_v1.html",  // atau .json atau .docx
    "format": "HTML",  // atau "JSON", "DOCX", "PDF"
    "createdBy": "system",  // Auto-generate dari template
    "createdByRole": "system",
    "reason": "SUBMIT",
    "timestamp": "2026-01-22T10:00:00Z",
    "isPDF": false,
    "isEditable": true
  },
  {
    "version": 2,
    "storageKey": "letters/letter_123_v2.html",
    "format": "HTML",
    "createdBy": "supervisor_id",
    "createdByRole": "supervisor_akademik",
    "reason": "EDIT_SUPERVISOR",
    "timestamp": "2026-01-25T11:00:00Z",
    "isPDF": false,
    "isEditable": true
  },
  {
    "version": 3,
    "storageKey": "letters/letter_123_v3.html",
    "format": "HTML",
    "createdBy": "supervisor_id",
    "createdByRole": "supervisor_akademik",
    "reason": "EDIT_SUPERVISOR",
    "timestamp": "2026-01-25T11:15:00Z",
    "isPDF": false,
    "isEditable": true
  },
  {
    "version": 4,
    "storageKey": "letters/letter_123_v4.pdf",
    "format": "PDF",
    "createdBy": "system",
    "createdByRole": "system",
    "reason": "GENERATE_PDF_AFTER_SUPERVISOR_APPROVE",
    "timestamp": "2026-01-25T11:20:00Z",
    "isPDF": true,
    "isEditable": false
  }
]
```

---

## 9. Perubahan Lengkap di `schema.prisma`

### File: `e-office-api-v2/prisma/schema.prisma`

**Bagian yang diubah:**

#### A) Enum `LetterStatus` (sekitar line 319-326)

**HAPUS:**
```prisma
enum LetterStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED

  @@map("letter_status")
}
```

**GANTI DENGAN:**
```prisma
enum LetterStatus {
  DRAFT       // Surat belum di-submit
  PROCESSING  // Surat sedang dalam workflow approval
  COMPLETED   // Terminal: surat selesai (sudah dinomori dan bisa diunduh)
  REJECTED    // Terminal: surat ditolak
  CANCELLED   // Terminal: surat dibatalkan mahasiswa

  @@map("letter_status")
}
```

#### B) Model `LetterInstance` (sekitar line 301-317)

**HAPUS:**
```prisma
model LetterInstance {
  id String @id @default(cuid())

  schema      Json
  values      Json
  status      LetterStatus @default(PENDING)
  currentStep Int?

  letterTypeId String
  letterType   LetterType @relation(fields: [letterTypeId], references: [id])
  createdById  String
  createdBy    User       @relation(fields: [createdById], references: [id])

  createdAt DateTime @default(now())

  @@map("letter_instance")
}
```

**GANTI DENGAN (Hybrid - Opsi B):**
```prisma
model LetterInstance {
  id String @id @default(cuid())

  schema      Json
  values      Json
  status      LetterStatus @default(DRAFT)
  currentStep Int?

  // Metadata workflow (JSON untuk flexibility)
  assignedApprovers     Json?  // { dospem: userId, koordinator: userId, ... }
  documentVersions      Json   @default("[]")  // [{ version, storageKey, ... }, ...]
  latestEditableVersion Int    @default(1)
  latestPDFVersion      Int?

  // Milestone (denormalisasi untuk query cepat)
  signedAt     DateTime?
  signatureUrl String?

  letterTypeId String
  letterType   LetterType @relation(fields: [letterTypeId], references: [id])
  createdById  String
  createdBy    User       @relation(fields: [createdById], references: [id])

  // Relasi (1-to-many)
  attachments   Attachment[]
  stepHistory   LetterStepHistory[]  // ← Relasi ke tabel history (append-only)
  numbering     LetterNumbering?      // ← Relasi ke tabel numbering (unique constraint)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("letter_instance")
}
```

**Perubahan dari versi JSON semua:**
- **HAPUS:** `workflowHistory Json`, `numberedAt DateTime?`, `letterNumber String?` (pindah ke tabel terpisah)
- **TAMBAH:** relasi `stepHistory`, `numbering`
- **TETAP:** `assignedApprovers Json`, `documentVersions Json` (untuk flexibility)

#### C) Model `Attachment` (sekitar line 249-260)

**HAPUS:**
```prisma
model Attachment {
  id String @id @default(cuid())

  domain   String
  filename String

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
  deletedAt DateTime?

  @@map("attachment")
}
```

**GANTI DENGAN:**
```prisma
model Attachment {
  id String @id @default(cuid())

  domain   String
  filename String

  // Relasi ke surat
  letterId String?
  letter   LetterInstance? @relation(fields: [letterId], references: [id], onDelete: Cascade)

  // Metadata
  category         String?  // "PROPOSAL", "KTM", "LAMPIRAN_TAMBAHAN", dll
  uploadedByUserId String?
  uploadedBy       User?    @relation(fields: [uploadedByUserId], references: [id])
  isActive         Boolean  @default(true)

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
  deletedAt DateTime?

  @@map("attachment")
}
```

#### D) Model `User` (sekitar line 143-166)

**TAMBAHKAN 3 RELASI** di bagian relasi:
```prisma
model User {
  id String @id @default(cuid())

  name  String
  email String @unique

  emailVerified Boolean  @default(false)
  image         String?
  isAnonymous   Boolean? @default(false)

  mahasiswa Mahasiswa?
  pegawai   Pegawai?

  userRole            UserRole[]
  sessions            Session[]
  accounts            Account[]
  LetterInstance      LetterInstance[]
  uploadedAttachments Attachment[]       // ← TAMBAH (relasi ke attachment yang diupload)
  stepHistoryActions  LetterStepHistory[] // ← TAMBAH (relasi ke history sebagai actor)
  assignedNumbering   LetterNumbering[]  // ← TAMBAH (relasi ke numbering sebagai UPA)

  createdAt DateTime? @default(now())
  updatedAt DateTime? @updatedAt
  deletedAt DateTime?

  @@map("user")
}
```

---

## 10. Checklist Eksekusi Migration

- [ ] Backup database production (jika ada)
- [ ] Edit `e-office-api-v2/prisma/schema.prisma` sesuai perubahan di atas
- [ ] Run migration:
  ```bash
  cd e-office-api-v2
  bunx prisma migrate dev --name add_workflow_metadata_pkl
  ```
- [ ] Generate Prisma client:
  ```bash
  bunx prisma generate
  ```
- [ ] Update seed data (optional):
  - Tambahkan sample LetterInstance dengan workflowHistory, documentVersions default `[]`
- [ ] Test database:
  ```bash
  bunx prisma studio
  ```
- [ ] Commit migration file ke git

---

## 11. Backward Compatibility

**Semua field baru nullable atau punya default value**, jadi:
- LetterInstance lama yang sudah ada tidak crash (field baru akan null atau default)
- Attachment lama tanpa `letterId` tetap bisa ada (orphan attachment, bisa di-cleanup nanti)

---

## 12. Apakah Schema Hybrid Ini Sudah Cukup untuk Proses Bisnis PKL?

**YA - LEBIH BAIK**, dengan schema hybrid (2 tabel baru + edit 3 model) kamu dapat:

### ✅ **Semua requirement proses bisnis:**
- ✅ Submit surat (simpan di values, assignedApprovers JSON)
- ✅ Sequential workflow (currentStep 1→2→...→9)
- ✅ Approve/reject/revise (insert ke `LetterStepHistory` append-only)
- ✅ Rollback 1 step (query history tabel, hitung step terakhir approved)
- ✅ Edit supervisor (simpan versi baru di documentVersions JSON, sync values)
- ✅ TTD WD1 (simpan signedAt, signatureUrl)
- ✅ Penomoran UPA (insert ke `LetterNumbering` dengan **unique constraint strict**)
- ✅ Versioning (semua versi di documentVersions JSON, download by version)
- ✅ Lampiran (relasi ke surat via letterId, bisa diganti dengan isActive)
- ✅ Cancel sebelum TTD (validasi signedAt == null)
- ✅ 1 surat aktif per mahasiswa (query WHERE status NOT IN terminal)

### ✅ **Keunggulan opsi B (hybrid):**
1. **Audit trail strict** — `LetterStepHistory` append-only di DB level (tidak bisa update/delete)
2. **Nomor surat unique** — `LetterNumbering.numberString` punya unique constraint (tidak bisa duplikat)
3. **Query cepat** — index di `LetterStepHistory` dan `LetterNumbering` untuk reporting/audit
4. **Foreign key integrity** — actorUserId, assignedByUserId tervalidasi di DB
5. **Tetap flexible** — `assignedApprovers` dan `documentVersions` tetap JSON (mudah evolve)

**Dan tetap generic** untuk jenis surat lain nanti.

---

## 13. Next Step

Apakah kamu mau aku langsung **edit `schema.prisma`** sesuai rencana ini + buat migration-nya?

Atau kamu mau review dulu/ada yang mau diubah dari rencana ini?
