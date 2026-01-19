# 📋 E-OFFICE PERSURATAN - BUSINESS PROCESS DOCUMENTATION

**Fakultas Sains dan Matematika - Universitas Diponegoro**

Dokumentasi lengkap bisnis proses aplikasi e-office persuratan dari login hingga logout untuk semua role, semua flow, dan semua fitur.

---

## 🎭 USER ROLES (19 Roles)

### **1. Superadmin**
- Full access ke seluruh sistem
- Manage users, roles, permissions
- Master data management
- System configuration

### **2. Mahasiswa**
- Submit surat permohonan
- Edit surat yang diminta revisi
- Track status surat
- Download surat yang sudah selesai

### **3. Supervisor Akademik (Dosen Pembimbing)**
- Review surat PKL mahasiswa bimbingannya
- Approve/Reject/Revisi
- Beri catatan/pesan

### **4. Koordinator (Dosen Koordinator)**
- Review surat yang sudah diapprove supervisor
- Approve/Reject/Revisi
- Beri catatan/pesan

### **5. Ketua Program Studi (Kaprodi)**
- Review surat dari koordinator
- Approve/Reject/Revisi
- Beri catatan/pesan

### **6. Manajer TU (Tata Usaha)**
- Review kelengkapan administratif
- Approve/Reject/Revisi
- Beri catatan/pesan

### **7. Wakil Dekan 1 (Wadek 1)**
- Review final approval
- Approve dengan tanda tangan digital
- Reject/Revisi dengan catatan

### **8. UPA (Unit Pengelola Administrasi)**
- Final approval + penomoran surat
- Assign nomor surat resmi
- Archive surat

### **9-19. Other Roles:**
- Dekan, Wakil Dekan 2, Wakil Dekan 3
- Staff TU, Admin Surat
- Validator, Verifikator
- Supervisor Lapangan, Pembimbing Lapangan
- Pengelola Arsip
- Operator Sistem

---

## 🔐 1. AUTHENTICATION FLOW

### **1.1. Login Process**

#### **Endpoint:** `POST /public/sign-in`

**Flow:**
```mermaid
Login Page
    ↓
Input: email + password
    ↓
POST /public/sign-in
    ↓
Better-Auth Validation
    ├─ Valid → Create Session
    │   ├─ Generate session token
    │   ├─ Store in session table
    │   ├─ Set cookie/localStorage
    │   └─ Redirect to /dashboard
    │
    └─ Invalid → Error
        └─ Show "Email atau password salah"
```

**Request:**
```json
{
  "username": "superadmin@fsm.internal",
  "password": "password1234"
}
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "name": "Super Admin",
    "email": "superadmin@fsm.internal",
    "role": "superadmin"
  },
  "session": {
    "id": "session_456",
    "token": "eyJhbGc...",
    "expiresAt": "2026-01-14T10:00:00Z"
  }
}
```

**Database Tables Involved:**
- `user` - Check credentials
- `account` - Password hash verification
- `session` - Create new session
- `user_role` - Get user roles
- `role` - Get role details

---

### **1.2. Session Management**

**Session Storage:**
- Backend: PostgreSQL `session` table
- Frontend: Cookie atau localStorage
- Expiry: 7 days default

**Session Validation:**
```typescript
Middleware: authGuardPlugin
  ↓
Check session token
  ├─ Valid → Inject user context
  └─ Invalid → Return 401 Unauthorized
```

---

### **1.3. SSO Login (Optional)**

**Endpoint:** `GET /public/auth/sso/callback`

**Flow:**
```
User clicks "Login SSO"
    ↓
Redirect to SSO Provider (Google/Microsoft)
    ↓
User authenticate
    ↓
Callback to /public/auth/sso/callback
    ↓
Better-Auth create account (isAnonymous=true)
    ↓
Create session
    ↓
Redirect to /dashboard
```

---

## 🛡️ 2. AUTHORIZATION FLOW (RBAC with Casbin)

### **2.1. Permission Check**

**Middleware:** `requirePermission(resource, action)`

**Flow:**
```typescript
User request endpoint
    ↓
authGuardPlugin → Get user + roles
    ↓
requirePermission("letter", "read")
    ↓
Casbin Enforcer Check:
    - p, role, resource, action
    - g, user, role
    ↓
    ├─ Allowed → Continue
    └─ Denied → Return 403 Forbidden
```

**Example Permissions:**
```
// Mahasiswa
p, mahasiswa, letter, submit
p, mahasiswa, letter, read_own
p, mahasiswa, letter, update_own

// Supervisor Akademik
p, supervisor_akademik, letter, read
p, supervisor_akademik, letter, approve
p, supervisor_akademik, letter, reject
p, supervisor_akademik, letter, revise

// Superadmin
p, superadmin, *, *
```

---

### **2.2. Data Filtering (Row-Level Security)**

**Example: Get My Letters**
```typescript
GET /letter/my
    ↓
authMiddleware → userId
    ↓
Query: WHERE createdById = userId
    ↓
Return only user's letters
```

