'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { client } from '@/lib/api';
import { departemenService, type Departemen } from '@/services/departemen.service';
import { programStudiService, type ProgramStudi } from '@/services/programStudi.service';
import type { User } from '@/types';
import {
  Building2,
  GraduationCap,
  Phone,
  Hash,
  Calendar,
  MapPin,
  Briefcase,
  AlertCircle,
} from 'lucide-react';

interface CompleteProfileModalProps {
  user: User;
  onCompleted: () => void;
}

const PEGAWAI_ROLES = [
  'dosen_pembimbing', 'dosen_koordinator', 'petugas_tu', 'manajer_tu',
  'supervisor_akademik', 'supervisor_kemahasiswaan', 'supervisor_sumberdaya',
  'ketua_program_studi', 'ketua_departemen', 'dekan', 'wakil_dekan_1',
  'wakil_dekan_2', 'upa', 'prodi', 'admin_fakultas', 'admin_departemen',
  'petugas_akademik', 'pegawai_ukt',
];

export function needsProfileCompletion(user: User): 'mahasiswa' | 'pegawai' | null {
  const roleNames = user.roles?.map((r) => r.name) ?? [];
  if (roleNames.includes('mahasiswa') && !user.mahasiswa) return 'mahasiswa';
  if (roleNames.some((r) => PEGAWAI_ROLES.includes(r)) && !user.pegawai) return 'pegawai';
  return null;
}

