import { describe, it, expect, beforeEach } from 'vitest';
import { CreateLoanUseCase } from './CreateLoanUseCase.js';
import { LoanDomainService } from '../../domain/services/LoanDomainService.js';
import { Book } from '../../domain/entities/Book.js';
import { Loan } from '../../domain/entities/Loan.js';
import { LoanStatus } from '../../domain/models/LoanStatus.js';
import { IBookRepository } from '../../domain/repository/IBookRepository.js';
import { ILoanRepository } from '../../domain/repository/ILoanRepository.js';
import { BookNotFoundError } from '../../domain/exceptions/BookNotFoundError.js';
import { NoAvailableCopiesError } from '../../domain/exceptions/NoAvailableCopiesError.js';

// ─── In-memory repositories ────────────────────────────────────────────────

class InMemoryBookRepository implements IBookRepository {
  private books: Map<string, Book> = new Map();

  async findByIsbn(isbn: string): Promise<Book | null> {
    return this.books.get(isbn) ?? null;
  }

  async save(book: Book): Promise<Book> {
    this.books.set(book.isbn, book);
    return book;
  }

  async updateAvailability(isbn: string, delta: number): Promise<void> {
    const book = this.books.get(isbn);
    if (book) {
      this.books.set(isbn, { ...book, availableCopies: book.availableCopies + delta });
    }
  }

  seed(book: Book): void {
    this.books.set(book.isbn, book);
  }
}

class InMemoryLoanRepository implements ILoanRepository {
  private loans: Map<string, Loan> = new Map();
  private counter = 0;

  async save(loan: Omit<Loan, 'id'>): Promise<Loan> {
    const id = `loan-${++this.counter}`;
    const newLoan: Loan = { ...loan, id };
    this.loans.set(id, newLoan);
    return newLoan;
  }

  async findById(id: string): Promise<Loan | null> {
    return this.loans.get(id) ?? null;
  }

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

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('CreateLoanUseCase', () => {
  let bookRepository: InMemoryBookRepository;
  let loanRepository: InMemoryLoanRepository;
  let useCase: CreateLoanUseCase;

  const availableBook: Book = {
    isbn: '9780000000000',
    title: 'Clean Code',
    area: 'Software Engineering',
    totalCopies: 3,
    availableCopies: 2,
    createdAt: new Date(),
  };

  const unavailableBook: Book = {
    ...availableBook,
    isbn: '9780000000001',
    availableCopies: 0,
  };

  beforeEach(() => {
    bookRepository = new InMemoryBookRepository();
    loanRepository = new InMemoryLoanRepository();
    useCase = new CreateLoanUseCase({
      bookRepository,
      loanRepository,
      loanDomainService: new LoanDomainService(),
      defaultLoanDays: 14,
    });
  });

  it('creates a loan successfully with default due days', async () => {
    bookRepository.seed(availableBook);

    const loan = await useCase.execute({ isbn: availableBook.isbn, userId: 'user-1' });

    expect(loan.isbn).toBe(availableBook.isbn);
    expect(loan.userId).toBe('user-1');
    expect(loan.status).toBe(LoanStatus.ACTIVE);
    expect(loan.returnedAt).toBeNull();
    expect(loan.id).toBeDefined();
  });

  it('creates a loan with custom dueDays', async () => {
    bookRepository.seed(availableBook);

    const loan = await useCase.execute({
      isbn: availableBook.isbn,
      userId: 'user-1',
      dueDays: 7,
    });

    const diffDays = Math.round(
      (loan.dueDate.getTime() - loan.loanDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(7);
  });

  it('throws BookNotFoundError when isbn does not exist', async () => {
    await expect(
      useCase.execute({ isbn: '9789999999999', userId: 'user-1' }),
    ).rejects.toThrow(BookNotFoundError);
  });

  it('throws NoAvailableCopiesError when book has 0 available copies', async () => {
    bookRepository.seed(unavailableBook);

    await expect(
      useCase.execute({ isbn: unavailableBook.isbn, userId: 'user-1' }),
    ).rejects.toThrow(NoAvailableCopiesError);
  });
});
