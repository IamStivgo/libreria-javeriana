import { Loan } from '../entities/Loan.js';
import { LoanStatus } from '../models/LoanStatus.js';

export interface ILoanRepository {
  save(loan: Omit<Loan, 'id'>): Promise<Loan>;
  findById(id: string): Promise<Loan | null>;
  findOverdue(): Promise<Loan[]>;
  updateStatus(id: string, status: LoanStatus, returnedAt?: Date): Promise<Loan>;
}