**Example: Get Approval Queue**
```typescript
GET /letter/queue
    ↓
authMiddleware → user.role
    ↓
Get stepInfo by role (e.g., supervisor_akademik = step 1)
    ↓
Query: WHERE currentStep = 1 AND status IN (SUBMITTED, IN_PROGRESS)
    ↓
Return letters for this role
```

---

## 📄 3. MAIN WORKFLOW: SURAT PKL (7-STEP APPROVAL)

### **3.1. Submit Surat (Mahasiswa)**

#### **Endpoint:** `POST /letter/submit`

**Flow:**
```
1. Mahasiswa login
    ↓
2. Navigate to /pengajuan
    ↓
3. Fill 5-step form:
   - Step 1: Identitas (NIM, nama, email, IPK)
   - Step 2: Detail PKL (tempat, alamat, durasi)
   - Step 3: Upload Lampiran (proposal, KTM)
   - Step 4: Review data
   - Step 5: Submit
    ↓
4. POST /letter/submit
   {
     "letterTypeId": "pkl_type_id",
     "formData": {
       "nim": "24060122140123",
       "nama": "Budi Santoso",
       "tempatPKL": "PT ABC",
       "proposal": "file_url",
       ...
     }
   }
    ↓
5. Backend Process:
   - Get LetterType (schema definition)
   - Create LetterInstance:
     * schema: from template
     * values: from formData
     * status: SUBMITTED
     * currentStep: 1
     * workflowHistory: [{
         action: "SUBMITTED",
         step: 0,
         role: "mahasiswa",
         userId: user.id,
         timestamp: now,
         notes: "Surat diajukan"
       }]
    ↓
6. Response:
   {
     "success": true,
     "data": {
       "id": "letter_123",
       "status": "SUBMITTED",
       "currentStep": 1
     }
   }
    ↓
7. Frontend:
   - Show success message
   - Redirect to Step5Status (tracking page)
```

**Business Rules:**
- Mahasiswa hanya bisa submit 1 surat PKL aktif
- Semua field wajib diisi (validation)
- File upload max 5MB
- Format file: PDF, JPG, PNG
- IPK range: 0.00 - 4.00
- NIM: 12-14 digit

---

### **3.2. Approval Step 1: Dosen Pembimbing**

#### **Endpoint:** `GET /letter/queue` → `POST /letter/:id/approve`

**Flow:**
```
1. Supervisor login
    ↓
2. Navigate to /approval/queue
    ↓
3. Frontend: GET /letter/queue
   - Backend filter: WHERE currentStep = 1
   - Show list surat mahasiswa bimbingannya
    ↓
4. Supervisor click "Review" button
    ↓
5. Navigate to /approval/[id]
    ↓
6. Frontend: GET /letter/:id
   - Show form data
   - Show history (who submitted)
    ↓
7. Supervisor pilih action:
   ├─ APPROVE → Click "Setujui"
   │   ↓
   │   Modal buka, input notes (optional)
   │   ↓
   │   POST /letter/:id/approve { notes: "Approved" }
   │   ↓
   │   Backend:
   │   - workflowHistory.push({
   │       action: "APPROVED",
   │       step: 1,
   │       role: "supervisor_akademik",
   │       notes: "Approved"
   │     })
   │   - currentStep: 2
   │   - status: IN_PROGRESS
   │   ↓
   │   Redirect to next approver (Koordinator)
   │
   ├─ REVISI → Click "Minta Revisi"
   │   ↓
   │   Modal buka, input notes (WAJIB)
   │   ↓
   │   POST /letter/:id/revise { 
   │     notes: "Lengkapi dokumen proposal" 
   │   }
   │   ↓
   │   Backend:
   │   - workflowHistory.push({
   │       action: "REVISION_REQUESTED",
   │       step: 1,
   │       notes: "Lengkapi dokumen proposal"
   │     })
   │   - currentStep: 0 (back to mahasiswa)
   │   - status: REVISION
   │   ↓
   │   Notification to mahasiswa
   │
   └─ TOLAK → Click "Tolak"
       ↓
       Modal buka, input notes (WAJIB)
       ↓
       POST /letter/:id/reject { 
         notes: "Tidak memenuhi syarat" 
       }
       ↓
       Backend:
       - workflowHistory.push({
           action: "REJECTED",
           step: 1,
           notes: "Tidak memenuhi syarat"
         })
       - status: REJECTED
       - currentStep: 1 (freeze)
       ↓
       Workflow END ❌
```

---

### **3.3. Revision Flow (Mahasiswa Edit)**

#### **Endpoint:** `POST /letter/:id/resubmit`

**Flow:**
```
1. Mahasiswa login
    ↓
2. Navigate to /surat (my letters)
    ↓
3. See status: "REVISION" dengan notes
   - "Lengkapi dokumen proposal"
    ↓
4. Click "Edit & Resubmit"
    ↓
5. Form pre-filled dengan data sebelumnya
    ↓
6. Edit field yang perlu diperbaiki
   - Upload proposal baru
   - Update data lain
    ↓
7. Click "Submit Ulang"
    ↓
8. POST /letter/:id/resubmit
   {
     "formData": { ... updated data ... }
   }
    ↓
9. Backend:
   - Update values dengan formData baru
   - workflowHistory.push({
       action: "RESUBMITTED",
       step: 0,
       role: "mahasiswa",
       notes: "Surat direvisi dan diajukan kembali"
     })
   - status: SUBMITTED
   - currentStep: 1 (kembali ke Supervisor)
    ↓
10. Workflow restart dari Step 1
```

