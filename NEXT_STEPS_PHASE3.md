# 🎯 NEXT STEPS - Phase 3 Frontend Integration

## ✅ **Status Saat Ini**

### **Phase 3.2: Authentication Integration** - ✅ **SELESAI**
- ✅ Backend: `/me`, `/public/sign-in`, `/public/sign-out`
- ✅ Frontend: authStore, authService, useAuth, ProtectedRoute, login page
- ✅ Testing: All 8 tests passed

### **Backend Status** - ✅ **LENGKAP**
- ✅ Letter endpoints: submit, queue, approve, reject, revise, cancel, numbering, preview, dll
- ✅ Master data: user, mahasiswa, departemen, suratType, suratTemplate
- ❌ **Missing**: programStudi endpoint, dosenPembimbing endpoint

### **Frontend Status** - ⚠️ **PERLU INTEGRASI**
- ✅ Authentication flow (login/logout)
- ❌ Master data integration (program studi, dosen pembimbing)
- ❌ PKL form integration (connect dengan backend)
- ❌ Letter management (list, detail, queue, approval)

---

## 📋 **RENCANA PHASE 3.3 - 3.5**

### **Phase 3.3: Master Data Integration** 🔄 **NEXT**

**Goal:** Frontend bisa fetch master data untuk form (program studi, dosen pembimbing)

**Tasks:**

#### **Backend (Missing Endpoints)**
1. ✅ Create `GET /master/program-studi/all` endpoint
   - Return semua program studi dengan code & name
   - File: `e-office-api-v2/src/routes/master/programStudi.ts`

2. ✅ Create `GET /master/dosen-pembimbing/all` endpoint
   - Return semua dosen pembimbing (pegawai dengan role dosen_pembimbing)
   - Optional query: `?prodiId=xxx` untuk filter by prodi
   - File: `e-office-api-v2/src/routes/master/dosenPembimbing.ts`

#### **Frontend (Services & Hooks)**
3. ✅ Create `masterDataService.ts`
   - `getProgramStudi()` - fetch program studi
   - `getDosenPembimbing(prodiId?)` - fetch dosen pembimbing

4. ✅ Create `useMasterData.ts` hook
   - Wrapper untuk masterDataService dengan caching
   - Loading & error states

5. ✅ Update PKL form components
   - `Step1identitas.tsx` - use master data untuk dropdown prodi & dosen pembimbing
   - Auto-fill dari user.mahasiswa jika ada

**Acceptance Criteria:**
- ✅ Form bisa load program studi dari backend
- ✅ Form bisa load dosen pembimbing (filter by prodi)
- ✅ Dropdown working dengan data real

---

### **Phase 3.4: PKL Form Integration** 📝

**Goal:** Form PKL bisa submit ke backend dan save draft

**Tasks:**

1. ✅ Create `letterService.ts`
   - `submitPKL(prodiId, dosenPembimbingUserId, formData)` - submit form
   - `getMyLetters()` - get user's letters
   - `getLetterDetail(id)` - get letter detail

2. ✅ Update `pklFormStore.ts`
   - Add `submit()` action - call letterService
   - Add `saveDraft()` action - save to localStorage (optional)
   - Add `loadDraft()` action - load from localStorage

3. ✅ Update form components
   - `Step4Review.tsx` - add submit button, call store.submit()
   - Handle success/error responses
   - Redirect to status page after submit

4. ✅ Update `Step5Status.tsx`
   - Fetch letter detail from backend
   - Show timeline/history
   - Show current step & status

**Acceptance Criteria:**
- ✅ Form bisa submit ke backend
- ✅ Submit berhasil create letter dengan status PROCESSING
- ✅ Status page menampilkan data real dari backend

---

### **Phase 3.5: Letter Management Integration** 📋

**Goal:** User bisa lihat list surat, detail, dan approver bisa approve/reject/revise

**Tasks:**

1. ✅ Create `letterQueueService.ts`
   - `getQueue(activeRole)` - get queue untuk role tertentu
   - `approve(id, comment?)` - approve letter
   - `reject(id, comment)` - reject letter
   - `revise(id, comment)` - revise letter

2. ✅ Update letter list page
   - `app/(dashboard)/surat/page.tsx` - fetch dari `/letter/my`
   - Show status, current step, created date

3. ✅ Update letter detail page
   - `app/(dashboard)/surat/[id]/page.tsx` - fetch dari `/letter/:id`
   - Show full timeline, attachments, numbering
   - Show action buttons (approve/reject/revise) jika user adalah assignee

