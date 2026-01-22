export interface ApprovalHistory {
  id: string;
  letterId: string;
  step: number;
  approverRole: string;
  approverId: string;
  approverName: string;
  action: ApprovalAction;
  comment?: string;
  timestamp: Date;
}

export type ApprovalAction = 
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'REVISE'
  | 'RESUBMIT'
  | 'CANCEL';

export interface ApprovalQueueItem {
  letter: {
    id: string;
    studentName: string;
    studentNim: string;
    submittedAt: Date;
  };
  currentStep: number;
}
