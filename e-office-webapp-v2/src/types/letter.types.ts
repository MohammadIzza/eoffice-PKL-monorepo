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
  nim: string;
  nama: string;
  email: string;
  departemen: string;
  programStudi: string;
  dosenPembimbingId: string;
  tempatPKL: string;
  alamatPKL: string;
  durasiPKL: string;
  proposalUrl?: string;
  ktmUrl?: string;
}