4. ✅ Update approver queue page
   - `app/(dashboard)/dosen/surat-masuk/page.tsx` - fetch dari `/letter/queue?activeRole=xxx`
   - Show queue dengan filter by role
   - Quick actions (approve/reject/revise)

**Acceptance Criteria:**
- ✅ List surat menampilkan data real
- ✅ Detail surat menampilkan timeline & history
- ✅ Approver bisa approve/reject/revise dari UI
- ✅ Status update real-time setelah action

---

## 🚀 **PRIORITAS IMPLEMENTASI**

### **Urutan yang Disarankan:**

1. **Phase 3.3** (Master Data) - **PALING PENTING**
   - Tanpa ini, form tidak bisa diisi dengan benar
   - Quick win (2 endpoints + service)

2. **Phase 3.4** (Form Integration) - **PENTING**
   - Core functionality: submit form
   - Tanpa ini, user tidak bisa submit surat

3. **Phase 3.5** (Letter Management) - **PENTING**
   - Core functionality: approve/reject/revise
   - Tanpa ini, workflow tidak bisa jalan

---

## 📝 **DETAIL TASK BREAKDOWN**

### **Phase 3.3.1: Backend - Program Studi Endpoint**

```typescript
// e-office-api-v2/src/routes/master/programStudi.ts
export default new Elysia()
  .use(authGuardPlugin)
  .get("/all", async () => {
    const prodi = await Prisma.programStudi.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    });
    return { success: true, data: prodi };
  });
```

### **Phase 3.3.2: Backend - Dosen Pembimbing Endpoint**

```typescript
// e-office-api-v2/src/routes/master/dosenPembimbing.ts
export default new Elysia()
  .use(authGuardPlugin)
  .get("/all", async ({ query }) => {
    // Filter by prodiId jika ada
    const where: any = {
      pegawai: {
        user: {
          userRole: {
            some: {
              role: { name: "dosen_pembimbing" },
            },
          },
        },
      },
    };
    
    if (query.prodiId) {
      where.pegawai.programStudiId = query.prodiId;
    }
    
    const dosen = await Prisma.user.findMany({
      where,
      include: {
        pegawai: {
          include: {
            programStudi: true,
          },
        },
      },
    });
    
    return { success: true, data: dosen };
  });
```

### **Phase 3.3.3: Frontend - Master Data Service**

```typescript
// e-office-webapp-v2/src/services/masterData.service.ts
import { client } from '@/lib/api';

export const masterDataService = {
  getProgramStudi: async () => {
    const response = await client.master['program-studi'].all.get();
    return response.data?.data || [];
  },
  
  getDosenPembimbing: async (prodiId?: string) => {
    const params = prodiId ? { prodiId } : {};
    const response = await client.master['dosen-pembimbing'].all.get(params);
    return response.data?.data || [];
  },
};
```

---

## ✅ **CHECKLIST PROGRESS**

### **Phase 3.3: Master Data Integration**
- [ ] Backend: Program Studi endpoint
- [ ] Backend: Dosen Pembimbing endpoint
- [ ] Frontend: masterDataService
- [ ] Frontend: useMasterData hook
- [ ] Frontend: Update Step1identitas component

### **Phase 3.4: PKL Form Integration**
- [ ] Frontend: letterService
- [ ] Frontend: Update pklFormStore
- [ ] Frontend: Update Step4Review (submit)
- [ ] Frontend: Update Step5Status (fetch detail)

### **Phase 3.5: Letter Management Integration**
- [ ] Frontend: letterQueueService
- [ ] Frontend: Update surat list page
- [ ] Frontend: Update surat detail page
- [ ] Frontend: Update approver queue page

---

## 🎯 **REKOMENDASI: MULAI DARI PHASE 3.3**

**Alasan:**
1. ✅ Quick win - hanya 2 endpoint + service
2. ✅ Critical path - form tidak bisa diisi tanpa master data
3. ✅ Low risk - tidak mengubah existing code banyak
4. ✅ Foundation - diperlukan untuk Phase 3.4

**Estimasi waktu:** 1-2 jam

**Next command setelah selesai:**
```bash
# Test master data endpoints
cd e-office-api-v2
bun run helper/testMasterData.ts  # (akan dibuat)

# Test frontend integration
cd e-office-webapp-v2
npm run dev
# Buka form PKL, cek dropdown program studi & dosen pembimbing
```

---

**Ready to start Phase 3.3?** 🚀
