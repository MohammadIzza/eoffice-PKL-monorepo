# RENCANA PENGEMBANGAN E-OFFICE PKL
## Analisis End-to-End & Roadmap Pengembangan

---

## 🔄 UPDATE STATUS (2026-01-24)

### ✅ Sudah Berfungsi End-to-End
- Auth login/logout + middleware + RBAC
- PKL submission (step 1-4) + validasi + draft persistence
- Upload lampiran ke Minio + download lampiran
- Approval queue + approval detail (data lengkap, lampiran, history)
- Approve/Reject/Revise + self-revise + cancel + resubmit
- Supervisor editor (draft/publish) + preview HTML
- WD1 signature upload (terintegrasi ke approve)
- UPA numbering + suggestion + selesai setelah penomoran

### ⚠️ Masih Parsial / Perlu Disempurnakan
- Preview dokumen: masih draft sebelum penomoran (final setelah nomor)
- Version history UI (backend ada, UI belum)
- Dashboard analytics (basic sudah, advanced belum)
- Advanced search/filter (basic ada, advanced belum)
- PDF pipeline: backend sudah generate PDF saat penomoran, UI download tersedia (perlu verifikasi runtime)

### ❌ Belum Ada
- Distribusi dokumen (email/riwayat distribusi)
- Notification system (in-app/email)
- Template management UI
- Role & permission management UI
- Admin master data UI (departemen, prodi, user, dosen)
- Audit log & activity tracking UI

---

## 🧭 ROADMAP V2 (12 FASE)

### FASE 1 — Stabilization & E2E Smoke
- Finalisasi checklist E2E (auth, submit, approval, numbering, lampiran)
- Perbaiki edge case yang ketemu saat smoke test
- **Testing:** jalankan smoke test manual + helper scripts

**Status:** IN PROGRESS  
**Checklist E2E (Fase 1):**
- [ ] Auth: login/logout, redirect, session clear, middleware guard
- [ ] Submit PKL: Step 1–4 sampai submit sukses
- [ ] Lampiran: upload proposal+KTM + download via approver
- [ ] Approval flow: approve/reject/revise + self‑revise + resubmit
- [ ] Supervisor editor: buka editor → save draft → publish
- [ ] WD1: upload signature → approve
- [ ] UPA: suggestion nomor → assign → status COMPLETED
- [ ] UI detail approval: data pengajuan + lampiran + history tampil
- [ ] Error handling: 401/403, lampiran wajib sebelum approve

### FASE 2 — Final Document Pipeline (PDF)
- Service HTML → PDF + storage di Minio
- Preview & download PDF
- **Testing:** publish → generate PDF → preview/download

### FASE 3 — Signature Hardening
- Validasi ukuran/format + error handling
- Audit trail untuk signature metadata
- **Testing:** WD1 approve dengan signature, cek history
**Status:** DONE

### FASE 4 — Document Distribution
- Endpoint distribusi + history
- UI distribusi + email sending
- **Testing:** distribusi berhasil + history tercatat

### FASE 5 — Template Management UI
- List template + editor + preview + versioning
- **Testing:** buat template → publish → dipakai submit baru

### FASE 6 — Role & Permission UI
- Assign role/user + permission matrix
- **Testing:** ubah role → akses UI berubah

### FASE 7 — Master Data UI
- CRUD departemen/prodi/dosen/user
- **Testing:** data master baru muncul di form submission

### FASE 8 — Version History UI
- List version + download + restore
- **Testing:** publish versi baru → restore versi lama

### FASE 9 — Notification System
- In-app notifications + email
- **Testing:** approval event → notifikasi terkirim

### FASE 10 — Advanced Search & Export
- Filter lanjutan + export (Excel/PDF) + bulk action
- **Testing:** filter + export sesuai data

### FASE 11 — Audit Log & Activity
- Audit log backend + UI viewer
- **Testing:** semua aksi tercatat

