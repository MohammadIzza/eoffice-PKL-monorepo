# ANALISIS END-TO-END & RENCANA PENGEMBANGAN
## Aplikasi Persuratan PKL - E-Office

**Tanggal Analisis:** 2025-01-XX  
**Status:** Pre-Development Analysis

---

## 📋 DAFTAR ISI

1. [Gambaran Umum Bisnis Proses](#1-gambaran-umum-bisnis-proses)
2. [Mapping Fitur: Sudah vs Belum](#2-mapping-fitur-sudah-vs-belum)
3. [Analisis Backend](#3-analisis-backend)
4. [Analisis Frontend](#4-analisis-frontend)
5. [Gap Analysis](#5-gap-analysis)
6. [Rencana Pengembangan Per Fase](#6-rencana-pengembangan-per-fase)

---

## 1. GAMBARAN UMUM BISNIS PROSES

### 1.1 Workflow PKL (10 Steps Sequential)

```
1. Mahasiswa (Submit) 
   ↓
2. Dosen Pembimbing (Approve/Reject/Revise)
   ↓
3. Dosen Koordinator (Approve/Reject/Revise)
   ↓
4. Ketua Program Studi (Approve/Reject/Revise)
   ↓
5. Admin Fakultas (Approve/Reject/Revise)
   ↓
6. Supervisor Akademik (Approve/Reject/Revise + **Edit Dokumen**)
   ↓
7. Manajer Tata Usaha (Approve/Reject/Revise)
   ↓
8. Wakil Dekan 1 (Approve/Reject/Revise + **TTD Digital**)
   ↓
9. UPA (Penomoran Surat)
   ↓
10. Selesai → Mahasiswa (Download)
```

### 1.2 Status Surat

- `DRAFT` → `PROCESSING` → `COMPLETED`
- Terminal: `REJECTED`, `CANCELLED`, `COMPLETED`
- Intermediate: `PROCESSING` (dengan currentStep)

### 1.3 Fitur Khusus

- **Preview Surat**: Semua approver dapat preview sebelum approve
- **Versioning**: Setiap edit oleh Supervisor menghasilkan versi baru
- **TTD Digital**: Upload gambar atau live signature pad (WD1)
- **Penomoran**: Format `AK15-{counter}/{DD}/{MM}/{YYYY}`
- **Revisi**: Rollback 1 step (baik oleh approver maupun self-revise)
- **Pembatalan**: Mahasiswa dapat cancel sebelum TTD WD1

---

## 2. MAPPING FITUR: SUDAH VS BELUM

### 2.1 ✅ FITUR YANG SUDAH ADA (Backend)

#### A. Authentication & Authorization
- ✅ Login/Logout (Better Auth)
- ✅ Session Management
- ✅ Role-based Access Control
- ✅ User Profile (`/me`)

#### B. Master Data
- ✅ CRUD Departemen
- ✅ CRUD Program Studi
- ✅ CRUD Dosen
- ✅ CRUD Mahasiswa
- ✅ CRUD User & Role
- ✅ CRUD Letter Type
- ✅ CRUD Letter Template

#### C. Letter Submission (Mahasiswa)
- ✅ Submit PKL Letter (`POST /letter/pkl/submit`)
  - ✅ Validasi 1 surat aktif per mahasiswa
  - ✅ Auto-assign approvers berdasarkan prodi
  - ✅ Create letter instance dengan status PROCESSING
  - ✅ Create initial document version
  - ✅ Create step history (SUBMITTED)
  - ✅ Upload attachments (proposal, KTM, tambahan)

#### D. Letter Actions (Approvers)
- ✅ Approve (`POST /letter/[id]/approve`)
  - ✅ Validasi user adalah assignee
  - ✅ TTD Digital untuk WD1 (dengan signatureData)
  - ✅ Update currentStep ke next step
  - ✅ Create step history (APPROVED)
  - ✅ Auto-complete jika step terakhir

- ✅ Reject (`POST /letter/[id]/reject`)
  - ✅ Validasi user adalah assignee
  - ✅ Wajib comment minimal 10 karakter
  - ✅ Update status ke REJECTED
  - ✅ Create step history (REJECTED)

- ✅ Revise (`POST /letter/[id]/revise`)
  - ✅ Validasi user adalah assignee
  - ✅ Wajib comment minimal 10 karakter
  - ✅ Rollback 1 step
  - ✅ Create step history (REVISED)

#### E. Letter Actions (Mahasiswa)
- ✅ Cancel (`POST /letter/[id]/cancel`)
  - ✅ Validasi hanya creator
  - ✅ Validasi belum TTD WD1
  - ✅ Update status ke CANCELLED
  - ✅ Create step history (CANCELLED)

- ✅ Self-Revise (`POST /letter/[id]/self-revise`)
  - ✅ Validasi hanya creator
  - ✅ Validasi belum TTD WD1
  - ✅ Rollback 1 step
  - ✅ Create step history (SELF_REVISED)

#### F. Letter Viewing
- ✅ My Letters (`GET /letter/my`)
  - ✅ List semua surat milik user (mahasiswa)
  - ✅ Include letterType, numbering

- ✅ Queue (`GET /letter/queue?activeRole=...`)
  - ✅ List surat pending untuk role tertentu
  - ✅ Filter berdasarkan currentStep dan assignedApprovers

- ✅ Preview (`GET /letter/[id]/preview`)
  - ✅ Validasi akses (creator atau assignee)
  - ✅ Return latest PDF atau editable version
  - ✅ Presigned URL dari MinIO

#### G. Letter Numbering (UPA)
- ✅ Get Suggestion (`GET /letter/[id]/numbering/suggestion`)
  - ✅ Generate nomor berdasarkan format AK15-{counter}/{DD}/{MM}/{YYYY}
  - ✅ Auto-increment counter per tanggal

- ✅ Submit Numbering (`POST /letter/[id]/numbering`)
  - ✅ Validasi step = UPA
  - ✅ Validasi sudah TTD
  - ✅ Validasi nomor unik
  - ✅ Update status ke COMPLETED
  - ✅ Create step history (NUMBERED)

#### H. Attachments
- ✅ Upload (`POST /letter/[id]/attachments`)
  - ✅ Validasi akses (creator atau assignee)
  - ✅ Upload ke MinIO
  - ✅ Support replace existing (by category)
  - ✅ Support multiple files

#### I. Document Versioning
- ✅ Download Version (`GET /letter/[id]/versions/[versionId]/download`)
  - ✅ Download versi dokumen tertentu

### 2.2 ✅ FITUR YANG SUDAH ADA (Frontend)

#### A. Authentication
- ✅ Login Page (`/login`)
- ✅ Protected Routes
- ✅ User Profile Page (`/dashboard/profile`)

#### B. Mahasiswa - Form Pengajuan
- ✅ Step 1: Identitas (`/dashboard/pengajuan/pkl/identitas`)
  - ✅ Form identitas mahasiswa
  - ✅ Auto-fill dari user data
  - ✅ Validation dengan Zod

- ✅ Step 2: Detail (`/dashboard/pengajuan/pkl/detail-pengajuan`)
  - ✅ Form detail pengajuan
  - ✅ Pilih dosen pembimbing
  - ✅ Auto-fill koordinator & kaprodi

- ✅ Step 3: Lampiran (`/dashboard/pengajuan/pkl/lampiran`)
  - ✅ Upload proposal (wajib)
  - ✅ Upload KTM (wajib)
  - ✅ Upload tambahan (opsional)
  - ✅ File persistence (localStorage + IndexedDB)
  - ✅ Preview & delete files

- ✅ Step 4: Review (`/dashboard/pengajuan/pkl/review`)
  - ✅ Review semua data
  - ✅ Preview attachments
  - ✅ Submit pengajuan
  - ✅ Error handling

#### C. Mahasiswa - Daftar Surat
- ✅ Surat List (`/dashboard/surat`)
  - ✅ Table semua surat milik mahasiswa
  - ✅ Filter & search
  - ✅ Status badges
  - ✅ Progress bar
  - ✅ Pagination

- ✅ Surat Detail (`/dashboard/surat/[id]`)
  - ✅ Detail surat lengkap
  - ✅ History timeline
  - ✅ Preview dokumen

#### D. Dosen - Dashboard
- ✅ Dosen Dashboard (`/dashboard/dosen`)
  - ✅ Stats cards
  - ✅ Charts (volume, status)

- ✅ Surat Masuk (`/dashboard/dosen/surat-masuk`)
  - ✅ Filter surat
  - ✅ Table surat masuk

#### E. UI Components
- ✅ Stepper Component
- ✅ Form Components (dengan info tooltips)
- ✅ Apple Design System
- ✅ Responsive Layout

### 2.3 ❌ FITUR YANG BELUM ADA

#### A. Backend - Document Generation
- ❌ Generate HTML Document dari Template
- ❌ Convert HTML ke PDF
- ❌ Document Editor API (untuk Supervisor Akademik)
- ❌ Save edited document sebagai versi baru

#### B. Backend - Notification
- ❌ Email Notification
- ❌ In-app Notification
- ❌ Reminder untuk pending approval

#### C. Frontend - Approver Actions
- ❌ Approve/Reject/Revise UI untuk semua approver
- ❌ Comment input dengan validation
- ❌ Preview dokumen sebelum approve
- ❌ History timeline detail

#### D. Frontend - Supervisor Akademik
- ❌ Document Editor (Word-like)
- ❌ Save draft & publish version
- ❌ Version comparison view

#### E. Frontend - Wakil Dekan 1
- ❌ TTD Digital UI
  - ❌ Upload signature image
  - ❌ Live signature pad
- ❌ Preview dokumen dengan signature

#### F. Frontend - UPA
- ❌ Numbering UI
  - ❌ Show suggestion
  - ❌ Input manual nomor
  - ❌ Validation & error handling

#### G. Frontend - Mahasiswa (Tambahan)
- ❌ Cancel button di detail surat
- ❌ Self-revise button di detail surat
- ❌ Download final document
- ❌ Download semua versi dokumen

#### H. Frontend - Notifications
- ❌ Notification bell dengan count
- ❌ Notification list/dropdown
- ❌ Mark as read

#### I. Frontend - Dashboard (Approvers)
- ❌ Queue page untuk setiap role
- ❌ Filter & sort queue
- ❌ Bulk actions (jika diperlukan)

---

## 3. ANALISIS BACKEND

### 3.1 ✅ Yang Sudah Baik

1. **Workflow Service** (`pkl.workflow.service.ts`)
   - ✅ Logic assignment approvers lengkap
   - ✅ Validasi 1 surat aktif per mahasiswa
   - ✅ Helper functions untuk rollback & validation

2. **Routes Structure**
   - ✅ RESTful API design
   - ✅ Consistent error handling
   - ✅ Type-safe dengan Elysia + TypeBox

3. **Database Schema**
   - ✅ Support versioning (documentVersions)
   - ✅ Support step history (letterStepHistory)
   - ✅ Support attachments
   - ✅ Support numbering

4. **Security**
   - ✅ Auth guard middleware
   - ✅ Permission validation
   - ✅ Assignee validation

### 3.2 ⚠️ Yang Perlu Diperbaiki/Ditambahkan

1. **Document Generation**
   - ❌ Belum ada service untuk generate HTML dari template
   - ❌ Belum ada service untuk convert HTML ke PDF
   - ❌ Template engine belum terintegrasi

2. **Document Editor**
   - ❌ Belum ada API untuk edit dokumen (Supervisor)
   - ❌ Belum ada endpoint untuk save edited version

3. **Notification System**
   - ❌ Belum ada service untuk send email
   - ❌ Belum ada in-app notification storage

4. **Error Handling**
   - ⚠️ Beberapa endpoint belum konsisten error message format
   - ⚠️ Validation error belum seragam

5. **Testing**
   - ❌ Belum ada unit tests
   - ❌ Belum ada integration tests

---

## 4. ANALISIS FRONTEND

### 4.1 ✅ Yang Sudah Baik

1. **Form Pengajuan (Mahasiswa)**
   - ✅ Multi-step form dengan stepper
   - ✅ File persistence (localStorage + IndexedDB)
   - ✅ Validation dengan Zod
   - ✅ Error handling yang baik
   - ✅ UI/UX Apple Design System

2. **State Management**
   - ✅ Zustand untuk form state
   - ✅ Persist middleware untuk draft
   - ✅ Clean separation of concerns

3. **Components**
   - ✅ Reusable UI components
   - ✅ Form components dengan tooltips
   - ✅ Consistent styling

4. **Routing**
   - ✅ Protected routes
   - ✅ Clean URL structure

### 4.2 ⚠️ Yang Perlu Diperbaiki/Ditambahkan

1. **Approver Actions UI**
   - ❌ Belum ada halaman untuk approve/reject/revise
   - ❌ Belum ada comment input component
   - ❌ Belum ada preview modal

2. **Document Editor**
   - ❌ Belum ada rich text editor
   - ❌ Belum ada version management UI

3. **TTD Digital**
   - ❌ Belum ada signature upload component
   - ❌ Belum ada signature pad component

4. **Numbering UI**
   - ❌ Belum ada numbering form
   - ❌ Belum ada suggestion display

5. **Notifications**
   - ❌ Bell icon belum functional
   - ❌ Belum ada notification list

6. **Queue Management**
   - ❌ Belum ada queue page untuk approvers
   - ❌ Belum ada filter & sort

---

## 5. GAP ANALYSIS

### 5.1 Critical Gaps (Harus Segera)

1. **Document Generation**
   - Tanpa ini, surat tidak bisa di-generate
   - Blocker untuk workflow lanjutan

2. **Approver Actions UI**
   - Tanpa ini, approver tidak bisa approve/reject
   - Blocker untuk workflow

3. **Preview Document**
   - Tanpa ini, approver tidak bisa lihat surat
   - Blocker untuk decision making

### 5.2 Important Gaps (Prioritas Tinggi)

1. **Document Editor (Supervisor)**
   - Fitur khusus untuk Supervisor Akademik
   - Tanpa ini, workflow bisa lanjut tapi fitur khusus tidak ada

2. **TTD Digital (WD1)**
   - Fitur khusus untuk Wakil Dekan 1
   - Tanpa ini, workflow tidak bisa complete

3. **Numbering (UPA)**
   - Fitur khusus untuk UPA
   - Tanpa ini, surat tidak bisa complete

### 5.3 Nice to Have (Prioritas Rendah)

1. **Notifications**
   - Bisa manual check dulu
   - Bisa ditambahkan belakangan

2. **Bulk Actions**
   - Tidak critical untuk MVP
   - Bisa ditambahkan setelah MVP

3. **Advanced Filtering**
   - Basic filter sudah cukup
   - Bisa enhance belakangan

---

## 6. RENCANA PENGEMBANGAN PER FASE

### 🎯 FASE 1: CORE WORKFLOW (Priority: CRITICAL)
**Tujuan:** Memastikan workflow dasar bisa berjalan end-to-end

#### Backend Tasks:
1. ✅ Document Generation Service
   - Template engine (Handlebars/React Server Components)
   - HTML generation dari template + data
   - PDF conversion (Puppeteer/Playwright)

2. ✅ Auto-generate document saat submit
   - Generate initial HTML document
   - Convert ke PDF
   - Save ke MinIO
   - Update documentVersions

3. ✅ Preview endpoint enhancement
   - Return HTML jika editable
   - Return PDF jika final

#### Frontend Tasks:
1. ✅ Approver Queue Page
   - List surat pending untuk role
   - Filter & sort
   - Link ke detail

2. ✅ Approver Action Page
   - Preview dokumen (PDF viewer)
   - Approve/Reject/Revise buttons
   - Comment input (required untuk reject/revise)
   - Submit action

3. ✅ History Timeline Component
   - Display step history
   - Show comments
   - Show timestamps

**Deliverable:** Mahasiswa bisa submit, approver bisa approve/reject/revisi, workflow bisa berjalan sampai step terakhir

**Estimasi:** 2-3 minggu

---

### 🎯 FASE 2: SPECIAL FEATURES (Priority: HIGH)
**Tujuan:** Implementasi fitur khusus (Editor, TTD, Numbering)

#### Backend Tasks:
1. ✅ Document Editor API
   - Save draft document
   - Publish version (create new version)
   - Get editable document HTML

2. ✅ TTD Digital API
   - Upload signature image
   - Save signature to MinIO
   - Embed signature ke dokumen

3. ✅ Numbering API (sudah ada, perlu testing)
   - Test suggestion generation
   - Test uniqueness validation

#### Frontend Tasks:
1. ✅ Document Editor (Supervisor Akademik)
   - Rich text editor (TinyMCE/Quill/Editor.js)
   - Save draft
   - Publish version
   - Version list

2. ✅ TTD Digital (Wakil Dekan 1)
   - Upload signature image
   - Live signature pad (canvas)
   - Preview dengan signature

3. ✅ Numbering UI (UPA)
   - Show suggestion
   - Input manual
   - Validation & submit

**Deliverable:** Semua fitur khusus sudah berfungsi, workflow bisa complete sampai selesai

**Estimasi:** 2-3 minggu

---

### 🎯 FASE 3: ENHANCEMENT (Priority: MEDIUM)
**Tujuan:** Improve UX dan tambah fitur pendukung

#### Backend Tasks:
1. ✅ Notification Service
   - Email notification
   - In-app notification storage
   - Reminder service

2. ✅ Document Version Download
   - Download semua versi
   - Version comparison

#### Frontend Tasks:
1. ✅ Notification System
   - Notification bell dengan count
   - Notification list
   - Mark as read

2. ✅ Mahasiswa Enhancements
   - Cancel button
   - Self-revise button
   - Download final document
   - Download all versions

3. ✅ Dashboard Improvements
   - Better stats
   - Better charts
   - Quick actions

**Deliverable:** UX lebih baik, fitur pendukung lengkap

**Estimasi:** 1-2 minggu

---

### 🎯 FASE 4: POLISH & OPTIMIZATION (Priority: LOW)
**Tujuan:** Polish, optimize, dan prepare for production

#### Tasks:
1. ✅ Performance Optimization
   - Lazy loading
   - Code splitting
   - Image optimization

2. ✅ Error Handling
   - Better error messages
   - Error logging
   - Error recovery

3. ✅ Testing
   - Unit tests
   - Integration tests
   - E2E tests

4. ✅ Documentation
   - API documentation
   - User guide
   - Developer guide

5. ✅ Security Audit
   - Security review
   - Penetration testing
   - Fix vulnerabilities

**Deliverable:** Production-ready application

**Estimasi:** 1-2 minggu

---

## 7. PRIORITAS IMPLEMENTASI

### Must Have (MVP):
1. Document Generation ✅
2. Approver Actions UI ✅
3. Preview Document ✅
4. Basic Queue Management ✅

### Should Have:
1. Document Editor (Supervisor) ✅
2. TTD Digital (WD1) ✅
3. Numbering UI (UPA) ✅

### Nice to Have:
1. Notifications ✅
2. Advanced Filtering ✅
3. Bulk Actions ✅

---

## 8. RISIKO & MITIGASI

### Risiko 1: Document Generation Complex
**Mitigasi:** 
- Gunakan library yang proven (Puppeteer)
- Start dengan template sederhana
- Iterate berdasarkan feedback

### Risiko 2: Document Editor Complex
**Mitigasi:**
- Gunakan existing editor library (TinyMCE)
- Start dengan basic features
- Enhance gradually

### Risiko 3: TTD Digital Security
**Mitigasi:**
- Validate signature format
- Store securely di MinIO
- Add watermark/timestamp

### Risiko 4: Performance dengan banyak surat
**Mitigasi:**
- Implement pagination
- Add caching
- Optimize queries

---

## 9. KESIMPULAN

### Status Saat Ini:
- ✅ Backend API sudah 80% complete
- ✅ Frontend Form sudah 70% complete
- ❌ Approver UI belum ada (0%)
- ❌ Document Generation belum ada (0%)
- ❌ Special Features belum ada (0%)

### Next Steps:
1. **FASE 1** harus segera dimulai (Critical)
2. Fokus pada core workflow dulu
3. Test end-to-end setelah FASE 1
4. Lanjut ke FASE 2 setelah FASE 1 stable

### Rekomendasi:
- **Jangan langsung semua fitur**
- **Satu fase satu fase, test dulu sebelum lanjut**
- **Prioritaskan core workflow (FASE 1)**
- **Document generation adalah blocker utama**

---

**Dokumen ini akan di-update secara berkala sesuai progress development.**
