import { describe, it, expect, beforeEach } from 'vitest';
import { ReturnBookUseCase } from '../../../src/application/services/ReturnBookUseCase.js';
import { Book } from '../../../src/domain/entities/Book.js';
import { Loan } from '../../../src/domain/entities/Loan.js';
import { LoanStatus } from '../../../src/domain/models/LoanStatus.js';
import { IBookRepository } from '../../../src/domain/repository/IBookRepository.js';
import { ILoanRepository } from '../../../src/domain/repository/ILoanRepository.js';
import { LoanNotFoundError } from '../../../src/domain/exceptions/LoanNotFoundError.js';

class InMemoryBookRepository implements IBookRepository {
  private books: Map<string, Book> = new Map();
  async findByIsbn(isbn: string): Promise<Book | null> { return this.books.get(isbn) ?? null; }
  async save(book: Book): Promise<Book> { this.books.set(book.isbn, book); return book; }
  async updateAvailability(isbn: string, delta: number): Promise<void> {
    const book = this.books.get(isbn);
    if (book) this.books.set(isbn, { ...book, availableCopies: book.availableCopies + delta });
  }
}

class InMemoryLoanRepository implements ILoanRepository {
  private loans: Map<string, Loan> = new Map();

  seed(loan: Loan): void { this.loans.set(loan.id, loan); }

  async save(loan: Omit<Loan, 'id'>): Promise<Loan> {
    const id = `loan-${Date.now()}`;
    const newLoan: Loan = { ...loan, id };
    this.loans.set(id, newLoan);
    return newLoan;
  }

  async findById(id: string): Promise<Loan | null> { return this.loans.get(id) ?? null; }

  async findOverdue(): Promise<Loan[]> {
    const now = new Date();
    return Array.from(this.loans.values()).filter(
      (l) => l.status === LoanStatus.ACTIVE && l.dueDate < now,
    );
  }

  async updateStatus(id: string, status: LoanStatus, returnedAt?: Date): Promise<Loan> {
    const loan = this.loans.get(id);
    if (!loan) throw new Error(`Loan ${id} not found`);
    const updated: Loan = { ...loan, status, returnedAt: returnedAt ?? null };
    this.loans.set(id, updated);
    return updated;
  }
}

describe('ReturnBookUseCase', () => {
  let bookRepository: InMemoryBookRepository;
  let loanRepository: InMemoryLoanRepository;
  let useCase: ReturnBookUseCase;

  const activeLoan: Loan = {
    id: 'loan-abc-123',
    isbn: '9780000000000',
    userId: 'user-1',
    loanDate: new Date('2024-01-01T00:00:00.000Z'),
    dueDate: new Date('2024-01-15T00:00:00.000Z'),
    returnedAt: null,
    status: LoanStatus.ACTIVE,
  };

  beforeEach(() => {
    bookRepository = new InMemoryBookRepository();
    loanRepository = new InMemoryLoanRepository();
    useCase = new ReturnBookUseCase({ bookRepository, loanRepository });
  });

  it('marks loan as RETURNED with a returnedAt date', async () => {
    loanRepository.seed(activeLoan);

    const result = await useCase.execute({ loanId: activeLoan.id });

    expect(result.status).toBe(LoanStatus.RETURNED);
    expect(result.returnedAt).not.toBeNull();
    expect(result.returnedAt).toBeInstanceOf(Date);
  });

  it('throws LoanNotFoundError when loan does not exist', async () => {
    await expect(
      useCase.execute({ loanId: '00000000-0000-0000-0000-000000000000' }),
    ).rejects.toThrow(LoanNotFoundError);
  });
});