### FASE 12 — Multi-letter Type & Workflow Builder
- Workflow per jenis surat + builder UI
- **Testing:** surat non-PKL dengan alur berbeda

---

## 📊 STATUS SAAT INI

### ✅ Fitur yang Sudah Ada (Backend + Frontend)

#### 1. **Authentication & Authorization**
- ✅ Login/Logout
- ✅ Middleware authentication
- ✅ RBAC (Role-Based Access Control)
- ✅ Session management
- ✅ Protected routes

#### 2. **PKL Form Submission**
- ✅ Step 1: Identitas Pengaju
- ✅ Step 2: Detail Surat
- ✅ Step 3: Lampiran (dengan drag & drop)
- ✅ Step 4: Review & Submit
- ✅ Form validation (Zod)
- ✅ Draft persistence (localStorage + IndexedDB)
- ✅ File upload & preview

#### 3. **Workflow Approval**
- ✅ 8-step workflow (Dosen Pembimbing → UPA)
- ✅ Approval queue per role
- ✅ Approve action
- ✅ Reject action (dengan komentar wajib)
- ✅ Revise action (rollback 1 step)
- ✅ Self-revise (mahasiswa)
- ✅ Cancel (sebelum TTD)
- ✅ Resubmit (setelah revisi)

#### 4. **Document Management**
- ✅ Document Editor (Supervisor Akademik)
- ✅ Rich Text Editor (Quill)
- ✅ Draft saving
- ✅ Version publishing
- ✅ Document preview (HTML)
- ✅ Version history (backend)
- ✅ Document download (per version)

#### 5. **Letter Management**
- ✅ Letter list (role-based)
- ✅ Letter detail view
- ✅ Status tracking
- ✅ Step history display
- ✅ Attachment viewing
- ✅ Search & filter (basic)

#### 6. **Numbering System**
- ✅ UPA numbering endpoint
- ✅ Format: AK15-{counter2digit}/{DD}/{MM}/{YYYY}
- ✅ Uniqueness validation
- ✅ Auto-complete setelah TTD

#### 7. **Master Data**
- ✅ Departemen CRUD
- ✅ Program Studi CRUD
- ✅ Dosen CRUD
- ✅ User CRUD
- ✅ Letter Type CRUD
- ✅ Letter Template CRUD (backend)

#### 8. **User Interface**
- ✅ Dashboard (stats & charts)
- ✅ Profile page
- ✅ Apple HIG design system
- ✅ Responsive layout
- ✅ Loading & error states

---

## 🚧 Fitur yang Perlu Disempurnakan

### 1. **Signature Upload (WD1)**
**Status:** Completed
- ✅ Upload signature image
- ✅ Signature preview
- ✅ Signature validation (format & size)
- ✅ Signature storage (Minio)
- ✅ Signature metadata in history

### 2. **PDF Generation**
**Status:** Parsial (backend implemented, perlu verifikasi runtime)
- ✅ HTML to PDF conversion (generate saat penomoran)
- ⚠️ PDF download (UI tersedia di preview modal)
- ⚠️ PDF preview (via preview endpoint ketika PDF ada)

### 3. **Document Distribution**
**Status:** Belum ada
- ❌ Distribution endpoint
- ❌ Distribution UI
- ❌ Email sending
- ❌ Distribution history

### 4. **Template Management**
**Status:** Backend ready, Frontend belum ada
- ❌ Template list UI
- ❌ Template editor
- ❌ Template preview
- ❌ Template versioning

### 5. **Role Assignment UI**
**Status:** Backend ready, Frontend belum ada
- ❌ User role assignment
- ❌ Role management
- ❌ Permission management

### 6. **Notification System**
**Status:** Belum ada
- ❌ In-app notifications
- ❌ Email notifications
- ❌ Notification preferences
- ❌ Notification history