**Business Rules:**
- Hanya surat status REVISION yang bisa diedit
- Semua approval sebelumnya di-reset
- History tetap tersimpan
- Nomor revisi increment (v1, v2, v3)

---

### **3.4. Approval Step 2-4: Koordinator → Kaprodi → Manajer TU**

**Same flow as Step 1, bedanya:**

**Step 2: Koordinator**
- currentStep: 2
- role: "koordinator"
- Action: Approve/Revise/Reject
- Next step: 3 (Kaprodi)

**Step 3: Kaprodi**
- currentStep: 3
- role: "ketua_program_studi"
- Action: Approve/Revise/Reject
- Next step: 4 (Manajer TU)

**Step 4: Manajer TU**
- currentStep: 4
- role: "manajer_tu"
- Action: Approve/Revise/Reject
- Next step: 5 (Wadek 1)

**Notes:**
- Semua bisa approve/revise/reject
- Revisi selalu kembali ke mahasiswa
- Tolak = workflow END

---

### **3.5. Approval Step 5: Wadek 1 + Tanda Tangan Digital**

#### **Endpoint:** `POST /letter/:id/approve` (with signature)

**Flow:**
```
1. Wadek 1 login
    ↓
2. Navigate to /approval/queue
    ↓
3. Click "Review" surat
    ↓
4. Review dokumen
    ↓
5. Click "Setujui" button
    ↓
6. Modal buka (notes optional)
    ↓
7. Click "Setujui" in modal
    ↓
8. **SignatureModal auto-open** (karena role = wadek_1)
    ↓
9. Canvas tanda tangan muncul:
   - User draw signature dengan mouse
   - Clear & retry jika salah
   - Signature convert to base64 PNG
    ↓
10. Click "Tanda Tangan & Setujui"
    ↓
11. POST /letter/:id/approve
    {
      "notes": "Disetujui untuk dilanjutkan",
      "signatureData": "data:image/png;base64,iVBORw0KG..."
    }
    ↓
12. Backend:
    - Upload signature to MinIO
    - Get signatureUrl
    - workflowHistory.push({
        action: "APPROVED",
        step: 5,
        role: "wakil_dekan_1",
        notes: "Disetujui untuk dilanjutkan",
        signatureUrl: "minio://signatures/letter_123.png"
      })
    - currentStep: 6
    - status: IN_PROGRESS
    - signatureUrl: "minio://signatures/letter_123.png"
    ↓
13. Next step: UPA (penomoran)
```

**Business Rules:**
- Wadek 1 WAJIB tanda tangan
- Tidak bisa approve tanpa signature
- Signature disimpan as image (PNG)
- Signature tampil di PDF surat final

---

### **3.6. Approval Step 6: UPA + Penomoran Surat**

#### **Endpoint:** `POST /letter/:id/approve` (with letterNumber)

**Flow:**
```
1. UPA login
    ↓
2. Navigate to /approval/queue
    ↓
3. Click "Review" surat
    ↓
4. Review dokumen + TTD Wadek
    ↓
5. Click "Setujui" button
    ↓
6. Modal buka (notes optional)
    ↓
7. Click "Setujui" in modal
    ↓
8. **NumberingModal auto-open** (karena role = upa)
    ↓
9. Form nomor surat:
   - Auto-generate format: 001/FSM/PKL/I/2026
   - User bisa edit manual
   - Click "Tetapkan Nomor & Setujui"
    ↓
10. POST /letter/:id/approve
    {
      "notes": "Surat sudah dinomori",
      "letterNumber": "001/FSM/PKL/I/2026"
    }
    ↓
11. Backend:
    - workflowHistory.push({
        action: "APPROVED",
        step: 6,
        role: "upa",
        notes: "Surat sudah dinomori",
        letterNumber: "001/FSM/PKL/I/2026"
      })
    - currentStep: 6 (freeze, last step)
    - status: COMPLETED ✅
    - letterNumber: "001/FSM/PKL/I/2026"
    ↓
12. Workflow COMPLETE!
    - Generate PDF surat
    - Send notification to mahasiswa
    - Archive surat
```

**Letter Number Format:**
```
[Sequence]/[Faculty]/[Type]/[Month Roman]/[Year]

Examples:
- 001/FSM/PKL/I/2026
- 002/FSM/PKL/I/2026
- 025/FSM/CUTI/XII/2026

Sequence:
- Auto-increment per year
- Reset setiap tahun baru
- 3 digit dengan leading zero
```

---

### **3.7. Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PKL LETTER WORKFLOW                          │
└─────────────────────────────────────────────────────────────────┘

MAHASISWA
   │ Submit surat
   │ (Step 0 → Step 1)
   ↓
┌─────────────────────┐
│ STEP 1: Supervisor  │ → Approve → Next
│  Akademik (Dospem)  │ → Revisi  → Back to Mahasiswa
│                     │ → Tolak   → END ❌
└─────────────────────┘
   ↓ Approved
