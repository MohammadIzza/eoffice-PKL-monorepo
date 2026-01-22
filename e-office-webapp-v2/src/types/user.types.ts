export interface Role {
  id: string;
  name: string;
}

export interface ProgramStudi {
  id: string;
  name: string;
  code: string;
}

export interface Departemen {
  id: string;
  name: string;
  code: string;
}

export interface Mahasiswa {
  id: string;
  nim: string;
  tahunMasuk: string;
  noHp: string;
  alamat: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  programStudi: ProgramStudi | null;
  departemen: Departemen | null;
}

export interface Pegawai {
  id: string;
  nip: string;
  jabatan: string;
  noHp: string | null;
  programStudi: ProgramStudi | null;
  departemen: Departemen | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  roles: Role[];
  mahasiswa: Mahasiswa | null;
  pegawai: Pegawai | null;
}

export type UserRoleName = 
  | 'mahasiswa'
  | 'dosen_pembimbing'
  | 'dosen_koordinator'
  | 'ketua_program_studi'
  | 'admin_fakultas'
  | 'supervisor_akademik'
  | 'supervisor_kemahasiswaan'
  | 'manajer_tu'
  | 'wakil_dekan_1'
  | 'upa'
  | 'pegawai_ukt';