### 7. **Advanced Search & Filter**
**Status:** Basic sudah ada
- ⚠️ Advanced filters (date range, multiple status)
- ⚠️ Export to Excel/PDF
- ⚠️ Bulk actions

### 8. **Version History UI**
**Status:** Backend ready, Frontend belum ada
- ❌ Version list
- ❌ Version comparison
- ❌ Version restore

### 9. **Resubmit UI**
**Status:** Backend ready, Frontend belum ada
- ❌ Resubmit button
- ❌ Resubmit confirmation
- ❌ Resubmit flow

### 10. **Dashboard Analytics**
**Status:** Basic sudah ada
- ⚠️ Advanced charts
- ⚠️ Export reports
- ⚠️ Custom date range

---

## 📋 RENCANA PENGEMBANGAN PER FASE

### **FASE 1: PENYEMPURNAAN FITUR CORE** (Priority: HIGH)
**Durasi:** 2-3 minggu

#### 1.1 Signature Upload (WD1)
- [ ] Backend: Implement signature upload ke Minio
- [ ] Backend: Signature validation & processing
- [ ] Frontend: Signature upload component
- [ ] Frontend: Signature preview & crop
- [ ] Frontend: Integrate dengan approval flow

#### 1.2 PDF Generation
- [ ] Backend: Install PDF library (Puppeteer/PDFKit)
- [ ] Backend: HTML to PDF conversion service
- [ ] Backend: Auto-generate PDF setelah publish
- [ ] Frontend: PDF preview
- [ ] Frontend: PDF download button

#### 1.3 Document Distribution
- [ ] Backend: Distribution endpoint
- [ ] Backend: Email service integration
- [ ] Backend: Distribution history tracking
- [ ] Frontend: Distribution form
- [ ] Frontend: Distribution history

#### 1.4 Resubmit UI
- [ ] Frontend: Resubmit button di status page
- [ ] Frontend: Resubmit confirmation dialog
- [ ] Frontend: Resubmit flow integration

---

### **FASE 2: FITUR ADMINISTRASI** (Priority: MEDIUM)
**Durasi:** 2-3 minggu

#### 2.1 Template Management UI
- [ ] Frontend: Template list page
- [ ] Frontend: Template editor (WYSIWYG)
- [ ] Frontend: Template preview
- [ ] Frontend: Template versioning UI
- [ ] Frontend: Template assignment ke letter type

#### 2.2 Role & Permission Management
- [ ] Frontend: User role assignment UI
- [ ] Frontend: Role management page
- [ ] Frontend: Permission management
- [ ] Frontend: Bulk role assignment

#### 2.3 Master Data Management UI
- [ ] Frontend: Departemen management page
- [ ] Frontend: Program Studi management page
- [ ] Frontend: Dosen management page
- [ ] Frontend: User management page
- [ ] Frontend: Letter Type management

---

### **FASE 3: FITUR ADVANCED** (Priority: MEDIUM)
**Durasi:** 2-3 minggu

#### 3.1 Notification System
- [ ] Backend: Notification service
- [ ] Backend: Email service (SMTP)
- [ ] Backend: Notification queue
- [ ] Frontend: Notification center
- [ ] Frontend: Notification preferences
- [ ] Frontend: Real-time notifications (WebSocket/SSE)

#### 3.2 Version History UI
- [ ] Frontend: Version list component
- [ ] Frontend: Version comparison view
- [ ] Frontend: Version restore functionality
- [ ] Frontend: Version diff viewer

#### 3.3 Advanced Search & Filter
- [ ] Frontend: Advanced filter panel
- [ ] Frontend: Date range picker
- [ ] Frontend: Multi-select filters
- [ ] Frontend: Saved filters
- [ ] Frontend: Export functionality (Excel/PDF)

---

### **FASE 4: FITUR ENHANCEMENT** (Priority: LOW)
**Durasi:** 2-3 minggu

