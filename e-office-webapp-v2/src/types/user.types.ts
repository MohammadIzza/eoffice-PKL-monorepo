// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
}

export type UserRole = 
  | 'mahasiswa'
  | 'dosen_pembimbing'
  | 'dosen_koordinator'
  | 'ketua_prodi'
  | 'admin'
  | 'supervisor_akademik'
  | 'manajer_tu'
  | 'wakil_dekan';
