// Letter related types
export interface Letter {
  id: string;
  letterTypeId: string;
  studentId: string;
  formData: Record<string, any>;
  currentStep: number;
  status: LetterStatus;
  letterNumber?: string;
  signatureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LetterStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'REVISION'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface LetterFormData {
  // Identitas
  nim: string;
  nama: string;
  email: string;
  departemen: string;
  programStudi: string;
  dosenPembimbingId: string;
  
  // Detail PKL
  tempatPKL: string;
  alamatPKL: string;
  durasiPKL: string;
  
  // Lampiran
  proposalUrl?: string;
  ktmUrl?: string;
}