┌─────────────────────┐
│ STEP 2: Koordinator │ → Same actions
│  (Dosen Koordinator)│
└─────────────────────┘
   ↓ Approved
┌─────────────────────┐
│ STEP 3: Kaprodi     │ → Same actions
│  (Ketua Prodi)      │
└─────────────────────┘
   ↓ Approved
┌─────────────────────┐
│ STEP 4: Manajer TU  │ → Same actions
│  (Tata Usaha)       │
└─────────────────────┘
   ↓ Approved
┌─────────────────────┐
│ STEP 5: Wadek 1     │ → Approve + TTD Digital ✍️ → Next
│  (Wakil Dekan 1)    │ → Revisi → Back to Mahasiswa
│                     │ → Tolak  → END ❌
└─────────────────────┘
   ↓ Approved + TTD
┌─────────────────────┐
│ STEP 6: UPA         │ → Approve + Nomor Surat 🔢 → COMPLETE ✅
│                     │ → Revisi → Back to Mahasiswa
│                     │ → Tolak  → END ❌
└─────────────────────┘
   ↓ Approved + Nomor
┌─────────────────────┐
│  SURAT SELESAI ✅   │
│  - Status: COMPLETED│
│  - Ada TTD          │
│  - Ada Nomor        │
│  - Generate PDF     │
└─────────────────────┘
```

---

## 📊 4. DASHBOARD & MONITORING

### **4.1. Dashboard Mahasiswa**

**Endpoint:** `GET /letter/my`

**Widgets:**
```
┌─────────────────────────────────────────┐
│  Dashboard Mahasiswa                    │
├─────────────────────────────────────────┤
│                                         │
│  📊 Statistik Surat                     │
│  ├─ Total Surat: 5                      │
│  ├─ Dalam Proses: 2                     │
│  ├─ Selesai: 2                          │
│  └─ Ditolak: 1                          │
│                                         │
│  📋 Surat Terbaru                       │
│  ┌───────────────────────────────────┐  │
│  │ Surat Izin PKL                    │  │
│  │ Status: IN_PROGRESS (Step 3/6)    │  │
│  │ Diajukan: 10 Jan 2026             │  │
│  │ [Lihat Detail]                    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Surat Cuti Akademik               │  │
│  │ Status: REVISION                  │  │
│  │ Catatan: "Lengkapi dokumen"       │  │
│  │ [Edit & Resubmit]                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [+ Ajukan Surat Baru]                  │
└─────────────────────────────────────────┘
```

**Features:**
- Quick stats cards
- List surat with status
- Action buttons per status
- Filter by status/date
- Search by letter number

---

### **4.2. Dashboard Approver**

**Endpoint:** `GET /letter/queue`

**Widgets:**
```
┌─────────────────────────────────────────┐
│  Dashboard Supervisor Akademik          │
├─────────────────────────────────────────┤
│                                         │
│  📊 Statistik Approval                  │
│  ├─ Menunggu Review: 5                  │
│  ├─ Disetujui Hari Ini: 3               │
│  ├─ Ditolak: 1                          │
│  └─ Revisi: 2                           │
│                                         │
│  📋 Queue Approval                      │
│  ┌───────────────────────────────────┐  │
│  │ Surat PKL - Budi Santoso          │  │
│  │ NIM: 24060122140123               │  │
│  │ Diajukan: 2 jam yang lalu         │  │
│  │ [Review]                          │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Surat PKL - Ani Wijaya            │  │
│  │ NIM: 24060122140124               │  │
│  │ Diajukan: 5 jam yang lalu         │  │
│  │ [Review]                          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Features:**
- Approval queue (sorted by submission time)
- Filter by mahasiswa/date
- Quick approve/reject
- SLA indicator (urgent if >24 hours)

---

### **4.3. Status Tracking (Step5Status)**

**Endpoint:** `GET /letter/:id`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Surat Izin PKL - 001/FSM/PKL/I/2026                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Informasi Surat        │  📜 Riwayat Approval          │
│  ┌───────────────────┐     │  ┌─────────────────────────┐  │
│  │ Status: COMPLETED │     │  │ ● UPA                   │  │
│  │ Nomor: 001/FSM... │     │  │   Disetujui + Nomor     │  │
│  │ TTD: ✓            │     │  │   13 Jan 2026, 10:00    │  │
│  │ Tanggal: 13 Jan   │     │  │   "Surat sudah dinomori"│  │
│  └───────────────────┘     │  │                         │  │
│                            │  │ ● Wadek 1               │  │
│  👤 Data Mahasiswa         │  │   Disetujui + TTD       │  │
│  - NIM: 240601221...       │  │   13 Jan 2026, 09:00    │  │
│  - Nama: Budi Santoso      │  │   "Disetujui"           │  │
│  - Email: budi@...         │  │                         │  │
│  - IPK: 3.75               │  │ ● Manajer TU            │  │
│                            │  │   Disetujui             │  │
│  🏢 Detail PKL             │  │   12 Jan 2026, 15:00    │  │
│  - Tempat: PT ABC          │  │                         │  │
│  - Alamat: Jakarta         │  │ ● Kaprodi               │  │
│  - Durasi: 3 bulan         │  │   Disetujui             │  │
│                            │  │   12 Jan 2026, 11:00    │  │
│  📎 Lampiran               │  │                         │  │
│  - Proposal.pdf            │  │ ● Koordinator           │  │
│  - KTM.jpg                 │  │   Disetujui             │  │
│                            │  │   11 Jan 2026, 14:00    │  │
│  [Download PDF]            │  │                         │  │
│                            │  │ ● Supervisor Akademik   │  │
│                            │  │   Disetujui             │  │
│                            │  │   10 Jan 2026, 10:00    │  │
│                            │  │   "Data sudah lengkap"  │  │
│                            │  │                         │  │
│                            │  │ ● Mahasiswa             │  │
│                            │  │   Diajukan              │  │
│                            │  │   10 Jan 2026, 08:00    │  │
│                            │  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time status
- Complete history dengan notes
- Visual timeline
- Download PDF (jika completed)
- Print button

