# 📚 E-Office Surat - Dokumentasi Project

> Sistem Pengajuan & Persetujuan Surat Akademik Online  
> Universitas Diponegoro

---

## 📖 Daftar Isi

- [Tentang Project](#-tentang-project)
- [Struktur Monorepo](#-struktur-monorepo)
- [Backend (API)](#-backend-api)
- [Frontend (Web App)](#-frontend-web-app)
- [Alur Pengajuan Surat](#-alur-pengajuan-surat)
- [Teknologi](#-teknologi)
- [Cara Install](#-cara-install)
- [FAQ](#-faq)

---

## 🎯 Tentang Project

**E-Office Surat** adalah aplikasi web untuk mahasiswa mengajukan surat akademik (PKL, penelitian, dll) secara online dengan approval workflow otomatis.

### Masalah yang Diselesaikan

**Sebelum:**
- Mahasiswa harus datang ke kampus untuk submit surat
- Proses approval manual dan lama (7-14 hari)
- Susah tracking status surat
- Surat sering hilang atau tertunda

**Sesudah:**
- Submit surat dari rumah (24/7)
- Approval otomatis dengan notifikasi real-time
- Tracking status langsung di dashboard
- Proses lebih cepat (2-3 hari)

### Fitur Utama

1. **Multi-Step Form** - Pengisian data bertahap (identitas → detail → lampiran → review)
2. **8-Level Approval** - Workflow approval terstruktur (Dosen → Koordinator → Prodi → ... → Penomoran)
3. **Real-Time Tracking** - Mahasiswa bisa lihat status approval live
4. **File Upload** - Upload proposal, KTM, transkrip nilai
5. **Auto Notification** - Email/push notification setiap ada update
6. **Digital Signature** - TTD digital untuk setiap approval
7. **PDF Generation** - Download surat final dengan nomor resmi

---

## 📁 Struktur Monorepo

Project ini menggunakan **monorepo** (1 repository untuk backend + frontend).

```
eoffice-PKL-monorepo/
│
├── e-office-api-v2/              Backend API (Elysia.js + Bun)
│   ├── prisma/                   Database schema & migrations
│   ├── src/
│   │   ├── routes/               API endpoints
│   │   ├── services/             Business logic
│   │   ├── middlewares/          Auth & RBAC
│   │   └── lib/                  Utilities
│   └── docker-compose.yml        Database & storage setup
│
├── e-office-webapp-v2/           Frontend Web (Next.js + React)
│   └── src/
│       ├── app/                  Pages & routes
│       ├── components/           UI components
│       ├── services/             API calls
│       ├── hooks/                Custom hooks
│       ├── stores/               Global state (Zustand)
│       └── types/                TypeScript types
│
└── PROJECT_DOCUMENTATION.md      File ini
```

### Kenapa Monorepo?

- ✅ Backend & frontend dalam 1 repository (mudah manage)
- ✅ Sharing types TypeScript antar BE & FE (type-safe)
- ✅ Deploy bersamaan (atomic deployment)
- ✅ Code review lebih mudah

---

## 🔧 Backend (API)

**Lokasi:** `e-office-api-v2/`

Backend menggunakan **Elysia.js** (framework modern, cepat) dengan **Bun** runtime.

### Struktur Folder Backend

```
e-office-api-v2/
├── prisma/
│   ├── schema.prisma             Database schema (tabel, relasi)
│   └── migrations/               Database migrations (perubahan DB)
│
├── src/
│   ├── routes/                   API endpoints
│   │   ├── public/               Public routes (login, register)
│   │   ├── master/               Master data (user, prodi, dosen)
│   │   └── me.ts                 User profile endpoints
│   │
│   ├── services/                 Business logic
│   │   └── database_models/      CRUD operations per tabel
│   │
│   ├── middlewares/              Middleware
│   │   ├── auth.ts               JWT authentication
│   │   └── context.ts            Request context
│   │
│   ├── lib/                      Utilities
│   │   ├── auth.ts               Better-Auth setup
│   │   └── casbin.ts             RBAC (role-based access control)
│   │
│   ├── db/
│   │   ├── index.ts              Database client (Prisma)
│   │   └── seed.ts               Seed data awal
│   │
│   ├── config.ts                 App configuration
│   ├── server.ts                 Server setup
│   └── index.ts                  Entry point
│
├── casbin/
│   └── model.conf                RBAC model configuration
│
└── docker-compose.yml            PostgreSQL + MinIO setup
```

### Fungsi Setiap Folder

| Folder | Fungsi |
|--------|--------|
| **prisma/** | Database schema & migration history |
| **routes/** | Definisi API endpoints (GET, POST, PUT, DELETE) |
| **services/** | Business logic & database operations |
| **middlewares/** | Auth check, permission check, logging |
| **lib/** | Helper functions & utilities |
| **db/** | Database connection & seed data |
| **casbin/** | RBAC (siapa boleh akses apa) |

### Database Schema (Simplified)

**Core Tables:**

1. **User** - Semua user (mahasiswa, dosen, admin)
2. **Role** - Roles (mahasiswa, dosen_pembimbing, ketua_prodi, admin, dll)
3. **LetterInstance** - Surat yang diajukan mahasiswa
4. **ApprovalHistory** - Log approval (siapa approve, kapan, comment)
5. **Departemen** - Departemen/Fakultas
6. **ProgramStudi** - Program studi
7. **Mahasiswa** - Data mahasiswa (extend User)
8. **Pegawai** - Data dosen/staff (extend User)

### API Endpoints (REST)

**Authentication:**
- `POST /public/sign-in` - Login
- `POST /public/register` - Register mahasiswa
- `GET /me` - Get current user info

**Master Data (Admin):**
- `GET /master/user` - List users
- `POST /master/user` - Create user
- `GET /master/departemen` - List departemen
- `GET /master/prodi` - List program studi

**Letter Management:**
- `POST /letter/submit` - Submit surat baru
- `GET /letter/my` - Get my letters
- `GET /letter/:id` - Get detail surat
- `POST /letter/:id/approve` - Approve surat
- `POST /letter/:id/reject` - Reject surat
- `POST /letter/:id/revise` - Minta revisi

**File Upload:**
- `POST /upload` - Upload file (proposal, KTM, dll)
- `GET /file/:key` - Download file

### Authentication & Authorization

**Better-Auth (Login):**
- Email/password authentication
- JWT token generation
- Session management

**Casbin (Authorization):**
- Role-based access control (RBAC)
- Format: `role → permission → resource`
- Contoh: `mahasiswa` boleh `create` surat, tapi tidak boleh `approve`

### Workflow State Machine

**Status Surat:**
- `DRAFT` - Belum submit (bisa edit/delete)
- `PENDING` - Sudah submit, waiting approval
- `IN_PROGRESS` - Sedang direview
- `REVISION` - Diminta revisi (back to mahasiswa)
- `COMPLETED` - Semua approval done + ada nomor surat
- `REJECTED` - Ditolak permanent
- `CANCELLED` - Dibatalkan oleh mahasiswa

---

## 💻 Frontend (Web App)

**Lokasi:** `e-office-webapp-v2/`

Frontend menggunakan **Next.js 16** (App Router) dengan **React 19**.

### Struktur Folder Frontend

```
e-office-webapp-v2/src/
├── app/                          Next.js App Router (pages)
│   ├── (auth)/                   Public routes (no auth)
│   │   └── login/                Login page
│   │
│   └── (dashboard)/              Protected routes (need auth)
│       ├── page.tsx              Dashboard home
│       ├── pengajuan/pkl/        PKL submission flow (5 steps)
│       │   ├── identitas/        Step 1: Data mahasiswa
│       │   ├── detail-pengajuan/ Step 2: Detail PKL
│       │   ├── lampiran/         Step 3: Upload files
│       │   ├── review/           Step 4: Review sebelum submit
│       │   └── status/           Step 5: Status tracking
│       │
│       └── surat/                Surat management
│           └── detail/[id]/      Detail surat & history
│
├── components/                   UI Components
│   ├── ui/                       Base components (button, input, card)
│   │   └── ... (18 components)   shadcn/ui components
│   │
│   ├── features/pkl/             PKL-specific components
│   │   ├── Step1identitas.tsx    Form identitas mahasiswa
│   │   ├── Step2Detail.tsx       Form detail PKL
│   │   ├── Step3Lampiran.tsx     Upload component
│   │   ├── Step4Review.tsx       Review summary
│   │   ├── Step5Status.tsx       Status tracker
│   │   ├── Stepper.tsx           Multi-step indicator
│   │   ├── Navbar.tsx            Navigation bar
│   │   └── Breadcrumbs.tsx       Breadcrumb navigation
│   │
│   ├── layouts/                  Layout wrappers
│   │   ├── DashboardLayout.tsx   Main dashboard layout
│   │   └── Sidebar.tsx           Navigation sidebar
│   │
│   └── shared/                   Shared components
│       ├── Navbar.tsx            Global navbar
│       └── Footer.tsx            Global footer
│
├── services/                     API Integration
│   ├── auth.service.ts           Login, logout, register
│   ├── letter.service.ts         CRUD surat
│   ├── approval.service.ts       Approve, reject, revise
│   └── file.service.ts           Upload/download files
│
├── hooks/                        Custom React Hooks
│   ├── api/                      Data fetching hooks
│   │   ├── useAuth.ts            Auth operations
│   │   ├── useLetters.ts         Letter CRUD
│   │   └── useApproval.ts        Approval actions
│   │
│   └── ui/                       UI interaction hooks
│       ├── useToast.ts           Toast notifications
│       ├── useModal.ts           Modal dialogs
│       └── useDebounce.ts        Debounce input
│
├── stores/                       Global State (Zustand)
│   ├── authStore.ts              User, token, roles (persistent)
│   ├── pklFormStore.ts           Multi-step form state
│   └── notificationStore.ts      Real-time notifications
│
├── types/                        TypeScript Types
│   ├── auth.types.ts             User, Role, Permission
│   ├── letter.types.ts           Letter, LetterInstance
│   ├── approval.types.ts         ApprovalHistory
│   ├── form.types.ts             Form data types
│   └── api.types.ts              API response types
│
└── lib/                          Utilities
    ├── api.ts                    Eden Treaty API client
    ├── utils.ts                  Helper functions
    └── constants.ts              App constants
```

### Fungsi Setiap Folder

| Folder | Fungsi | Contoh |
|--------|--------|--------|
| **app/** | Pages & routing (file-based) | `app/login/page.tsx` → `/login` |
| **components/ui/** | Base UI components | Button, Input, Card, Form |
| **components/features/** | Feature-specific components | PKL form steps, Status tracker |
| **components/layouts/** | Layout wrappers | Dashboard layout, Sidebar |
| **services/** | API calls ke backend | `letterService.getMyLetters()` |
| **hooks/** | Custom React hooks | `useAuth()`, `useLetters()` |
| **stores/** | Global state management | Auth state, Form state |
| **types/** | TypeScript type definitions | User, Letter, Approval types |
| **lib/** | Helper functions | API client, utils, constants |

### Arsitektur Clean Architecture

```
📄 Pages (app/)              → Routing & layouts
    ↓
🎨 Components                 → UI presentation
    ↓
🪝 Hooks                      → Business logic
    ↓
🔧 Services                   → API integration
    ↓
🌐 API Client (lib/api.ts)   → HTTP requests
```

**Prinsip:**
- **Separation of Concerns** - Setiap layer punya tanggung jawab jelas
- **Unidirectional Flow** - Data mengalir 1 arah (Pages → Components → Hooks → Services → API)
- **Testability** - Setiap layer bisa ditest terpisah
- **Reusability** - Components & hooks bisa dipakai di banyak tempat

### State Management (Zustand)

**1. Auth Store (Persistent)**
- Menyimpan: User, token, roles
- Fungsi: login(), logout(), hasRole()
- Persistent: Disimpan di localStorage (tetap login setelah refresh)

**2. PKL Form Store (Session)**
- Menyimpan: Data form multi-step (identitas, detail PKL, lampiran)
- Fungsi: updateIdentitas(), updateDetailPKL(), addLampiran(), reset()
- Session-based: Hilang setelah submit atau close tab

### Routing & Navigation

**Public Routes (tanpa auth):**
- `/login` - Login page

**Protected Routes (harus login):**
- `/` - Dashboard home
- `/pengajuan/pkl/*` - Multi-step form (5 steps)
- `/surat/:id` - Detail surat & approval history

**Protection Mechanism:**
- Route group `(dashboard)` otomatis check auth
- Jika belum login → redirect ke `/login`
- Implemented di `app/(dashboard)/layout.tsx`

### Form Handling

**React Hook Form + Zod Validation**
- React Hook Form: Handle form state & submission
- Zod: Schema validation (NIM harus 10 digit, email valid, dll)
- Automatic error messages
- Type-safe form data

### API Client (Eden Treaty)

**Type-Safe API Calls**
- Import types langsung dari backend
- Auto-complete API endpoints
- Runtime type checking
- No manual API typing needed

---

## 📋 Alur Pengajuan Surat

### User Journey - Mahasiswa

**1. Login**
- Mahasiswa buka website → Login dengan SSO/email
- Redirect ke Dashboard

**2. Mulai Pengajuan**
- Dashboard → Menu "Pengajuan Surat" → Pilih "PKL"
- Masuk ke Multi-Step Form

**3. Isi Form (5 Steps)**

| Step | Isi Apa | Validasi |
|------|---------|----------|
| **Step 1: Identitas** | NIM, Nama, Email, Prodi, Semester, IPK | Semua field wajib |
| **Step 2: Detail PKL** | Perusahaan, Alamat, Periode, Dosen Pembimbing, Tujuan | Tanggal mulai < selesai |
| **Step 3: Lampiran** | Upload Proposal, Surat Balasan, Transkrip (PDF) | Min 1 file, max 5MB |
| **Step 4: Review** | Preview semua data (read-only) | Cek ulang sebelum submit |
| **Step 5: Submit** | Kirim ke backend | Validasi final di server |

**4. Status Tracking**
- Setelah submit → Lihat progress approval real-time
- Notifikasi setiap ada action (approve/reject/revise)
- Download surat final jika sudah COMPLETED

### Approval Workflow (8 Langkah)

Setelah mahasiswa submit, surat akan melalui 8 level approval:

```
Mahasiswa Submit
    ↓
Step 1: Dosen Pembimbing       → Approve/Reject/Revise
    ↓
Step 2: Dosen Koordinator      → Approve/Reject/Revise
    ↓
Step 3: Ketua Prodi            → Approve/Reject/Revise
    ↓
Step 4: Admin                  → Approve/Reject/Revise
    ↓
Step 5: Supervisor Akademik    → Approve/Reject/Revise
    ↓
Step 6: Manajer TU             → Approve/Reject/Revise
    ↓
Step 7: Wakil Dekan            → Approve/Reject/Revise + TTD
    ↓
Step 8: Penomoran (UPA)        → Assign nomor surat
    ↓
✅ COMPLETED (Surat bisa didownload)
```

**Setiap Approver Bisa:**
- **Approve** → Lanjut ke step berikutnya
- **Reject** → Status = REJECTED (permanent, tidak bisa lanjut)
- **Revise** → Kembali ke mahasiswa untuk perbaikan

### Aturan Bisnis (18 Rules)

| # | Rule | Penjelasan |
|---|------|-----------|
| 1 | **1 mahasiswa = 1 pengajuan aktif** | Tidak bisa submit baru jika masih ada surat PENDING/IN_PROGRESS |
| 2 | **Approval sequence strict** | Harus berurutan 1→2→3→...→8, tidak bisa skip |
| 3 | **Revise reset workflow** | Jika ada revise → back to Step 1, semua approval sebelumnya invalid |
| 4 | **Reject is final** | Status REJECTED = permanent, harus buat pengajuan baru |
| 5 | **Draft editable** | Surat DRAFT bisa edit/delete kapan saja |
| 6 | **Auto-notification** | Setiap action → notif ke mahasiswa + approver berikutnya |
| 7 | **File immutable after submit** | Setelah submit, file tidak bisa diganti (kecuali revise) |
| 8 | **IPK minimum 2.5** | Validasi server: IPK < 2.5 → reject otomatis |
| 9 | **Periode PKL min 1 bulan** | Tanggal mulai - selesai harus ≥ 30 hari |
| 10 | **Dosen pembimbing = dosen prodi** | Tidak bisa pilih dosen dari prodi lain |
| 11 | **1 dosen max 10 bimbingan** | Jika dosen sudah full → error "Dosen penuh" |
| 12 | **Nomor surat unique** | Format: `001/UN7.5.10/PP/2025` (auto-increment) |
| 13 | **TTD digital required** | Wakil Dekan harus sign dengan digital signature |
| 14 | **History immutable** | ApprovalHistory tidak bisa diedit/delete (audit trail) |
| 15 | **Role-based queue** | Approver hanya lihat surat yang current step = role mereka |
| 16 | **Timeout 7 hari** | Jika tidak ada action dalam 7 hari → auto-reminder |
| 17 | **Cancel hanya PENDING** | Mahasiswa hanya bisa cancel surat yang status PENDING |
| 18 | **Resubmit inherit data** | Resubmit after revise → data lama pre-filled |

### Role & Permission

| Role | Bisa Lihat | Bisa Approve | Bisa Edit Master Data |
|------|-----------|--------------|----------------------|
| **Mahasiswa** | Surat sendiri | ❌ | ❌ |
| **Dosen Pembimbing** | Surat bimbingannya | ✅ Step 1 | ❌ |
| **Dosen Koordinator** | Surat prodi | ✅ Step 2 | ❌ |
| **Ketua Prodi** | Semua surat prodi | ✅ Step 3 | ✅ (Mahasiswa, Dosen) |
| **Admin** | Semua surat | ✅ Step 4 | ✅ (Semua) |
| **Supervisor Akademik** | Semua surat | ✅ Step 5 | ❌ |
| **Manajer TU** | Semua surat | ✅ Step 6 | ❌ |
| **Wakil Dekan** | Semua surat | ✅ Step 7 + TTD | ✅ (Read-only) |
| **UPA** | Semua surat | ✅ Step 8 (penomoran) | ❌ |

---

## 🛠️ Teknologi yang Digunakan

### Backend

| Teknologi | Versi | Untuk Apa |
|-----------|-------|-----------|
| **Bun** | v1.2.x | Runtime (pengganti Node.js, lebih cepat) |
| **Elysia.js** | v1.4.x | Web framework (seperti Express, tapi modern) |
| **Prisma ORM** | v6.19.x | Database ORM (interact dengan PostgreSQL) |
| **PostgreSQL** | v16 | Database relational |
| **Better-Auth** | v1.4.x | Authentication (login, JWT) |
| **Casbin** | v5.45.x | Authorization (RBAC - role-based access) |
| **MinIO** | Latest | File storage (S3-compatible) |
| **Biome** | Latest | Linter & formatter |

### Frontend

| Teknologi | Versi | Untuk Apa |
|-----------|-------|-----------|
| **Next.js** | v16.0.x | React framework (routing, SSR, SSG) |
| **React** | v19.2.x | UI library |
| **TypeScript** | v5.x | Type-safe JavaScript |
| **Tailwind CSS** | v4.x | Utility-first CSS framework |
| **shadcn/ui** | Latest | UI component library |
| **Zustand** | v5.0.x | State management (lebih simple dari Redux) |
| **React Hook Form** | Latest | Form handling |
| **Zod** | Latest | Schema validation |
| **Eden Treaty** | Latest | Type-safe API client (import types dari BE) |

### DevOps

| Teknologi | Untuk Apa |
|-----------|-----------|
| **Docker** | Containerization (database, storage, app) |
| **Docker Compose** | Orchestration (jalankan multiple containers) |
| **NGINX/Caddy** | Reverse proxy & load balancer |
| **Let's Encrypt** | Free SSL certificate (HTTPS) |

---

## 🚀 Cara Install

### Prerequisites

Install tools berikut di komputer:

**Windows:**
```
1. Bun         → https://bun.sh (Backend runtime)
2. Node.js 20+ → https://nodejs.org (Frontend build)
3. Docker      → https://docker.com (Database & storage)
4. Git         → https://git-scm.com (Version control)
```

**Linux/Mac:** Same tools, install via terminal/package manager

### Setup Development

**1. Clone Repository**
```
git clone <repository-url>
cd eoffice-PKL-monorepo
```

**2. Setup Backend**
```
cd e-office-api-v2
bun install                          # Install dependencies
docker compose -f docker-compose.dev.yml up -d  # Start DB & MinIO
bunx prisma generate                 # Generate Prisma Client
bunx prisma migrate dev              # Run migrations
bun run src/db/seed.ts               # Seed data
bun run dev                          # Start API server (port 3000)
```

**3. Setup Frontend**
```
cd ../e-office-webapp-v2
npm install                          # Install dependencies
npm run dev                          # Start dev server (port 3001)
```

**4. Test Login**
- Buka: http://localhost:3001
- Login dengan:
  - Email: `admin@undip.ac.id`
  - Password: `admin123`

### Database Management

**Prisma Commands:**
- `bunx prisma generate` - Generate Prisma Client (setelah ubah schema)
- `bunx prisma migrate dev` - Create & apply migration (development)
- `bunx prisma migrate deploy` - Apply migrations (production)
- `bunx prisma studio` - Open Prisma Studio (GUI database) → port 5555
- `bunx prisma migrate reset` - Reset database (⚠️ hapus semua data)

### Troubleshooting

| Problem | Solution |
|---------|----------|
| **Database connection failed** | Check Docker: `docker ps`, restart: `docker compose restart` |
| **Prisma Client not generated** | Run: `bunx prisma generate` |
| **Port already in use** | Kill process: Windows `netstat -ano \| findstr :3000`, Linux `lsof -i :3000` |
| **Module not found (Frontend)** | Run: `npm install` di folder frontend |
| **API calls fail (CORS)** | Check `NEXT_PUBLIC_API_URL` di `.env.local` |
| **Zustand state not persisting** | Check localStorage di DevTools → Application tab |

---

## 🚢 Production Deployment

### Option 1: Docker Compose (Recommended)

**Setup:**
1. Clone repository di server
2. Setup `.env` dengan production values (strong passwords, JWT secrets)
3. Run: `docker compose up -d`
4. Run migrations: `docker exec -it eoffice-api bunx prisma migrate deploy`
5. Setup NGINX reverse proxy untuk domain
6. Setup Let's Encrypt SSL

**NGINX Config:**
- Frontend (Next.js) → `localhost:3001`
- Backend API → `localhost:3000`
- MinIO (files) → `localhost:9000`

### Option 2: VPS Manual

**Backend:**
- Install Bun
- Install PM2: `npm install -g pm2`
- Start: `pm2 start bun --name eoffice-api -- run src/index.ts`

**Frontend:**
- Build: `npm run build`
- Start: `pm2 start npm --name eoffice-web -- start`

### Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 20 GB SSD | 50 GB SSD |
| **OS** | Ubuntu 22.04 | Ubuntu 24.04 LTS |

### Security Checklist

- [ ] Change all default passwords
- [ ] Use HTTPS (Let's Encrypt)
- [ ] Enable firewall (only ports 80, 443, 22)
- [ ] SSH key authentication (disable password)
- [ ] Strong JWT secrets (min 32 characters)
- [ ] Enable rate limiting
- [ ] Regular database backups
- [ ] Setup Cloudflare for DDoS protection

---

## ❓ FAQ

### Umum

**Q: Apa itu monorepo?**  
A: 1 repository untuk backend + frontend. Keuntungan: sharing types, atomic deployment, easier collaboration.

**Q: Kenapa pakai Bun, bukan Node.js?**  
A: Bun 3x lebih cepat dalam runtime & package installation, built-in TypeScript support, kompatibel dengan Node.js packages.

**Q: Apakah wajib pakai Docker?**  
A: Tidak wajib untuk development. Tapi sangat recommended untuk production (consistency).

**Q: Bisa deploy di shared hosting?**  
A: Tidak recommended. Butuh VPS/Cloud dengan Docker atau Node.js runtime.

### Development

**Q: Bagaimana cara add new approval step?**  
A: Update database schema (Prisma), update workflow logic di services, update frontend stepper, run migration.

**Q: Cara menambah jenis surat baru?**  
A: Tambah data di tabel `LetterType`, buat template JSON schema, clone folder PKL dan sesuaikan.

**Q: Zustand vs Redux?**  
A: Zustand untuk project kecil-menengah (lebih simple). Redux untuk project besar dengan complex state.

### Database

**Q: Cara reset database development?**  
A: `bunx prisma migrate reset` → hapus semua data & re-run migrations

**Q: Cara backup database production?**  
A: `docker exec eoffice-postgres pg_dump -U postgres eoffice_prod > backup.sql`

**Q: Apa itu migration?**  
A: SQL script untuk change database schema. Buat migration setiap ubah `schema.prisma`.

### Troubleshooting

**Q: Error "Prisma Client is not generated"**  
A: Run `bunx prisma generate` di folder backend.

**Q: Frontend tidak bisa connect ke backend (CORS error)**  
A: Check `NEXT_PUBLIC_API_URL` di `.env.local`, tambah CORS origin di backend.

**Q: Port already in use**  
A: Kill process: Windows `taskkill /PID <PID> /F`, Linux `kill -9 <PID>`

**Q: File upload gagal (413 Payload Too Large)**  
A: Increase limit di NGINX (`client_max_body_size 50M;`) dan Elysia (`bodyLimit`).

---

## 📞 Kontak Support

**Project Lead:** [Your Name]  
**Email:** eoffice@undip.ac.id  
**GitHub:** <repository-url>  
**Issues:** <repository-url>/issues

---

## 📄 License

MIT License

---

**Last Updated:** January 19, 2026  
**Version:** 1.0.0
