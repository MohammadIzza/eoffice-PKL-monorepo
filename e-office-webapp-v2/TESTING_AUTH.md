# Testing Authentication Flow

## Prerequisites

1. Backend server running di `http://localhost:3000` (atau sesuai `PORT` di config)
2. Database sudah di-seed dengan test users
3. Frontend running di `http://localhost:3000` (Next.js default)

## Test Users

Test users yang tersedia (dari seed):
- `mahasiswa.test@students.undip.ac.id` / `password1234`
- `dospem.test@lecturer.undip.ac.id` / `password1234`
- `koordinator.test@lecturer.undip.ac.id` / `password1234`
- `kaprodi.test@lecturer.undip.ac.id` / `password1234`
- `admin.fakultas@fsm.undip.ac.id` / `password1234`
- `supervisor.test@fsm.undip.ac.id` / `password1234`
- `manajer.tu@fsm.undip.ac.id` / `password1234`
- `wakil.dekan1@fsm.undip.ac.id` / `password1234`
- `upa@fsm.undip.ac.id` / `password1234`

## Manual Testing Steps

### 1. Test Login Flow

1. Buka browser ke `http://localhost:3000/login`
2. Masukkan email: `mahasiswa.test@students.undip.ac.id`
3. Masukkan password: `password1234`
4. Click "Login"
5. **Expected**: 
   - Redirect ke `/dashboard`
   - User data tersimpan di Zustand store
   - Cookies di-set oleh browser (cek di DevTools > Application > Cookies)

### 2. Test Session Persistence

1. Setelah login, refresh page (F5)
2. **Expected**: 
   - User tetap logged in
   - Tidak redirect ke login
   - User data masih ada di store

### 3. Test Protected Routes

1. Setelah login, akses protected route (misalnya `/dashboard`)
2. **Expected**: 
   - Page load tanpa redirect
   - Loading state muncul saat check session
   - User data tersedia

### 4. Test Role-Based Access

1. Login sebagai mahasiswa
2. Coba akses route yang require role berbeda (misalnya `requiredRole="dosen_pembimbing"`)
3. **Expected**: 
   - Show "Akses Ditolak" message
   - Tidak bisa akses content

### 5. Test Logout

1. Click logout button (jika ada)
2. Atau call `logout()` dari useAuth hook
3. **Expected**: 
   - Cookies cleared
   - User state cleared dari store
   - Redirect ke login page

### 6. Test Unauthorized Access

1. Clear cookies (DevTools > Application > Cookies > Clear)
2. Atau logout
3. Coba akses protected route
4. **Expected**: 
   - Redirect ke `/login`
   - Loading state muncul saat check session

## Browser DevTools Testing

### Check Cookies

1. Open DevTools (F12)
2. Go to Application > Cookies
3. **Expected**: 
   - Better Auth session cookies ada (biasanya `better-auth.session_token` atau similar)
   - Cookies set dengan `HttpOnly`, `Secure` (jika HTTPS), `SameSite`

### Check Network Requests

1. Open DevTools > Network tab
2. Login
3. **Expected**: 
   - `POST /public/sign-in` → 200 OK
   - Response headers include `Set-Cookie`
   - `GET /me` → 200 OK (setelah login)
   - Response include user data dengan roles, mahasiswa/pegawai

### Check Zustand Store

1. Install Redux DevTools extension (Zustand compatible)
2. After login, check store state
3. **Expected**: 
   - `user` object populated
   - `isLoading: false`
   - `error: null`

## Automated Testing (Backend)

Run backend test script:

```bash
cd e-office-api-v2
bun run helper/testAuth.ts
```

**Expected Output:**
- ✅ POST /public/sign-in
- ✅ GET /me (with cookies)
- ✅ GET /me (without cookies) - should fail
- ✅ POST /api/auth/sign-out
- ✅ GET /me (after logout) - should fail
- ✅ Login as multiple users
- ✅ All tests passed

## Common Issues

### Issue: Login tidak redirect
**Solution**: 
- Check apakah `useAuth.login()` throw error
- Check console untuk error messages
- Verify backend response structure

### Issue: Session tidak persist setelah refresh
**Solution**: 
- Check cookies di DevTools
- Verify `credentials: "include"` di fetch requests
- Check CORS settings di backend

### Issue: Protected route selalu redirect
**Solution**: 
- Check `/me` endpoint response
- Verify cookies dikirim dengan request
- Check `checkSession` di authStore

### Issue: Role-based access tidak bekerja
**Solution**: 
- Verify user punya role yang benar
- Check `/me` response include roles array
- Verify role name match dengan `requiredRole` prop

## Test Checklist

- [ ] Login dengan valid credentials
- [ ] Login dengan invalid credentials (error handling)
- [ ] Session persist setelah refresh
- [ ] Protected routes accessible setelah login
- [ ] Protected routes redirect jika not logged in
- [ ] Role-based access control bekerja
- [ ] Logout clear cookies dan state
- [ ] Cannot access protected routes setelah logout
- [ ] Loading states muncul dengan benar
- [ ] Error messages display dengan benar