function FieldRow({
  icon,
  label,
  required,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <span className="text-slate-400 w-4 h-4 flex-shrink-0">{icon}</span>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function CompleteProfileModal({ user, onCompleted }: CompleteProfileModalProps) {
  const profileType = needsProfileCompletion(user);

  const [open, setOpen] = useState(!!profileType);
  const [departemenList, setDepartemenList] = useState<Departemen[]>([]);
  const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);
  const [filteredProdi, setFilteredProdi] = useState<ProgramStudi[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [departemenId, setDepartemenId] = useState('');
  const [programStudiId, setProgramStudiId] = useState('');
  const [noHp, setNoHp] = useState('');
  const [nim, setNim] = useState('');
  const [tahunMasuk, setTahunMasuk] = useState('');
  const [alamat, setAlamat] = useState('');
  const [tempatLahir, setTempatLahir] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [nip, setNip] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([departemenService.getAll(), programStudiService.getAll()])
      .then(([dep, prodi]) => {
        setDepartemenList(dep);
        setProdiList(prodi);
      })
      .catch((err) => {
        console.error('[CompleteProfileModal] Failed to fetch master data:', err);
        setFetchError('Gagal memuat data departemen/prodi. Coba refresh halaman.');
      });
  }, []);

  useEffect(() => {
    if (departemenId) {
      setFilteredProdi(prodiList.filter((p) => p.departemenId === departemenId));
      setProgramStudiId('');
    } else {
      setFilteredProdi([]);
    }
  }, [departemenId, prodiList]);

  if (!profileType) return null;

  const isMahasiswa = profileType === 'mahasiswa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const api = client as any;
      const payload: Record<string, string> = { departemenId, programStudiId, noHp };
      if (isMahasiswa) {
        payload.nim = nim;
        payload.tahunMasuk = tahunMasuk;
        if (alamat) payload.alamat = alamat;
        if (tempatLahir) payload.tempatLahir = tempatLahir;
        if (tanggalLahir) payload.tanggalLahir = tanggalLahir;
      } else {
        payload.nip = nip;
        payload.jabatan = jabatan;
      }
      const response = await api.me['complete-profile'].patch(payload);
      if (response.error) {
        const errData = response.error as any;
        throw new Error(errData?.value?.message ?? errData?.message ?? 'Gagal menyimpan profil');
      }
      setOpen(false);
      onCompleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-xl p-0 overflow-hidden border-0 shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-white/20 rounded-full p-2">
              {isMahasiswa ? (
                <GraduationCap className="w-5 h-5" />
              ) : (
                <Briefcase className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-lg font-semibold">Lengkapi Profil Anda</h2>
          </div>
          <p className="text-blue-100 text-sm ml-14">
            Halo, <span className="font-medium text-white">{user.name}</span>! Akun berhasil
            dibuat via SSO. Lengkapi data {isMahasiswa ? 'mahasiswa' : 'kepegawaian'} untuk
            melanjutkan.
          </p>
        </div>

        {/* Body */}
        <form
          id="complete-profile-form"
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto"
        >
          {fetchError && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* Departemen + Prodi */}
          <div className="grid grid-cols-2 gap-3">
            <FieldRow icon={<Building2 className="w-4 h-4" />} label="Departemen" required>
              <Select value={departemenId} onValueChange={setDepartemenId} required>
                <SelectTrigger className="h-9 text-sm border-slate-200 focus:ring-blue-500">
                  <SelectValue placeholder="Pilih departemen..." />
                </SelectTrigger>
                <SelectContent className="z-[300]">
                  {departemenList.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2 text-center">Memuat...</div>
                  ) : (
                    departemenList.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="text-sm">
                        {d.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow icon={<GraduationCap className="w-4 h-4" />} label="Program Studi" required>
              <Select
                value={programStudiId}
                onValueChange={setProgramStudiId}
                disabled={!departemenId}
                required
              >
                <SelectTrigger className="h-9 text-sm border-slate-200 focus:ring-blue-500">
                  <SelectValue
                    placeholder={departemenId ? 'Pilih prodi...' : 'Pilih departemen dulu'}
                  />
                </SelectTrigger>
                <SelectContent className="z-[300]">
                  {filteredProdi.length === 0 ? (
                    <div className="text-xs text-slate-400 p-2 text-center">
                      {departemenId ? 'Tidak ada prodi' : 'Pilih departemen dulu'}
                    </div>
                  ) : (
                    filteredProdi.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-sm">
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>

          <FieldRow icon={<Phone className="w-4 h-4" />} label="No. HP" required>
            <Input
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
              required
            />
          </FieldRow>

          {/* Mahasiswa fields */}
          {isMahasiswa && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow icon={<Hash className="w-4 h-4" />} label="NIM" required>
                  <Input
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    placeholder="24060122xxxxxx"
                    className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
                    required
                  />
                </FieldRow>
                <FieldRow icon={<Calendar className="w-4 h-4" />} label="Tahun Masuk" required>
                  <Input
                    value={tahunMasuk}
                    onChange={(e) => setTahunMasuk(e.target.value)}
                    placeholder="2022"
                    maxLength={4}
                    className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
                    required
                  />
                </FieldRow>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
                  Data Tambahan (opsional)
                </p>
                <div className="space-y-3">
                  <FieldRow icon={<MapPin className="w-4 h-4" />} label="Alamat">
                    <Input
                      value={alamat}
                      onChange={(e) => setAlamat(e.target.value)}
                      placeholder="Jl. ..."
                      className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
                    />
                  </FieldRow>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldRow icon={<MapPin className="w-4 h-4" />} label="Tempat Lahir">
                      <Input
                        value={tempatLahir}
                        onChange={(e) => setTempatLahir(e.target.value)}
                        placeholder="Semarang"
                        className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
                      />
                    </FieldRow>
                    <FieldRow icon={<Calendar className="w-4 h-4" />} label="Tanggal Lahir">
                      <Input
                        type="date"
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                        className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
                      />
                    </FieldRow>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Pegawai fields */}
          {!isMahasiswa && (
            <div className="grid grid-cols-2 gap-3">
              <FieldRow icon={<Hash className="w-4 h-4" />} label="NIP" required>
                <Input
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="19xxxxxxxxxxxxxx"
                  className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
                  required
                />
              </FieldRow>
              <FieldRow icon={<Briefcase className="w-4 h-4" />} label="Jabatan" required>
                <Input
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Dosen Pembimbing"
                  className="h-9 text-sm border-slate-200 focus-visible:ring-blue-500"
                  required
                />
              </FieldRow>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 pb-5 border-t border-slate-100 pt-4">
          <Button
            form="complete-profile-form"
            type="submit"
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : (
              'Simpan & Lanjutkan →'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
