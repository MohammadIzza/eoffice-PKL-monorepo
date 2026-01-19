# 🎯 PANDUAN PENGGUNAAN ZUSTAND

## 📦 **Stores yang Tersedia**

### 1. **Auth Store** (`stores/authStore.ts`)
Menyimpan data user yang sedang login

### 2. **PKL Form Store** (`stores/pklFormStore.ts`)
Menyimpan data form multi-step PKL

---

## 🔥 **Cara Pakai Zustand**

### **1. Auth Store - Login & Logout**

#### **Login Page** (Set user & token)
```tsx
// app/(auth)/login/page.tsx
'use client';

import { useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const handleLogin = async () => {
    // Setelah API login berhasil
    const userData = {
      id: '1',
      name: 'Budi Santoso',
      email: 'budi@mail.com',
      roles: ['mahasiswa'],
    };

    setUser(userData);           // ← Simpan user
    setToken('abc123token');      // ← Simpan token
    
    router.push('/dashboard');    // Redirect ke dashboard
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

#### **Dashboard** (Ambil user data)
```tsx
// app/(dashboard)/page.tsx
'use client';

import { useAuthStore } from '@/stores';

export default function DashboardPage() {
  const { user } = useAuthStore();  // ← Ambil data user

  return (
    <div>
      <h1>Selamat datang, {user?.name}</h1>
      <p>Email: {user?.email}</p>
    </div>
  );
}
```

#### **Navbar** (Logout)
```tsx
// components/features/pkl/Navbar.tsx
'use client';

import { useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();                    // ← Clear user & token
    router.push('/login');        // Redirect ke login
  };

  return (
    <nav>
      <span>Halo, {user?.name}</span>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}
```

---

### **2. PKL Form Store - Multi-Step Form**

#### **Step 1: Identitas** (Simpan data)
```tsx
// app/(dashboard)/pengajuan/pkl/identitas/page.tsx
'use client';

import { usePKLFormStore } from '@/stores';
import { useRouter } from 'next/navigation';

export default function Step1() {
  const router = useRouter();
  const { setFormData, setCurrentStep } = usePKLFormStore();

  const handleNext = () => {
    // Simpan data Step 1
    setFormData({
      nim: '12345678',
      nama: 'Budi Santoso',
      email: 'budi@mail.com',
      departemen: 'Informatika',
    });

    setCurrentStep(2);  // Update step
    router.push('/dashboard/pengajuan/pkl/detail-pengajuan');
  };

  return <button onClick={handleNext}>Lanjut</button>;
}
```

#### **Step 2: Detail PKL** (Data Step 1 masih ada!)
```tsx
// app/(dashboard)/pengajuan/pkl/detail-pengajuan/page.tsx
'use client';

import { usePKLFormStore } from '@/stores';

export default function Step2() {
  const { formData, setFormData } = usePKLFormStore();

  // Data dari Step 1 masih ada!
  console.log(formData.nim);    // "12345678"
  console.log(formData.nama);   // "Budi Santoso"

  const handleNext = () => {
    // Tambah data Step 2 (data Step 1 tidak hilang)
    setFormData({
      tempatPKL: 'PT Telkom Indonesia',
      alamatPKL: 'Jl. Gatot Subroto Jakarta',
      durasiPKL: '3 bulan',
    });

    // Sekarang formData berisi:
    // {
    //   nim: '12345678',
    //   nama: 'Budi Santoso',
    //   tempatPKL: 'PT Telkom Indonesia',
    //   alamatPKL: 'Jl. Gatot Subroto Jakarta',
    //   durasiPKL: '3 bulan'
    // }
  };

  return <button onClick={handleNext}>Lanjut</button>;
}
```

#### **Step 4: Review** (Tampilkan semua data)
```tsx
// app/(dashboard)/pengajuan/pkl/review/page.tsx
'use client';

import { usePKLFormStore } from '@/stores';

export default function Step4Review() {
  const { formData, resetForm } = usePKLFormStore();

  const handleSubmit = async () => {
    // Submit semua data ke backend
    await fetch('/api/letter/submit', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    // Reset form setelah submit
    resetForm();  // ← Clear semua data
  };

  return (
    <div>
      <h2>Review Data</h2>
      <p>NIM: {formData.nim}</p>
      <p>Nama: {formData.nama}</p>
      <p>Tempat PKL: {formData.tempatPKL}</p>
      <p>Alamat PKL: {formData.alamatPKL}</p>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

---

## 🎨 **Keuntungan Zustand**

### **1. Data Persist (Tidak Hilang Saat Refresh)**
```tsx
// User login
setUser({ name: 'Budi' });

// Refresh browser F5
// Data masih ada! ✅

const { user } = useAuthStore();
console.log(user.name); // "Budi" masih ada!
```

### **2. Multi-Step Form (Data Tidak Hilang Pindah Step)**
```tsx
// Step 1: Isi NIM
setFormData({ nim: '123' });

// Navigate ke Step 2
router.push('/step2');

// Step 2: Data Step 1 masih ada!
const { formData } = usePKLFormStore();
console.log(formData.nim); // "123" ✅
```

### **3. Global Access (Tidak Perlu Props Drilling)**
```tsx
// ❌ Tanpa Zustand (props drilling)
<Page>
  <Navbar user={user} />
  <Sidebar user={user} />
  <Content user={user} />
</Page>

// ✅ Dengan Zustand (ambil langsung)
function Navbar() {
  const { user } = useAuthStore();
  return <div>{user.name}</div>;
}

function Sidebar() {
  const { user } = useAuthStore();
  return <div>{user.email}</div>;
}
```

---

## 📋 **API Zustand Store**

### **Auth Store**
```typescript
const { 
  user,              // Current user object
  token,             // Auth token
  setUser,           // Set user data
  setToken,          // Set token
  logout,            // Clear user & token
} = useAuthStore();
```

### **PKL Form Store**
```typescript
const { 
  currentStep,       // Current step number (1-5)
  formData,          // All form data
  setCurrentStep,    // Update step
  setFormData,       // Add/update form data
  resetForm,         // Clear all data
} = usePKLFormStore();
```

---

## 🔧 **Tips & Best Practices**

### ✅ **DO (Lakukan)**
```tsx
// 1. Pakai untuk data global
const { user } = useAuthStore();

// 2. Update data via setter
setUser({ name: 'Budi' });

// 3. Reset setelah submit
resetForm();
```

### ❌ **DON'T (Jangan)**
```tsx
// 1. Jangan mutate langsung
user.name = 'Budi'; // ❌ SALAH!

// 2. Jangan pakai untuk data lokal
const [search, setSearch] = useState(''); // ✅ Pakai useState

// 3. Jangan pakai untuk API data
const { data } = useLetters(); // ✅ Pakai React Query/SWR
```

---

## 🎯 **Kapan Pakai Zustand?**

| Use Case | Pakai Zustand? |
|----------|----------------|
| User login state | ✅ YES |
| Multi-step form data | ✅ YES |
| Theme (dark/light) | ✅ YES |
| Modal open/close | ❌ NO (pakai useState) |
| Search input | ❌ NO (pakai useState) |
| API data (list surat) | ❌ NO (pakai React Query) |

---

## 🚀 **Next Steps**

1. Test login/logout flow
2. Test multi-step form persistence
3. Integrate dengan backend API
4. Add loading states
5. Add error handling