#### 4.1 Dashboard Analytics Enhancement
- [ ] Frontend: Advanced charts (line, area, etc)
- [ ] Frontend: Custom date range
- [ ] Frontend: Export reports
- [ ] Frontend: Dashboard customization

#### 4.2 Audit Log & Activity Tracking
- [ ] Backend: Comprehensive audit log
- [ ] Frontend: Audit log viewer
- [ ] Frontend: Activity timeline
- [ ] Frontend: Export audit logs

#### 4.3 Bulk Operations
- [ ] Frontend: Bulk approve/reject
- [ ] Frontend: Bulk export
- [ ] Frontend: Bulk status update

#### 4.4 Mobile Optimization
- [ ] Frontend: Mobile-responsive improvements
- [ ] Frontend: Touch gestures
- [ ] Frontend: Mobile-specific UI components

---

### **FASE 5: FITUR FUTURE** (Priority: LOW)
**Durasi:** TBD

#### 5.1 Multi-letter Type Support
- [ ] Backend: Dynamic workflow per letter type
- [ ] Frontend: Letter type selector
- [ ] Frontend: Dynamic form builder

#### 5.2 Workflow Customization
- [ ] Backend: Workflow builder
- [ ] Frontend: Visual workflow editor
- [ ] Frontend: Workflow templates

#### 5.3 Integration & API
- [ ] Backend: RESTful API documentation
- [ ] Backend: Webhook support
- [ ] Backend: Third-party integrations

#### 5.4 Advanced Reporting
- [ ] Backend: Report generation service
- [ ] Frontend: Report builder
- [ ] Frontend: Scheduled reports
- [ ] Frontend: Report templates

---

## 🎯 PRIORITAS PENGEMBANGAN

### **URGENT (Fase 1)**
1. Signature Upload (WD1) - **BLOCKER** untuk workflow
2. PDF Generation - **REQUIRED** untuk distribusi
3. Document Distribution - **REQUIRED** untuk complete workflow
4. Resubmit UI - **IMPROVEMENT** untuk UX

### **IMPORTANT (Fase 2)**
1. Template Management - **IMPROVEMENT** untuk maintainability
2. Role Management - **IMPROVEMENT** untuk admin
3. Master Data UI - **IMPROVEMENT** untuk admin

### **NICE TO HAVE (Fase 3-5)**
1. Notification System
2. Version History UI
3. Advanced Search
4. Analytics Enhancement
5. Future features

---

## 📝 CATATAN TEKNIS

### **Backend Endpoints yang Sudah Ada:**
- ✅ `POST /letter/pkl/submit` - Submit PKL
- ✅ `GET /letter/queue` - Approval queue
- ✅ `GET /letter/my` - My letters
- ✅ `GET /letter/:id` - Letter detail
- ✅ `POST /letter/:id/approve` - Approve
- ✅ `POST /letter/:id/reject` - Reject
- ✅ `POST /letter/:id/revise` - Revise
- ✅ `POST /letter/:id/self-revise` - Self-revise
- ✅ `POST /letter/:id/cancel` - Cancel
- ✅ `POST /letter/:id/resubmit` - Resubmit
- ✅ `GET /letter/:id/preview` - Preview
- ✅ `GET /letter/:id/editor` - Get editable doc
- ✅ `POST /letter/:id/editor/draft` - Save draft
- ✅ `POST /letter/:id/editor/publish` - Publish version
- ✅ `POST /letter/:id/numbering` - Numbering
- ✅ `POST /letter/:id/attachments` - Upload attachments
- ✅ `GET /letter/:id/versions/:versionId/download` - Download version

### **Backend Endpoints yang Perlu Dibuat:**
- ❌ `POST /letter/:id/signature` - Upload signature
- ❌ `POST /letter/:id/generate-pdf` - Generate PDF
- ❌ `POST /letter/:id/distribute` - Distribute
- ❌ `GET /notifications` - Get notifications
- ❌ `POST /notifications/:id/read` - Mark as read
- ❌ `GET /audit-logs` - Get audit logs

