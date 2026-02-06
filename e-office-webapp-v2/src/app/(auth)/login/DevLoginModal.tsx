
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, User, GraduationCap, School, FileText, UserCheck, Users, Building, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipe data user mockup
type DevUser = {
  name: string;
  email: string;
  role: string;
  dept?: string;
  nim_nip?: string;
};

// DATA DUMMY LENGKAP dari seed.ts
const DATA_USERS: Record<string, DevUser[]> = {
  mahasiswa: [
    { name: "Budi Santoso", email: "mahasiswa.informatika@students.undip.ac.id", role: "mahasiswa", dept: "Informatika", nim_nip: "240601..." },
    { name: "Siti Aminah", email: "mahasiswa2.informatika@students.undip.ac.id", role: "mahasiswa", dept: "Informatika", nim_nip: "240601..." },
    { name: "Rina Amelia", email: "mahasiswa.biologi@students.undip.ac.id", role: "mahasiswa", dept: "Biologi", nim_nip: "240201..." },
    { name: "Andi Mahardika", email: "mahasiswa.matematika@students.undip.ac.id", role: "mahasiswa", dept: "Matematika", nim_nip: "240101..." },
    { name: "Eka Kurnia", email: "mahasiswa.kimia@students.undip.ac.id", role: "mahasiswa", dept: "Kimia", nim_nip: "240301..." },
    { name: "Iwan Hermawan", email: "mahasiswa.fisika@students.undip.ac.id", role: "mahasiswa", dept: "Fisika", nim_nip: "240401..." },
    { name: "Mona Berlian", email: "mahasiswa.statistika@students.undip.ac.id", role: "mahasiswa", dept: "Statistika", nim_nip: "240503..." },
    { name: "Qori Bukhori", email: "mahasiswa.bioteknologi@students.undip.ac.id", role: "mahasiswa", dept: "Bioteknologi", nim_nip: "240202..." },
  ],
  dospem: [
    { name: "Dr. Ahmad", email: "dospem.informatika@lecturer.undip.ac.id", role: "dosen_pembimbing", dept: "Informatika" },
    { name: "Dr. Bambang", email: "dospem.biologi@lecturer.undip.ac.id", role: "dosen_pembimbing", dept: "Biologi" },
    { name: "Dr. Budi", email: "dospem.matematika@lecturer.undip.ac.id", role: "dosen_pembimbing", dept: "Matematika" },
    { name: "Dr. Fajar", email: "dospem.kimia@lecturer.undip.ac.id", role: "dosen_pembimbing", dept: "Kimia" },
    { name: "Dr. Joko", email: "dospem.fisika@lecturer.undip.ac.id", role: "dosen_pembimbing", dept: "Fisika" },
    { name: "Dr. Nuri", email: "dospem.statis@lecturer.undip.ac.id", role: "dosen_pembimbing", dept: "Statistika" },
    { name: "Dr. Rara", email: "dospem.bioteknologi@lecturer.undip.ac.id", role: "dosen_pembimbing", dept: "Bioteknologi" },
  ],
  koor: [
    { name: "Prof. Siti", email: "koordinator.informatika@lecturer.undip.ac.id", role: "dosen_koordinator", dept: "Informatika" },
    { name: "Prof. Kurnia", email: "koordinator.biologi@lecturer.undip.ac.id", role: "dosen_koordinator", dept: "Biologi" },
    { name: "Prof. Citra", email: "koordinator.matematika@lecturer.undip.ac.id", role: "dosen_koordinator", dept: "Matematika" },
    { name: "Prof. Gading", email: "koordinator.kimia@lecturer.undip.ac.id", role: "dosen_koordinator", dept: "Kimia" },
    { name: "Prof. Kiki", email: "koordinator.fisika@lecturer.undip.ac.id", role: "dosen_koordinator", dept: "Fisika" },
    { name: "Prof. Oki", email: "koordinator.statistika@lecturer.undip.ac.id", role: "dosen_koordinator", dept: "Statistika" },
    { name: "Prof. Soni", email: "koordinator.bioteknologi@lecturer.undip.ac.id", role: "dosen_koordinator", dept: "Bioteknologi" },
  ],
  kaprodi: [
    { name: "Dr. Aris", email: "kaprodi.informatika@lecturer.undip.ac.id", role: "ketua_program_studi", dept: "Informatika" },
    { name: "Dr. Kartini", email: "kaprodi.biologi@lecturer.undip.ac.id", role: "ketua_program_studi", dept: "Biologi" },
    { name: "Dr. Doni", email: "kaprodi.matematika@lecturer.undip.ac.id", role: "ketua_program_studi", dept: "Matematika" },
    { name: "Dr. Hana", email: "kaprodi.kimia@lecturer.undip.ac.id", role: "ketua_program_studi", dept: "Kimia" },
    { name: "Dr. Limo", email: "kaprodi.fisika@lecturer.undip.ac.id", role: "ketua_program_studi", dept: "Fisika" },
    { name: "Dr. Piyu", email: "kaprodi.statistika@lecturer.undip.ac.id", role: "ketua_program_studi", dept: "Statistika" },
    { name: "Dr. Tio", email: "kaprodi.bioteknologi@lecturer.undip.ac.id", role: "ketua_program_studi", dept: "Bioteknologi" },
  ],
  adminfakultas: [
    { name: "Budi Admin Fak", email: "admin.fakultas@fsm.undip.ac.id", role: "admin_fakultas" },
    { name: "Super Admin", email: "superadmin@fsm.internal", role: "superadmin" },
    { name: "Admin Sistem", email: "admin@university.ac.id", role: "admin_system" },
  ],
  supervisor: [
    { name: "Dr. Retno", email: "supervisor.test@fsm.undip.ac.id", role: "supervisor_akademik" },
  ],
  manajer_tu: [
    { name: "Siti Manajer TU", email: "manajer.tu@fsm.undip.ac.id", role: "manajer_tu" },
  ],
  wakildekan: [
    { name: "Prof. Bambang", email: "wakil.dekan1@fsm.undip.ac.id", role: "wakil_dekan_1" },
  ],
  upa: [
    { name: "Dewi UPA", email: "upa@fsm.undip.ac.id", role: "upa" },
  ],
};

