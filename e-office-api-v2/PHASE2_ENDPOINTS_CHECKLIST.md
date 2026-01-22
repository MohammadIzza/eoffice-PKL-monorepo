# Phase 2 Backend API - Endpoints Checklist

## ✅ SEMUA ENDPOINT YANG SUDAH DIIMPLEMENT

### **1. Submit & Get Letters**

#### ✅ `POST /letter/pkl/submit`
- **File**: `src/routes/letter/pkl/submit.ts`
- **Fungsi**: Submit surat PKL baru
- **Validasi**:
  - ✅ Permission: `letter:create`
  - ✅ Hanya mahasiswa yang bisa submit
  - ✅ Validasi 1 surat aktif per mahasiswa
  - ✅ Assignment otomatis: dospem (dari input), koordinator & kaprodi (dari prodi)
- **Response**: `{ success, letterId, status, currentStep, assignedApprovers }`
- **History**: Record `SUBMITTED` action
- **Status**: ✅ **VERIFIED** (tested end-to-end)

#### ✅ `GET /letter/my`
- **File**: `src/routes/letter/my.ts`
- **Fungsi**: List surat yang dibuat user (exclude terminal status)
- **Validasi**: Auth required
- **Response**: `{ success, data: LetterInstance[] }`
- **Status**: ✅ **VERIFIED**

#### ✅ `GET /letter/:id`
- **File**: `src/routes/letter/[id]/index.ts`
- **Fungsi**: Get detail surat + history + attachments + numbering
- **Validasi**: 
  - ✅ Creator, assignee, atau user yang pernah approve bisa akses
- **Response**: `{ success, data: { ...letter, stepHistory, attachments, numbering } }`
- **Status**: ✅ **VERIFIED**

---

### **2. Queue & Approval**

#### ✅ `GET /letter/queue`
- **File**: `src/routes/letter/queue.ts`
- **Fungsi**: Get queue surat pending untuk role tertentu
- **Query Params**: `activeRole` (required)
- **Validasi**:
  - ✅ Filter by `currentStep` dan `assignedApprovers`
  - ✅ Hanya return surat yang assignee-nya adalah user
- **Response**: `{ success, data: LetterInstance[], meta: { total, step, role } }`
- **Status**: ✅ **VERIFIED**

#### ✅ `POST /letter/:id/approve`
- **File**: `src/routes/letter/[id]/approve.ts`
- **Fungsi**: Approve surat, pindah ke step berikutnya
- **Validasi**:
  - ✅ User harus assignee untuk step ini
  - ✅ Status harus `PROCESSING`
  - ✅ Special case: WD1 butuh `signatureData` (TTD otomatis)
- **Body**: `{ comment?: string, signatureData?: { method, data } }`
- **Response**: `{ success, currentStep, nextStepRole }`
- **History**: Record `APPROVED` action (+ `SIGNED` untuk WD1)
- **Status**: ✅ **VERIFIED** (9x approve tested)

#### ✅ `POST /letter/:id/reject`
- **File**: `src/routes/letter/[id]/reject.ts`
- **Fungsi**: Reject surat (terminal status)
- **Validasi**:
  - ✅ User harus assignee
  - ✅ Status harus `PROCESSING`
  - ✅ Comment wajib (min 10 karakter)
- **Body**: `{ comment: string }`
- **Response**: `{ success, status: "REJECTED" }`
- **History**: Record `REJECTED` action
- **Status**: ✅ **VERIFIED** (tested dengan comment)

#### ✅ `POST /letter/:id/revise`
- **File**: `src/routes/letter/[id]/revise.ts`
- **Fungsi**: Revise surat (rollback 1 step)
- **Validasi**:
  - ✅ User harus assignee
  - ✅ Status harus `PROCESSING`
  - ✅ Comment wajib (min 10 karakter)
- **Body**: `{ comment: string }`
- **Response**: `{ success, currentStep (rollback), message }`
- **History**: Record `REVISED` action
- **Status**: ✅ **VERIFIED** (rollback tested)

---

### **3. Self-Revision & Resubmit**

#### ✅ `POST /letter/:id/self-revise`
- **File**: `src/routes/letter/[id]/self-revise.ts`
- **Fungsi**: Mahasiswa self-revise (rollback 1 step)
- **Validasi**:
  - ✅ Hanya creator yang bisa
  - ✅ Status harus `PROCESSING`
  - ✅ Belum ditandatangani (`signedAt` null)
- **Response**: `{ success, currentStep (rollback), message }`
- **History**: Record `SELF_REVISED` action
- **Status**: ✅ **VERIFIED**

