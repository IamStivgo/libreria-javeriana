import { LoanStatus } from '../models/LoanStatus.js';

export interface Loan {
  id: string;
  isbn: string;
  userId: string;
  loanDate: Date;
  dueDate: Date;
  returnedAt: Date | null;
  status: LoanStatus;
}