const ROLES = [
  { id: "mahasiswa", label: "Mahasiswa", icon: GraduationCap },
  { id: "dospem", label: "Dospem", icon: UserCheck },
  { id: "koor", label: "Koor PKL", icon: Users },
  { id: "kaprodi", label: "Kaprodi", icon: School },
  { id: "adminfakultas", label: "Admin Fak", icon: Building },
  { id: "supervisor", label: "Supervisor", icon: Shield },
  { id: "manajer_tu", label: "Manajer TU", icon: FileText },
  { id: "wakildekan", label: "Wakil Dekan", icon: User },
  { id: "upa", label: "UPA", icon: Lock },
];

interface DevLoginModalProps {
  onLogin: (email: string) => void;
  isLoading: boolean;
}

export function DevLoginModal({ onLogin, isLoading }: DevLoginModalProps) {
  const [open, setOpen] = useState(false);
  const [activeRole, setActiveRole] = useState("mahasiswa");

  const handleSelect = (email: string) => {
    onLogin(email);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2 border-dashed text-slate-500 mt-4">
            <Shield className="w-4 h-4" />
            Login Cepat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Developer Quick Login</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar / Vertical Tab List */}
            <div className="w-48 bg-slate-50 dark:bg-slate-900 border-r overflow-y-auto py-2">
                {ROLES.map((role) => {
                    const Icon = role.icon;
                    const count = DATA_USERS[role.id]?.length || 0;
                    return (
                        <button
                            key={role.id}
                            onClick={() => setActiveRole(role.id)}
                            className={cn(
                                "w-full text-left px-4 py-3 text-sm font-medium flex items-center justify-between transition-colors",
                                activeRole === role.id 
                                    ? "bg-white dark:bg-slate-800 text-indigo-600 border-l-4 border-indigo-600 shadow-sm" 
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {role.label}
                            </span>
                            <Badge variant="secondary" className="text-[10px] px-1 h-5 min-w-[20px] justify-center">{count}</Badge>
                        </button>
                    )
                })}
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col">
                <div className="p-4 bg-slate-50/50 border-b">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        {ROLES.find(r => r.id === activeRole)?.icon && (() => {
                            const Icon = ROLES.find(r => r.id === activeRole)!.icon;
                            return <Icon className="w-4 h-4 text-muted-foreground" />
                        })()}
                        Daftar Akun: <span className="text-indigo-600">{ROLES.find(r => r.id === activeRole)?.label}</span>
                    </h3>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {DATA_USERS[activeRole]?.map((u, i) => (
                             <button
                                key={u.email + i}
                                onClick={() => handleSelect(u.email)}
                                disabled={isLoading}
                                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-left group bg-white dark:bg-slate-900 shadow-sm"
                            >
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 truncate">
                                            {u.name}
                                        </span>
                                        {u.dept && <Badge variant="outline" className="text-[10px] px-1 h-5 text-slate-500 whitespace-nowrap">{u.dept}</Badge>}
                                    </div>
                                    <span className="text-xs text-slate-500 truncate font-mono">{u.email}</span>
                                    {u.nim_nip && <span className="text-[10px] text-slate-400">ID: {u.nim_nip}</span>}
                                </div>
                            </button>
                        ))}
                        {(!DATA_USERS[activeRole] || DATA_USERS[activeRole].length === 0) && (
                            <div className="col-span-2 text-center py-12 text-muted-foreground italic">
                                Belum ada data untuk role ini di seed database.
                            </div>
                        )}
                    </div>
                </ScrollArea>
                
                <div className="p-3 border-t bg-slate-50 dark:bg-slate-900 text-center">
                    <p className="text-xs text-muted-foreground">
                        Password default: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">password1234</code>
                    </p>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
