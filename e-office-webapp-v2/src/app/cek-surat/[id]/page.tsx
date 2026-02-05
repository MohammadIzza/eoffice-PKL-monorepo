import { API_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, FileText, User } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

// Define TypeScript interfaces for the response data
interface StepHistory {
  id: string;
  action: string;
  step: number | null;
  actorRole: string;
  comment: string | null;
  createdAt: string;
  actor: {
    name: string;
  };
}

interface LetterData {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  signedAt: string | null;
  signatureUrl: string | null;
  letterType: {
    name: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
  numbering: {
    numberString: string;
    date: string;
  } | null;
  stepHistory: StepHistory[];
}

interface ApiResponse {
  success: boolean;
  data: LetterData;
}

// Map actions to friendly text and colors
const getActionMeta = (action: string) => {
  switch (action) {
    case "SUBMITTED":
      return { label: "Diajukan", color: "text-blue-600", bg: "bg-blue-100", icon: FileText };
    case "APPROVED":
      return { label: "Disetujui", color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 };
    case "REJECTED":
      return { label: "Ditolak", color: "text-red-600", bg: "bg-red-100", icon: XCircle };
    case "REVISED":
      return { label: "Perlu Revisi", color: "text-orange-600", bg: "bg-orange-100", icon: Clock };
    case "SELF_REVISED":
      return { label: "Direvisi Mahasiswa", color: "text-blue-600", bg: "bg-blue-100", icon: FileText };
    case "SIGNED":
      return { label: "Ditandatangani", color: "text-green-600", bg: "bg-green-100", icon: CheckCircle2 };
    case "NUMBERED":
      return { label: "Selesai & Bernomor", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle2 };
    default:
      return { label: action, color: "text-gray-600", bg: "bg-gray-100", icon: Clock };
  }
};

const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

import fs from "fs";
import path from "path";

// ... existing code ...

export default async function TrackLetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Read logo from file system (public/Undip.b64)
  const logoPath = path.join(process.cwd(), "public", "Undip.b64");
  let logoSrc = "/Undip.b64"; // Default fallback
  
  try {
    if (fs.existsSync(logoPath)) {
        const base64Data = fs.readFileSync(logoPath, "utf-8").trim();
        // Remove header/footer if present (e.g., -----BEGIN CERTIFICATE-----)
        const cleanBase64 = base64Data.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n|\r/g, "");
        logoSrc = `data:image/png;base64,${cleanBase64}`;
    }
  } catch (e) {
      console.error("Failed to load logo from file", e);
  }

  // Fetch data
  let letter: LetterData | null = null;

  try {
    const res = await fetch(`${API_URL}/public/letters/${id}/history`, {
      cache: "no-store",
    });

    if (!res.ok) {
        if (res.status === 404) notFound();
        // Handle other errors gracefully
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-red-500">Terjadi kesalahan saat memuat data surat.</p>
            </div>
        )
    }

    const json = (await res.json()) as ApiResponse;
    if (json.success) {
      letter = json.data;
    }
  } catch (error) {
    console.error("Error fetching letter history:", error);
    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-red-500">Gagal menghubungi server.</p>
        </div>
    )
  }

  if (!letter) return notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        
        {/* Header Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow-md mb-8">
            <div className="px-6 py-8 sm:p-10 text-center">
                <Image 
                    src={logoSrc}
                    alt="Logo Undip" 
                    width={80} 
                    height={80} 
                    className="mx-auto h-20 w-auto mb-4"
                />
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    Lacak Status Surat
                </h1>
                <p className="mt-2 text-gray-600">
                    Sistem Pelayanan Surat & Administrasi
                </p>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 sm:px-10">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Jenis Surat</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">{letter.letterType.name}</dd>
                    </div>
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Diajukan Oleh</dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">{letter.createdBy.name}</dd>
                    </div>
                    {letter.numbering && (
                        <div className="sm:col-span-2">
                             <dt className="text-sm font-medium text-gray-500">Nomor Surat</dt>
                             <dd className="mt-1 text-lg font-bold text-emerald-600">{letter.numbering.numberString}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-sm font-medium text-gray-500">Status Terakhir</dt>
                        <dd className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {letter.status}
                        </dd>
                    </div>
                     <div>
                        <dt className="text-sm font-medium text-gray-500">Tanggal Pengajuan</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                             {format(new Date(letter.createdAt), "d MMMM yyyy", { locale: localeId })}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>

        {/* Timeline */}
        <div className="rounded-lg bg-white shadow-md p-6 sm:p-10">
            <h2 className="text-lg font-medium text-gray-900 mb-6 border-b pb-2">Riwayat Proses</h2>
            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {letter.stepHistory.map((step, stepIdx) => {
                         const meta = getActionMeta(step.action);
                         const Icon = meta.icon;
                         
                        return (
                        <li key={step.id}>
                            <div className="relative pb-8">
                                {stepIdx !== letter!.stepHistory.length - 1 ? (
                                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                    <div>
                                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white", meta.bg)}>
                                            <Icon className={cn("h-5 w-5", meta.color)} aria-hidden="true" />
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium tracking-tight">
                                                {meta.label} <span className="text-gray-500 font-normal">oleh</span> <span className="font-semibold">{step.actor.name}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formatRole(step.actorRole)}
                                            </p>
                                            {step.comment && (
                                                <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 italic">
                                                    "{step.comment}"
                                                </div>
                                            )}
                                        </div>
                                        <div className="whitespace-nowrap text-right text-xs text-gray-500">
                                            {format(new Date(step.createdAt), "d MMM yyyy", { locale: localeId })}
                                            <br />
                                            {format(new Date(step.createdAt), "HH:mm", { locale: localeId })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    )})}
                </ul>
            </div>
        </div>

      </div>
    </div>
  );
}