#### ✅ `POST /letter/:id/resubmit`
- **File**: `src/routes/letter/[id]/resubmit.ts`
- **Fungsi**: Update `values` setelah revise
- **Validasi**:
  - ✅ Hanya creator yang bisa
  - ✅ Status harus `PROCESSING`
  - ✅ Harus pernah di-revise (ada history `REVISED` atau `SELF_REVISED`)
- **Body**: `{ formData: any }`
- **Response**: `{ success, currentStep, message }`
- **History**: Record `RESUBMITTED` action
- **Status**: ✅ **IMPLEMENTED** (ready to test)

---

### **4. Cancel**

#### ✅ `POST /letter/:id/cancel`
- **File**: `src/routes/letter/[id]/cancel.ts`
- **Fungsi**: Cancel surat (hanya sebelum WD1 TTD)
- **Validasi**:
  - ✅ Hanya creator yang bisa
  - ✅ Status harus `PROCESSING`
  - ✅ Belum ditandatangani (`signedAt` null)
- **Response**: `{ success, status: "CANCELLED" }`
- **History**: Record `CANCELLED` action
- **Status**: ✅ **IMPLEMENTED**

---

### **5. Numbering**

#### ✅ `GET /letter/:id/numbering/suggestion`
- **File**: `src/routes/letter/[id]/numbering.ts` (GET handler)
- **Fungsi**: Get suggestion nomor surat
- **Validasi**:
  - ✅ Hanya UPA yang bisa
  - ✅ Surat harus sudah ditandatangani (`signedAt` not null)
- **Response**: `{ success, suggestion: "AK15-01/DD/MM/YYYY", counter }`
- **Logic**: 
  - ✅ Hitung counter berdasarkan `letterTypeCode` + `date`
  - ✅ Format: `AK15-{counter2digit}/{DD}/{MM}/{YYYY}` (uppercase)
- **Status**: ✅ **VERIFIED**

#### ✅ `POST /letter/:id/numbering`
- **File**: `src/routes/letter/[id]/numbering.ts` (POST handler)
- **Fungsi**: Assign nomor surat (manual atau dari suggestion)
- **Validasi**:
  - ✅ Hanya UPA yang bisa
  - ✅ Surat harus sudah ditandatangani
  - ✅ Nomor harus unique (per `letterTypeCode` + `date` + `counter`)
  - ✅ Format harus valid: `AK15-{counter}/{DD}/{MM}/{YYYY}`
- **Body**: `{ numberString: string }`
- **Response**: `{ success, status: "COMPLETED", numberString }`
- **History**: Record `NUMBERED` action
- **Database**: 
  - ✅ Insert ke `LetterNumbering` (unique constraint)
  - ✅ Update `letterNumber` (denormalized) di `LetterInstance`
- **Status**: ✅ **VERIFIED** (unique constraint tested)

---

### **6. Attachments**

#### ✅ `POST /letter/:id/attachments`
- **File**: `src/routes/letter/[id]/attachments.ts`
- **Fungsi**: Upload/add/replace attachments
- **Validasi**:
  - ✅ Creator atau assignee yang bisa upload
  - ✅ Status harus `PROCESSING`
- **Body**: 
  ```typescript
  {
    files: File[],
    category?: string,  // "PROPOSAL", "KTM", "LAMPIRAN_TAMBAHAN", dll
    replaceExisting?: boolean  // Soft delete attachments dengan category yang sama
  }
  ```
- **Response**: `{ success, attachments: [...], totalUploaded }`
- **Storage**: 
  - ✅ Upload ke MinIO (`attachments/{letterId}/`)
  - ✅ Simpan metadata ke `Attachment` model
  - ✅ Support soft delete (isActive = false)
- **Status**: ✅ **IMPLEMENTED** (ready to test)

---

### **7. Preview & Download**

#### ✅ `GET /letter/:id/preview`
- **File**: `src/routes/letter/[id]/preview.ts`
- **Fungsi**: Preview latest document version
- **Validasi**:
  - ✅ Creator, assignee, atau user yang pernah approve bisa akses
- **Response**: 
  ```typescript
  {
    success,
    preview: {
      version,
      format,
      isPDF,
      isEditable,
      createdBy,
      reason,
      timestamp,
      previewUrl,  // Presigned URL (expiry 1 hour)
      expiresIn
    }
  }
  ```
- **Logic**:
  - ✅ Prioritas: PDF terbaru > Editable terbaru
  - ✅ Generate presigned URL dari MinIO
