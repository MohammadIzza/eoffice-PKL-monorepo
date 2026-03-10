"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { withBasePath } from "@/lib/navigation";
import { Loader2 } from "lucide-react";

function SSOCallbackComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [error, setError] = useState<string | null>(null);
  
  // Access global state safely
  const logout = useAuthStore((state) => state.logout);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const processSSO = async () => {
      try {
        if (!token) {
          setError("Token SSO tidak ditemukan di parameter URL. Silakan kembali ke halaman login.");
          return;
        }

        // 1. Destroy lingering local sessions to avoid state conflicts
        logout();

        // 2. Hydrate Headers and Request User Profile from Internal Backend
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.137.58.124:20062";
        
        const response = await fetch(`${API_URL}/master/user/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil profil paska validasi SSO. Token mungkin kedaluwarsa.");
        }

        const data = await response.json();
        const userProfile = data.data || data;

        // 3. Persist Local Token + JSON Profile into Zustand Global Storage (and localStorage natively underneath)
        setAuth(userProfile, token);

        // 4. Force Push to Protected Inner Application securely resolving the Nginx proxy mask
        window.location.href = withBasePath("/dashboard");
        
      } catch (err: any) {
        console.error("SSO Callback processing failed:", err);
        setError(err.message || "Terjadi kesalahan internal ketika membongkar sesi SSO.");
      }
    };

    processSSO();
  }, [token, router, logout, setAuth]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      {error ? (
        <div className="bg-red-50 p-6 rounded-lg shadow-sm border border-red-100 max-w-md text-center">
          <h2 className="text-red-600 font-bold mb-2">Autentikasi Gagal</h2>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button 
            onClick={() => router.push(withBasePath("/login"))}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
          >
            Kembali ke Login
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <h2 className="text-lg font-semibold text-slate-700 animate-pulse">
            Mengonfirmasi identitas SSO...
          </h2>
          <p className="text-xs text-slate-500">
            Sedang membangun sesi Anda secara aman. Jangan tutup halaman ini.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">Memuat Sistem Keamanan...</h2>
        </div>
      }
    >
      <SSOCallbackComponent />
    </Suspense>
  )
}