### **Frontend Pages yang Sudah Ada:**
- ✅ `/dashboard` - Dashboard
- ✅ `/dashboard/surat` - Letter list
- ✅ `/dashboard/surat/:id` - Letter detail
- ✅ `/dashboard/pengajuan/pkl/identitas` - Step 1
- ✅ `/dashboard/pengajuan/pkl/lampiran` - Step 3
- ✅ `/dashboard/pengajuan/pkl/review` - Step 4
- ✅ `/dashboard/pengajuan/pkl/status` - Status
- ✅ `/dashboard/approval/queue` - Approval queue
- ✅ `/dashboard/approval/:id` - Approval detail
- ✅ `/dashboard/approval/:id/edit` - Document editor
- ✅ `/dashboard/profile` - Profile

### **Frontend Pages yang Perlu Dibuat:**
- ❌ `/dashboard/admin/templates` - Template management
- ❌ `/dashboard/admin/roles` - Role management
- ❌ `/dashboard/admin/users` - User management
- ❌ `/dashboard/admin/master-data` - Master data
- ❌ `/dashboard/notifications` - Notifications
- ❌ `/dashboard/audit-logs` - Audit logs

---

## 🔄 WORKFLOW YANG SUDAH ADA

### **PKL Workflow Steps:**
1. **Dosen Pembimbing** - Approve/Reject/Revise
2. **Dosen Koordinator** - Approve/Reject/Revise
3. **Ketua Program Studi** - Approve/Reject/Revise
4. **Admin Fakultas** - Approve/Reject/Revise
5. **Supervisor Akademik** - Edit document + Approve/Reject/Revise
6. **Manajer TU** - Approve/Reject/Revise
7. **Wakil Dekan 1** - Approve dengan TTD + Approve/Reject/Revise
8. **UPA** - Numbering + Approve (auto COMPLETED)

### **Status Flow:**
- `DRAFT` → `PROCESSING` (setelah submit)
- `PROCESSING` → `COMPLETED` (setelah UPA approve)
- `PROCESSING` → `REJECTED` (setelah reject)
- `PROCESSING` → `REVISION` (setelah revise)
- `REVISION` → `PROCESSING` (setelah resubmit)
- `PROCESSING` → `CANCELLED` (setelah cancel, sebelum TTD)

---

## 🛠️ TEKNOLOGI YANG DIGUNAKAN

### **Backend:**
- Elysia.js (Framework)
- Prisma (ORM)
- Better Auth (Authentication)
- Casbin (RBAC)
- Minio (Object Storage)
- PostgreSQL (Database)

### **Frontend:**
- Next.js 16 (Framework)
- React 18
- TypeScript
- Zustand (State Management)
- Tailwind CSS (Styling)
- Shadcn UI (Components)
- Recharts (Charts)
- Quill (Rich Text Editor)
- IndexedDB (File Storage)

---

## 📈 METRIK KESUKSESAN

### **Fase 1:**
- ✅ Signature upload berfungsi
- ✅ PDF generation berfungsi
- ✅ Distribution berfungsi
- ✅ Resubmit UI berfungsi

### **Fase 2:**
- ✅ Template management berfungsi
- ✅ Role management berfungsi
- ✅ Master data UI berfungsi

### **Fase 3:**
- ✅ Notification system berfungsi
- ✅ Version history UI berfungsi
- ✅ Advanced search berfungsi

---

## 🚀 NEXT STEPS

1. **Review & Approval** - Review rencana ini dengan stakeholder
2. **Prioritization** - Tentukan prioritas berdasarkan business needs
3. **Resource Allocation** - Alokasikan resources untuk setiap fase
4. **Timeline** - Buat timeline detail untuk setiap fase
5. **Start Fase 1** - Mulai implementasi Fase 1

---

**Last Updated:** $(date)
**Version:** 1.0