---

## 🔔 5. NOTIFICATION SYSTEM (Future Enhancement)

### **5.1. Email Notifications**

**Trigger Events:**
```
1. Surat submitted → Email to Supervisor
   "Surat baru dari Budi Santoso perlu direview"

2. Surat approved → Email to next approver
   "Surat dari Budi Santoso menunggu approval Anda"

3. Surat ditolak → Email to Mahasiswa
   "Surat Anda ditolak oleh Supervisor"
   "Alasan: Tidak memenuhi syarat"

4. Surat revisi → Email to Mahasiswa
   "Surat Anda perlu direvisi"
   "Catatan: Lengkapi dokumen proposal"

5. Surat completed → Email to Mahasiswa
   "Surat Anda selesai diproses!"
   "Nomor: 001/FSM/PKL/I/2026"
   "Download PDF: [link]"
```

---

### **5.2. In-App Notifications**

**Notification Center:**
```
┌─────────────────────────────────────┐
│  🔔 Notifikasi (5 unread)           │
├─────────────────────────────────────┤
│  ● Surat PKL Anda selesai diproses  │
│    Nomor: 001/FSM/PKL/I/2026        │
│    5 menit yang lalu                │
│                                     │
│  ○ Supervisor telah approve         │
│    1 jam yang lalu                  │
│                                     │
│  ○ Surat perlu revisi               │
│    Kemarin                          │
└─────────────────────────────────────┘
```

---

## 📁 6. MASTER DATA MANAGEMENT

### **6.1. User Management (Superadmin)**

**Endpoints:**
- `GET /master/user` - List users
- `POST /master/user` - Create user
- `PUT /master/user/:id` - Update user
- `DELETE /master/user/:id` - Delete user

**Flow Create User:**
```
1. Superadmin login
    ↓
2. Navigate to /admin/users
    ↓
3. Click "Tambah User"
    ↓
4. Fill form:
   - Name
   - Email
   - Password
   - Role (dropdown)
   - Departemen
   - Program Studi (if mahasiswa/pegawai)
   - NIM/NIP (if mahasiswa/pegawai)
    ↓
5. Submit form
    ↓
6. POST /master/user
   {
     "name": "Budi Santoso",
     "email": "budi@example.com",
     "password": "password123",
     "roleId": "mahasiswa_role_id"
   }
    ↓
7. Backend:
   - Create user in user table
   - Hash password in account table
   - Assign role in user_role table
   - Create mahasiswa/pegawai record
    ↓
8. Success → Show user list
```

---

### **6.2. Role & Permission Management**

**Endpoints:**
- `GET /master/role` - List roles
- `GET /master/permission` - List permissions
- `POST /master/role/:id/permissions` - Assign permissions

**Flow Assign Permission:**
```
1. Superadmin login
    ↓
2. Navigate to /admin/roles
    ↓
3. Click role "Supervisor Akademik"
    ↓
4. Show current permissions
    ↓
5. Click "Edit Permissions"
    ↓
6. Checklist permissions:
   [x] letter:read
   [x] letter:approve
   [x] letter:reject
   [x] letter:revise
   [ ] letter:delete
    ↓
7. Save changes
    ↓
8. POST /master/role/:id/permissions
   {
     "permissions": [
       "letter:read",
       "letter:approve",
       "letter:reject",
       "letter:revise"
     ]
   }
    ↓
9. Backend:
   - Delete existing role_permission
   - Insert new role_permission
   - Update Casbin policy
    ↓
10. Success → Permission updated
```

---

### **6.3. Departemen & Prodi Management**

**Endpoints:**
- `GET /master/departemen` - List departments
- `POST /master/departemen` - Create department
- `GET /master/prodi` - List study programs
- `POST /master/prodi` - Create study program

**Data Structure:**
```
Departemen:
- Informatika (S1, S2, S3)
- Matematika (S1, S2, S3)
- Fisika (S1, S2, S3)
- Kimia (S1, S2, S3)
- Biologi (S1, S2, S3)
- Statistika (S1, S2, S3)

Program Studi (per Departemen):
- S1 Informatika
- S2 Informatika
- S3 Informatika
```

---

### **6.4. Letter Type & Template Management**

