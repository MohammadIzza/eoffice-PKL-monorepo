// App constants
export const APP_NAME = 'E-Office FSM UNDIP';

export const STEPS = [
  { id: 1, name: 'Identitas', path: '/pengajuan/pkl/identitas' },
  { id: 2, name: 'Detail PKL', path: '/pengajuan/pkl/detail-pengajuan' },
  { id: 3, name: 'Lampiran', path: '/pengajuan/pkl/lampiran' },
  { id: 4, name: 'Review', path: '/pengajuan/pkl/review' },
  { id: 5, name: 'Status', path: '/pengajuan/pkl/status' },
] as const;

export const APPROVAL_STEPS = [
  { step: 1, role: 'dosen_pembimbing', name: 'Dosen Pembimbing' },
  { step: 2, role: 'dosen_koordinator', name: 'Dosen Koordinator' },
  { step: 3, role: 'ketua_prodi', name: 'Ketua Program Studi' },
  { step: 4, role: 'admin', name: 'Admin' },
  { step: 5, role: 'supervisor_akademik', name: 'Supervisor Akademik' },
  { step: 6, role: 'manajer_tu', name: 'Manajer Tata Usaha' },
  { step: 7, role: 'wakil_dekan', name: 'Wakil Dekan' },
  { step: 8, role: 'penomoran', name: 'Penomoran' },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Menunggu',
  IN_PROGRESS: 'Dalam Proses',
  REVISION: 'Revisi',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
  CANCELLED: 'Dibatalkan',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  IN_PROGRESS: 'blue',
  REVISION: 'orange',
  COMPLETED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};
