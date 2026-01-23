export interface Letter {
  id: string;
  letterTypeId: string;
  createdById: string;
  schema: Record<string, any> | null;
  values: Record<string, any>;
  status: string;
  currentStep: number | null;
  assignedApprovers: Record<string, string> | null;
  letterNumber: string | null;
  signatureUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  letterType?: {
    id: string;
    name: string;
    description: string | null;
  };
  numbering?: {
    id: string;
    numberString: string;
    counter: number;
    date: Date | string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
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
