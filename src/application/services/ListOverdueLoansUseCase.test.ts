import { describe, it, expect, beforeEach } from 'vitest';
import { ListOverdueLoansUseCase } from './ListOverdueLoansUseCase.js';
import { Loan } from '../../domain/entities/Loan.js';
import { LoanStatus } from '../../domain/models/LoanStatus.js';
import { ILoanRepository } from '../../domain/repository/ILoanRepository.js';

class InMemoryLoanRepository implements ILoanRepository {
  private loans: Loan[] = [];

  seed(loans: Loan[]): void { this.loans = loans; }

  async save(loan: Omit<Loan, 'id'>): Promise<Loan> {
    const newLoan: Loan = { ...loan, id: `loan-${Date.now()}` };
    this.loans.push(newLoan);
    return newLoan;
  }
  async findById(id: string): Promise<Loan | null> {
    return this.loans.find((l) => l.id === id) ?? null;
  }
  async findOverdue(): Promise<Loan[]> {
    const now = new Date();
    return this.loans.filter(
      (l) => l.status === LoanStatus.ACTIVE && l.dueDate < now,
    );
  }
  async updateStatus(id: string, status: LoanStatus, returnedAt?: Date): Promise<Loan> {
    const idx = this.loans.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error(`Loan ${id} not found`);
    this.loans[idx] = { ...this.loans[idx], status, returnedAt: returnedAt ?? null };
    return this.loans[idx];
  }
}

describe('ListOverdueLoansUseCase', () => {
  let loanRepository: InMemoryLoanRepository;
  let useCase: ListOverdueLoansUseCase;

  const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  beforeEach(() => {
    loanRepository = new InMemoryLoanRepository();
    useCase = new ListOverdueLoansUseCase({ loanRepository });
  });

  it('returns only overdue active loans', async () => {
    loanRepository.seed([
      { id: '1', isbn: 'ISBN-A', userId: 'u1', loanDate: new Date(), dueDate: pastDate, returnedAt: null, status: LoanStatus.ACTIVE },
      { id: '2', isbn: 'ISBN-B', userId: 'u2', loanDate: new Date(), dueDate: futureDate, returnedAt: null, status: LoanStatus.ACTIVE },
      { id: '3', isbn: 'ISBN-C', userId: 'u3', loanDate: new Date(), dueDate: pastDate, returnedAt: new Date(), status: LoanStatus.RETURNED },
    ]);

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns empty array when no overdue loans exist', async () => {
    loanRepository.seed([
      { id: '1', isbn: 'ISBN-A', userId: 'u1', loanDate: new Date(), dueDate: futureDate, returnedAt: null, status: LoanStatus.ACTIVE },
    ]);

    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });
});
