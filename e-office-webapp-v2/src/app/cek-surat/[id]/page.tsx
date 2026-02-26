import { API_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, FileText, ShieldCheck, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

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
      return { label: "Diajukan", color: "text-blue-600", bg: "bg-blue-50", icon: FileText };
    case "APPROVED":
      return { label: "Disetujui", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2 };
    case "REJECTED":
      return { label: "Ditolak", color: "text-red-600", bg: "bg-red-50", icon: XCircle };
    case "REVISED":
      return { label: "Perlu Revisi", color: "text-orange-600", bg: "bg-orange-50", icon: Clock };
    case "SELF_REVISED":
      return { label: "Direvisi Mahasiswa", color: "text-blue-600", bg: "bg-blue-50", icon: FileText };
    case "SIGNED":
      return { label: "Ditandatangani Digital", color: "text-emerald-600", bg: "bg-emerald-50", icon: BadgeCheck };
    case "NUMBERED":
      return { label: "Selesai & Bernomor", color: "text-teal-600", bg: "bg-teal-50", icon: CheckCircle2 };
    default:
      return { label: action, color: "text-gray-600", bg: "bg-gray-50", icon: Clock };
  }
};

const formatRole = (role: string) => {
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

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
        return (
            <div className="flex h-screen items-center justify-center bg-[#FBFBFD]">
                <p className="text-red-500 font-medium">Terjadi kesalahan saat memuat data dokumen.</p>
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
        <div className="flex h-screen items-center justify-center bg-[#FBFBFD]">
            <p className="text-red-500 font-medium">Gagal menghubungi server.</p>
        </div>
    )
  }

  if (!letter) return notFound();

  // Cek apakah surat sudah selesai/valid
  const isCompleted = letter.status === "COMPLETED" || letter.numbering !== null;

  return (
    <div className="min-h-screen bg-[#FBFBFD] py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-100">
      <div className="mx-auto max-w-2xl">
        
        {/* Verification Banner */}
        <div className="mb-8 text-center flex flex-col items-center">
            <div className="relative mb-6">
                 <div className="absolute -inset-1 rounded-full bg-emerald-100 blur-md opacity-70"></div>
                 <div className="relative bg-white p-4 rounded-full shadow-sm ring-1 ring-emerald-900/5">
                    <ShieldCheck className="w-12 h-12 text-emerald-500" />
                 </div>
            </div>
            
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Dokumen Resmi Terverifikasi
            </h1>
            <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Surat ini diterbitkan secara sah dan terekam dalam sistem elektronik 
                <span className="font-semibold text-gray-900"> Fakultas Sains dan Matematika, Universitas Diponegoro</span>.
            </p>
        </div>

        {/* Document Details Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-900/5 mb-6">
            <div className="px-6 py-8 sm:px-10 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Image 
                        src={logoSrc}
                        alt="Logo Undip" 
                        width={48} 
                        height={48} 
                        className="h-12 w-auto drop-shadow-sm"
                    />
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-gray-900">Detail Dokumen</h2>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-0.5">Informasi Publik</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50/30 px-6 py-8 sm:px-10">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                    {letter.numbering && (
                        <div className="sm:col-span-2 bg-white p-5 rounded-2xl ring-1 ring-gray-900/5 shadow-sm border-l-4 border-emerald-500">
                             <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Nomor Registrasi Surat</dt>
                             <dd className="text-xl font-bold tracking-tight text-gray-900 font-mono">{letter.numbering.numberString}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Jenis Layanan</dt>
                        <dd className="mt-2 text-sm font-medium text-gray-900">{letter.letterType.name}</dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pemohon</dt>
                        <dd className="mt-2 text-sm font-medium text-gray-900">{letter.createdBy.name}</dd>
                    </div>
                     <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tanggal Terbit</dt>
                        <dd className="mt-2 text-sm font-medium text-gray-900">
                             {format(new Date(letter.createdAt), "d MMMM yyyy", { locale: localeId })}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status Validasi</dt>
                        <dd className="mt-2">
                            <span className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                                isCompleted 
                                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-600/20" 
                                    : "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-600/20"
                            )}>
                                {isCompleted ? "SAH & BERLAKU" : "DALAM PROSES"}
                            </span>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>

        {/* Audit Trail / Timeline Card */}
        <div className="rounded-3xl bg-white shadow-sm ring-1 ring-gray-900/5 p-6 sm:p-10">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 mb-8 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-gray-400" />
                Jejak Audit Penerbitan
            </h2>
            <div className="flow-root">
                <ul role="list" className="-mb-8">
                    {letter.stepHistory.map((step, stepIdx) => {
                         const meta = getActionMeta(step.action);
                         const Icon = meta.icon;
                         
                        return (
                        <li key={step.id}>
                            <div className="relative pb-8">
                                {stepIdx !== letter!.stepHistory.length - 1 ? (
                                    <span className="absolute left-[1.125rem] top-8 -ml-px h-full w-[2px] bg-gray-100 rounded-full" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex items-start space-x-4">
                                    <div className="relative">
                                        <span className={cn("flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white shadow-sm", meta.bg)}>
                                            <Icon className={cn("h-4 w-4", meta.color)} aria-hidden="true" />
                                        </span>
                                    </div>
                                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {meta.label} <span className="text-gray-400 font-normal mx-1">oleh</span> <span className="font-semibold">{step.actor.name}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">
                                                {formatRole(step.actorRole)}
                                            </p>
                                            {step.comment && (
                                                <div className="mt-3 text-sm text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 leading-relaxed">
                                                    "{step.comment}"
                                                </div>
                                            )}
                                        </div>
                                        <div className="whitespace-nowrap text-right text-xs font-medium text-gray-400">
                                            {format(new Date(step.createdAt), "d MMM yyyy", { locale: localeId })}
                                            <br />
                                            <span className="text-gray-300">{format(new Date(step.createdAt), "HH:mm", { locale: localeId })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    )})}
                </ul>
            </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
                Sistem e-Office Fakultas Sains dan Matematika<br/>
                Universitas Diponegoro © {new Date().getFullYear()}
            </p>
        </div>

      </div>
    </div>
  );
}