- **Status**: ✅ **IMPLEMENTED** (ready to test)

#### ✅ `GET /letter/:id/versions/:versionId/download`
- **File**: `src/routes/letter/[id]/versions/[versionId]/download.ts`
- **Fungsi**: Download specific document version
- **Validasi**:
  - ✅ Creator, assignee, atau user yang pernah approve bisa akses
  - ✅ Version harus ada di `documentVersions`
- **Response**:
  ```typescript
  {
    success,
    version,
    format,
    isPDF,
    isEditable,
    createdBy,
    reason,
    timestamp,
    downloadUrl,  // Presigned URL (expiry 1 hour)
    expiresIn
  }
  ```
- **Status**: ✅ **IMPLEMENTED** (ready to test)

---

## **VERIFIKASI FITUR**

### ✅ **Workflow Logic**
- ✅ Submit dengan assignment otomatis
- ✅ Approve sequential (step 1 → 2 → ... → 8)
- ✅ Revise rollback 1 step
- ✅ Re-approve setelah rollback
- ✅ Self-revise mahasiswa
- ✅ TTD WD1 otomatis saat approve
- ✅ Penomoran unique strict
- ✅ Status terminal (COMPLETED, REJECTED, CANCELLED)

### ✅ **History & Audit**
- ✅ History append-only (tidak bisa dihapus/edit)
- ✅ Semua action tercatat: SUBMITTED, APPROVED, REJECTED, REVISED, SELF_REVISED, RESUBMITTED, SIGNED, NUMBERED, CANCELLED
- ✅ Comment tersimpan di history
- ✅ Metadata tersimpan (signatureUrl untuk SIGNED, dll)

### ✅ **Validasi & Security**
- ✅ RBAC dengan Casbin (requirePermission, requireRole)
- ✅ Validasi assignee untuk approve/reject/revise
- ✅ Validasi creator untuk cancel/self-revise/resubmit
- ✅ Validasi status (PROCESSING untuk semua action)
- ✅ Validasi comment (min 10 karakter untuk reject/revise)
- ✅ Validasi 1 surat aktif per mahasiswa
- ✅ Validasi nomor surat unique

### ✅ **Database Schema**
- ✅ `LetterInstance` dengan JSON fields (assignedApprovers, documentVersions)
- ✅ `LetterStepHistory` untuk audit trail
- ✅ `LetterNumbering` untuk unique constraint
- ✅ `Attachment` dengan relasi ke LetterInstance
- ✅ Soft delete support (isActive, deletedAt)

---

## **STATUS SUMMARY**

| Category | Endpoint | Status |
|----------|----------|--------|
| **Submit** | `POST /letter/pkl/submit` | ✅ VERIFIED |
| **Get** | `GET /letter/my` | ✅ VERIFIED |
| **Get** | `GET /letter/:id` | ✅ VERIFIED |
| **Queue** | `GET /letter/queue` | ✅ VERIFIED |
| **Approve** | `POST /letter/:id/approve` | ✅ VERIFIED |
| **Reject** | `POST /letter/:id/reject` | ✅ VERIFIED |
| **Revise** | `POST /letter/:id/revise` | ✅ VERIFIED |
| **Self-Revise** | `POST /letter/:id/self-revise` | ✅ VERIFIED |
| **Resubmit** | `POST /letter/:id/resubmit` | ✅ IMPLEMENTED |
| **Cancel** | `POST /letter/:id/cancel` | ✅ IMPLEMENTED |
| **Numbering** | `GET /letter/:id/numbering/suggestion` | ✅ VERIFIED |
| **Numbering** | `POST /letter/:id/numbering` | ✅ VERIFIED |
| **Attachments** | `POST /letter/:id/attachments` | ✅ IMPLEMENTED |
| **Preview** | `GET /letter/:id/preview` | ✅ IMPLEMENTED |
| **Download** | `GET /letter/:id/versions/:versionId/download` | ✅ IMPLEMENTED |

**Total**: 15 endpoints
- ✅ **Verified** (tested end-to-end): 9 endpoints
- ✅ **Implemented** (ready to test): 6 endpoints

---

## **KESIMPULAN**

✅ **Phase 2 Backend API Core - 100% COMPLETE**

Semua endpoint yang diperlukan untuk workflow PKL sudah terimplement dengan:
- ✅ Validasi lengkap
- ✅ RBAC security
- ✅ History & audit trail
- ✅ Error handling
- ✅ Database schema support

**Ready untuk Phase 3 (Frontend Integration)** 🚀
