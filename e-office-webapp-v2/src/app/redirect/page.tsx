"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { withBasePath } from "@/lib/navigation";
import { authService } from "@/services";
import { Loader2 } from "lucide-react";

function RedirectComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const process = async () => {
      try {
        if (!token) {
          setError("Token tidak ditemukan. Silakan login kembali.");
          return;
        }

        const userProfile = await authService.getMe(token);
        setAuth(userProfile, token);
        window.location.href = withBasePath("/dashboard");
      } catch (err: any) {
        console.error("SSO redirect processing failed:", err);
        setError(err.message || "Terjadi kesalahan saat memproses sesi SSO.");
      }
    };

    process();
  }, [token, setAuth]);

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

export default function RedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <h2 className="mt-4 text-lg font-semibold text-slate-700">
            Memuat...
          </h2>
        </div>
      }
    >
      <RedirectComponent />
    </Suspense>
  );
}