**Endpoints:**
- `GET /master/suratType` - List letter types
- `POST /master/suratType` - Create letter type
- `GET /master/suratTemplate` - List templates
- `POST /master/suratTemplate` - Create template

**Flow Create Letter Template:**
```
1. Admin login
    ↓
2. Navigate to /admin/templates
    ↓
3. Click "Buat Template Baru"
    ↓
4. Fill form:
   - Letter Type: PKL
   - Version Name: v1.0
   - Schema Definition: (JSON editor)
     {
       "version": "v1",
       "data": [
         {
           "data_type": "string",
           "label": "Nama Mahasiswa",
           "value": "{{nama}}",
           "transform": {
             "position": { "x": 100, "y": 200 },
             "scale": { "x": 1, "y": 1 },
             "rotation": 0
           }
         }
       ]
     }
   - Form Fields: (JSON editor)
     {
       "fields": [
         {
           "name": "nama",
           "type": "string",
           "label": "Nama Lengkap",
           "required": true
         }
       ]
     }
    ↓
5. Submit form
    ↓
6. POST /master/suratTemplate
    ↓
7. Backend:
   - Validate schema (Zod validation)
   - Create template record
    ↓
8. Success → Template created
```

---

## 🔄 7. DISPOSITION FLOW (Future Enhancement)

### **7.1. Disposisi Surat Masuk**

**Use Case:** Dekan menerima surat dari luar, perlu disposisi ke unit terkait

**Flow:**
```
1. Dekan login
    ↓
2. Ada surat masuk dari eksternal
    ↓
3. Navigate to /disposition
    ↓
4. Click "Buat Disposisi"
    ↓
5. Fill form:
   - Surat: [pilih surat]
   - Tujuan Disposisi: Kaprodi Informatika
   - Instruksi: "Mohon ditindaklanjuti sesuai tupoksi"
   - Prioritas: Normal/Urgent
   - Deadline: 3 hari
    ↓
6. Submit disposisi
    ↓
7. POST /disposition/create
    ↓
8. Backend:
   - Create disposition record
   - Send notification to Kaprodi
    ↓
9. Kaprodi receive notification
    ↓
10. Kaprodi review & process
     ├─ Selesai → Mark as done
     └─ Forward → Disposisi lagi ke unit lain
```

---

## 📥 8. DOWNLOAD & GENERATE PDF

### **8.1. Generate PDF Surat**

**Endpoint:** `GET /letter/:id/download`

**Flow:**
```
1. User (mahasiswa/approver) login
    ↓
2. Navigate to letter detail
    ↓
3. Click "Download PDF"
    ↓
4. GET /letter/:id/download
    ↓
5. Backend Process:
   a. Get LetterInstance (schema + values)
   b. Get LetterTemplate
   c. Loop schema.data:
      - Replace {{variable}} dengan values
      - Get x, y, rotation dari transform
      - Render text/image pada koordinat
   d. Add header (logo, nama fakultas)
   e. Add footer (TTD Wadek + nomor surat)
   f. Generate PDF buffer
    ↓
6. Response: PDF file stream
    ↓
7. Browser download: "Surat_PKL_001_FSM_I_2026.pdf"
```

**PDF Structure:**
```
┌───────────────────────────────────────┐
│  [Logo UNDIP]  [Logo FSM]            │
│                                       │
│  FAKULTAS SAINS DAN MATEMATIKA        │
│  UNIVERSITAS DIPONEGORO               │
│                                       │
├───────────────────────────────────────┤
│                                       │
│  Nomor    : 001/FSM/PKL/I/2026        │
│  Lampiran : -                         │
│  Perihal  : Izin PKL                  │
│                                       │
│  Kepada Yth.                          │
│  Direktur PT ABC Indonesia            │
│  Di Jakarta                           │
│                                       │
│  Dengan hormat,                       │
│  ...                                  │
│  [Dynamic content dari values]        │
│  ...                                  │
│                                       │
│                      Semarang, 13 Januari 2026│
│                      Wakil Dekan 1,   │
│                                       │
│                      [TTD Digital]    │
│                                       │
│                      Dr. Nama Wadek   │
│                      NIP. xxx         │
└───────────────────────────────────────┘
```

---

## 🔐 9. SECURITY FEATURES

### **9.1. Authentication Security**

**Features:**
- Password hashing (bcrypt)
- Session token (JWT)
- Session expiry (7 days)
- Refresh token mechanism
- Rate limiting login attempts
- CSRF protection

---

### **9.2. Authorization Security**

**Features:**
- RBAC dengan Casbin
- Row-level security (user can only access own data)
- Permission checking pada setiap endpoint
- Audit log (who did what when)

---

### **9.3. Data Security**

**Features:**
- HTTPS only (production)
- SQL injection prevention (Prisma ORM)
- XSS prevention (sanitize input)
- File upload validation (type, size)
- Sensitive data encryption (password)

---

## 🚪 10. LOGOUT FLOW

### **10.1. Standard Logout**

**Endpoint:** `POST /auth/logout`

