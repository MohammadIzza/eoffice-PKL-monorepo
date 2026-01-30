'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Shield, 
  GraduationCap, 
  Briefcase, 
  MapPin, 
  Phone, 
  Calendar,
  Building2,
  BookOpen,
  Hash,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'; 
import type { User as UserType } from '@/types';
import { EditProfileDialog } from '@/components/features/profile/EditProfileDialog';

export default function ProfilePage() {
  const { user, checkSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        await checkSession();
        const store = useAuthStore.getState();
        if (store.user) {
          setUserData(store.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      setUserData(user);
      setIsLoading(false);
    } else {
      fetchUserData();
    }
  }, [checkSession, user]);

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getRoleBadgeColor = (roleName: string): string => {
    const roleColors: Record<string, string> = {
      'mahasiswa': 'bg-[#0071E3] text-white',
      'dosen_pembimbing': 'bg-[#34C759] text-white',
      'dosen_koordinator': 'bg-[#0A84FF] text-white',
      'ketua_program_studi': 'bg-[#FF9500] text-white',
      'admin_fakultas': 'bg-[#AF52DE] text-white',
      'supervisor_akademik': 'bg-[#5856D6] text-white',
      'supervisor_kemahasiswaan': 'bg-[#FF2D55] text-white',
      'manajer_tu': 'bg-[#FF9500] text-white',
      'wakil_dekan_1': 'bg-[#0071E3] text-white',
      'upa': 'bg-[#34C759] text-white',
      'pegawai_ukt': 'bg-[#86868B] text-white',
    };
    return roleColors[roleName] || 'bg-[#86868B] text-white';
  };

  const formatRoleName = (roleName: string): string => {
    const roleNames: Record<string, string> = {
      'mahasiswa': 'Mahasiswa',
      'dosen_pembimbing': 'Dosen Pembimbing',
      'dosen_koordinator': 'Dosen Koordinator',
      'ketua_program_studi': 'Ketua Program Studi',
      'admin_fakultas': 'Admin Fakultas',
      'supervisor_akademik': 'Supervisor Akademik',
      'supervisor_kemahasiswaan': 'Supervisor Kemahasiswaan',
      'manajer_tu': 'Manajer TU',
      'wakil_dekan_1': 'Wakil Dekan 1',
      'upa': 'UPA',
      'pegawai_ukt': 'Pegawai UKT',
    };
    return roleNames[roleName] || roleName;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-[#0071E3] animate-spin" />
          <p className="text-sm text-[#86868B]">Memuat data profil...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="p-8 rounded-3xl shadow-apple border border-[rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-[#FF3B30]" />
            <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">Data tidak ditemukan</h2>
            <p className="text-sm text-[#86868B] text-center">Tidak dapat memuat data profil pengguna.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#1D1D1F] tracking-tight mb-2">Profil Pengguna</h1>
            <p className="text-sm text-[#86868B]">Informasi lengkap tentang akun dan data Anda</p>
          </div>
          <EditProfileDialog user={userData} />
        </div>

        {/* Profile Header Card */}
        <Card className="p-8 rounded-3xl shadow-apple border border-[rgba(0,0,0,0.08)] bg-white animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-[rgba(0,0,0,0.08)] rounded-full">
              <AvatarImage src={userData.image || undefined} />
              <AvatarFallback className="bg-[#F5F5F7] text-[#0071E3] text-2xl font-semibold">
                {getInitials(userData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                  {userData.name}
                </h2>
                {userData.emailVerified && (
                  <Badge className="bg-[#34C759] text-white rounded-full px-2 py-0.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Terverifikasi
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#86868B] mb-4">
                <Mail className="h-4 w-4" />
                <span>{userData.email}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {userData.roles.map((role) => (
                  <Badge
                    key={role.id}
                    className={`${getRoleBadgeColor(role.name)} rounded-full px-3 py-1 text-xs font-medium`}
                  >
                    {formatRoleName(role.name)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* User Information */}
        <Card className="p-6 rounded-3xl shadow-apple border border-[rgba(0,0,0,0.08)] bg-white animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <User className="h-5 w-5 text-[#0071E3]" />
            <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">Informasi Akun</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">ID Pengguna</p>
              <p className="text-sm text-[#1D1D1F] font-mono">{userData.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Nama Lengkap</p>
              <p className="text-sm text-[#1D1D1F]">{userData.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Email</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#1D1D1F]">{userData.email}</p>
                {userData.emailVerified ? (
                  <CheckCircle2 className="h-4 w-4 text-[#34C759]" />
                ) : (
                  <XCircle className="h-4 w-4 text-[#FF3B30]" />
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Status Verifikasi Email</p>
              <p className="text-sm text-[#1D1D1F]">
                {userData.emailVerified ? 'Terverifikasi' : 'Belum Terverifikasi'}
              </p>
            </div>
          </div>
        </Card>

        {/* Mahasiswa Information */}
        {userData.mahasiswa && (
          <Card className="p-6 rounded-3xl shadow-apple border border-[rgba(0,0,0,0.08)] bg-white animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap className="h-5 w-5 text-[#0071E3]" />
              <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">Data Mahasiswa</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">NIM</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#86868B]" />
                  <p className="text-sm text-[#1D1D1F] font-mono">{userData.mahasiswa.nim}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Tahun Masuk</p>
                <p className="text-sm text-[#1D1D1F]">{userData.mahasiswa.tahunMasuk}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">No. HP</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#86868B]" />
                  <p className="text-sm text-[#1D1D1F]">{userData.mahasiswa.noHp}</p>
                </div>
              </div>
              {userData.mahasiswa.alamat && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Alamat</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-[#86868B] mt-0.5" />
                    <p className="text-sm text-[#1D1D1F]">{userData.mahasiswa.alamat}</p>
                  </div>
                </div>
              )}
              {userData.mahasiswa.tempatLahir && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Tempat Lahir</p>
                  <p className="text-sm text-[#1D1D1F]">{userData.mahasiswa.tempatLahir}</p>
                </div>
              )}
              {userData.mahasiswa.tanggalLahir && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Tanggal Lahir</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#86868B]" />
                    <p className="text-sm text-[#1D1D1F]">{formatDate(userData.mahasiswa.tanggalLahir)}</p>
                  </div>
                </div>
              )}
              {userData.mahasiswa.programStudi && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Program Studi</p>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#86868B]" />
                    <div>
                      <p className="text-sm text-[#1D1D1F] font-medium">{userData.mahasiswa.programStudi.name}</p>
                      <p className="text-xs text-[#86868B]">Kode: {userData.mahasiswa.programStudi.code}</p>
                    </div>
                  </div>
                </div>
              )}
              {userData.mahasiswa.departemen && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Departemen</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#86868B]" />
                    <div>
                      <p className="text-sm text-[#1D1D1F] font-medium">{userData.mahasiswa.departemen.name}</p>
                      <p className="text-xs text-[#86868B]">Kode: {userData.mahasiswa.departemen.code}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Pegawai Information */}
        {userData.pegawai && (
          <Card className="p-6 rounded-3xl shadow-apple border border-[rgba(0,0,0,0.08)] bg-white animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <Briefcase className="h-5 w-5 text-[#0071E3]" />
              <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">Data Pegawai</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">NIP</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#86868B]" />
                  <p className="text-sm text-[#1D1D1F] font-mono">{userData.pegawai.nip}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Jabatan</p>
                <p className="text-sm text-[#1D1D1F]">{userData.pegawai.jabatan}</p>
              </div>
              {userData.pegawai.noHp && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">No. HP</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#86868B]" />
                    <p className="text-sm text-[#1D1D1F]">{userData.pegawai.noHp}</p>
                  </div>
                </div>
              )}
              {userData.pegawai.programStudi && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Program Studi</p>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#86868B]" />
                    <div>
                      <p className="text-sm text-[#1D1D1F] font-medium">{userData.pegawai.programStudi.name}</p>
                      <p className="text-xs text-[#86868B]">Kode: {userData.pegawai.programStudi.code}</p>
                    </div>
                  </div>
                </div>
              )}
              {userData.pegawai.departemen && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#86868B] uppercase tracking-wide">Departemen</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#86868B]" />
                    <div>
                      <p className="text-sm text-[#1D1D1F] font-medium">{userData.pegawai.departemen.name}</p>
                      <p className="text-xs text-[#86868B]">Kode: {userData.pegawai.departemen.code}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Roles Information */}
        {userData.roles && userData.roles.length > 0 && (
          <Card className="p-6 rounded-3xl shadow-apple border border-[rgba(0,0,0,0.08)] bg-white animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-[#0071E3]" />
              <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">Peran & Akses</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {userData.roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.08)]"
                  >
                    <Badge className={`${getRoleBadgeColor(role.name)} rounded-full px-2 py-0.5 text-xs`}>
                      {formatRoleName(role.name)}
                    </Badge>
                    <span className="text-xs text-[#86868B] font-mono">ID: {role.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}