**Flow:**
```
1. User click "Logout" button
    ↓
2. Confirm dialog: "Yakin ingin keluar?"
    ↓
3. POST /auth/logout
    ↓
4. Backend:
   - Get session token from cookie/header
   - Delete session from database
   - Invalidate token
    ↓
5. Frontend:
   - Clear localStorage/cookie
   - Clear auth state
   - Redirect to /login
    ↓
6. Show message: "Anda berhasil logout"
```

**Database Changes:**
```sql
-- Session deleted
DELETE FROM session WHERE token = 'user_session_token';
```

---

### **10.2. Auto Logout (Session Expired)**

**Flow:**
```
1. User idle for 7 days
    ↓
2. Session expiry check on next request
    ↓
3. Middleware: Check session.expiresAt < now()
    ↓
4. Return 401 Unauthorized
    ↓
5. Frontend intercept 401:
   - Clear auth state
   - Show toast: "Sesi Anda habis, silakan login kembali"
   - Redirect to /login
```

---

## 📊 11. SYSTEM METRICS & MONITORING

### **11.1. Key Metrics**

**Performance:**
- Average approval time per step
- Bottleneck detection (which step paling lama)
- SLA compliance (target: max 24 hours per step)

**Usage:**
- Total surat submitted per month
- Approval rate (approved vs rejected)
- Revision rate
- Active users per role

**Quality:**
- First-time approval rate (tanpa revisi)
- Rejection reasons (categorization)
- Average revision count per letter

---

### **11.2. Reports**

**Daily Report:**
- Surat submitted today
- Surat completed today
- Pending approvals by role

**Monthly Report:**
- Total surat per type
- Approval time trend
- User activity
- System uptime

---

## 🎯 12. BUSINESS RULES SUMMARY

### **12.1. Letter Submission Rules**

1. Mahasiswa hanya bisa submit 1 surat PKL aktif
2. Semua field mandatory harus diisi
3. File max 5MB, format PDF/JPG/PNG
4. IPK range 0.00-4.00
5. NIM format: 12-14 digit

### **12.2. Approval Rules**

1. Approver hanya bisa approve surat di step mereka
2. Revisi selalu kembali ke mahasiswa (step 0)
3. Tolak = workflow END, tidak bisa dilanjutkan
4. Notes wajib untuk revisi/tolak
5. Wadek 1 wajib TTD digital
6. UPA wajib beri nomor surat
7. Setelah completed, surat tidak bisa diubah

### **12.3. Permission Rules**

1. Mahasiswa: submit, read_own, update_own (status REVISION)
2. Approver: read, approve, reject, revise
3. Superadmin: all permissions
4. UPA: read, approve, reject, revise, assign_number
5. Admin: master data management

### **12.4. Workflow Rules**

1. Sequential approval (tidak bisa skip step)
2. History immutable (tidak bisa dihapus)
3. Letter number unique per year
4. Signature required untuk approval Wadek
5. Completed letter generate PDF

---

## 🔄 13. ERROR HANDLING

### **13.1. Common Errors**

**Authentication Errors:**
```
401 Unauthorized
- Session expired
- Invalid token
- User not found

Solution: Redirect to login
```

**Authorization Errors:**
```
403 Forbidden
- No permission for this action
- Not your turn to approve

Solution: Show error message
```

**Validation Errors:**
```
400 Bad Request
- Missing required field
- Invalid data format
- File too large

Solution: Show field-level errors
```

**Business Logic Errors:**
```
422 Unprocessable Entity
- Duplicate submission
- Already approved
- Letter not in correct state

Solution: Show descriptive error
```

---

## 📱 14. FRONTEND ROUTES

### **14.1. Public Routes (No Auth)**
- `/login` - Login page
- `/register` - Register page (mahasiswa only)

### **14.2. Protected Routes (Auth Required)**

**Mahasiswa:**
- `/dashboard` - Dashboard
- `/pengajuan` - Submit surat (5 steps)
- `/surat` - My letters
- `/surat/:id` - Letter detail + status

**Approver (All):**
- `/dashboard` - Dashboard dengan queue
- `/approval/queue` - List surat perlu approve
- `/approval/:id` - Review & approve surat

**Specific Approver:**
- `/signature` - Wadek only
- `/numbering` - UPA only
- `/disposition` - Dekan, Wadek, Kaprodi

**Admin:**
- `/admin/users` - User management
- `/admin/roles` - Role & permission
- `/admin/departments` - Departemen & prodi
- `/admin/templates` - Letter templates

---

## 🎨 15. UI/UX PATTERNS

### **15.1. Navigation**

**Navbar:**
```
[Logo] E-Office Persuratan FSM UNDIP
                                    [Dashboard] [Surat] [🔔] [👤 User ▼]
```

**Sidebar (Approver):**
```
├─ 📊 Dashboard
├─ 📥 Surat Masuk
│  ├─ Penerima
│  ├─ Disposisi ← active
│  ├─ Tembusan
│  └─ Arsip
├─ 📤 Surat Keluar
└─ ⚙️ Pengaturan
```

### **15.2. Status Badges**

```
DRAFT       → Gray
SUBMITTED   → Blue
IN_PROGRESS → Yellow
REVISION    → Orange
REJECTED    → Red
COMPLETED   → Green
```

### **15.3. Action Buttons**

```
Primary:   [Setujui] - Blue
Secondary: [Minta Revisi] - Orange
Danger:    [Tolak] - Red
Neutral:   [Batal] - Gray
```

---

## 🚀 16. DEPLOYMENT & SCALING

### **16.1. Architecture**

```
Frontend (Next.js 15)
    ↓ HTTPS
API Gateway / Load Balancer
    ↓
Backend (Elysia.js + Bun)
    ↓
    ├─ PostgreSQL (Primary DB)
    ├─ MinIO (File Storage)
    └─ Redis (Session Cache - future)
```

### **16.2. Scaling Strategy**

**Horizontal Scaling:**
- Multiple backend instances (PM2 cluster)
- Load balancer (Nginx/HAProxy)
- Database read replicas
- MinIO distributed mode

**Vertical Scaling:**
- Increase server resources
- Database optimization
- Query caching
- CDN untuk static assets

---

## ✅ 17. TESTING SCENARIOS

### **17.1. Happy Path**

```
1. Mahasiswa submit surat
2. Supervisor approve
3. Koordinator approve
4. Kaprodi approve
5. Manajer TU approve
6. Wadek 1 approve + TTD
7. UPA approve + nomor
8. Surat completed
9. Download PDF
```

### **17.2. Revision Path**

```
1. Mahasiswa submit surat
2. Supervisor minta revisi: "Lengkapi proposal"
3. Mahasiswa edit & resubmit
4. Supervisor approve (revised)
5. Koordinator approve
6. ... continue
```

### **17.3. Rejection Path**

```
1. Mahasiswa submit surat
2. Supervisor review
3. Supervisor tolak: "Tidak memenuhi syarat"
4. Workflow END
5. Mahasiswa buat pengajuan baru
```

---

## 📞 18. SUPPORT & TROUBLESHOOTING

### **18.1. Common Issues**

**Issue: Surat stuck di approval**
- Check: Apakah approver sudah notifikasi?
- Check: Apakah approver punya permission?
- Action: Reminder notification

**Issue: Cannot upload file**
- Check: File size < 5MB?
- Check: File format PDF/JPG/PNG?
- Check: MinIO service running?

**Issue: PDF tidak generate**
- Check: Surat status COMPLETED?
- Check: Ada TTD dan nomor?
- Check: Template valid?

---

## 🎓 19. USER TRAINING CHECKLIST

### **19.1. Mahasiswa Training**
- [x] Cara login
- [x] Cara submit surat (5 steps)
- [x] Cara cek status surat
- [x] Cara edit surat revisi
- [x] Cara download PDF surat selesai

### **19.2. Approver Training**
- [x] Cara login
- [x] Cara lihat queue approval
- [x] Cara review surat
- [x] Cara approve/revisi/tolak
- [x] Cara beri catatan
- [x] (Wadek) Cara tanda tangan digital
- [x] (UPA) Cara beri nomor surat

### **19.3. Admin Training**
- [x] Cara manage user
- [x] Cara assign role & permission
- [x] Cara buat letter template
- [x] Cara monitoring sistem

---

## 📚 20. GLOSSARY

**Term** | **Definition**
---------|---------------
Approver | User yang punya wewenang approve surat
Disposisi | Instruksi untuk menindaklanjuti surat
Letter Type | Kategori surat (PKL, Cuti, dll)
Letter Template | Schema untuk generate surat
Letter Instance | Surat yang diajukan mahasiswa
Workflow History | Riwayat approval dari submit sampai selesai
Step | Tahapan approval dalam workflow
Role | Posisi user dalam organisasi
Permission | Hak akses untuk melakukan action
Casbin | Library untuk RBAC authorization
MinIO | Object storage untuk file
Better-Auth | Library untuk authentication

---

## 🎯 21. SUCCESS CRITERIA

### **21.1. Functional Requirements**
- ✅ User bisa login dengan email/password
- ✅ Mahasiswa bisa submit surat
- ✅ Approver bisa approve/revisi/tolak
- ✅ Wadek bisa tanda tangan digital
- ✅ UPA bisa beri nomor surat
- ✅ User bisa track status surat
- ✅ System generate PDF surat

### **21.2. Non-Functional Requirements**
- ✅ Response time < 2 detik
- ✅ Uptime > 99.5%
- ✅ Support 100 concurrent users
- ✅ Mobile responsive
- ✅ Secure (HTTPS, password hash, RBAC)

### **21.3. Business Goals**
- ✅ Reduce paper usage 80%
- ✅ Reduce approval time 50%
- ✅ Increase transparency 100%
- ✅ Improve traceability 100%
- ✅ User satisfaction > 80%

---

## 📝 DOCUMENT VERSION

**Version:** 1.0  
**Date:** 13 January 2026  
**Author:** Development Team  
**Approved by:** FSM UNDIP Management  

**Change Log:**
- v1.0 (13 Jan 2026): Initial documentation

---

**END OF BUSINESS PROCESS DOCUMENTATION**

For technical documentation, please refer to:
- README.md - Installation & setup
- API_DOCUMENTATION.md - API endpoints
- DATABASE_SCHEMA.md - Database design
- DEPLOYMENT_GUIDE.md - Deployment instructions
