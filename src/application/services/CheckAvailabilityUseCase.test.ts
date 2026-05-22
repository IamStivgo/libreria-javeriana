import { describe, it, expect, beforeEach } from 'vitest';
import { CheckAvailabilityUseCase } from './CheckAvailabilityUseCase.js';
import { Book } from '../../domain/entities/Book.js';
import { IBookRepository } from '../../domain/repository/IBookRepository.js';
import { BookNotFoundError } from '../../domain/exceptions/BookNotFoundError.js';

class InMemoryBookRepository implements IBookRepository {
  private books: Map<string, Book> = new Map();
  seed(book: Book): void { this.books.set(book.isbn, book); }
  async findByIsbn(isbn: string): Promise<Book | null> { return this.books.get(isbn) ?? null; }
  async save(book: Book): Promise<Book> { this.books.set(book.isbn, book); return book; }
  async updateAvailability(isbn: string, delta: number): Promise<void> {
    const book = this.books.get(isbn);
    if (book) this.books.set(isbn, { ...book, availableCopies: book.availableCopies + delta });
  }
}

describe('CheckAvailabilityUseCase', () => {
  let bookRepository: InMemoryBookRepository;
  let useCase: CheckAvailabilityUseCase;

  beforeEach(() => {
    bookRepository = new InMemoryBookRepository();
    useCase = new CheckAvailabilityUseCase({ bookRepository });
  });

  it('returns availability info for an existing book with copies', async () => {
    bookRepository.seed({
      isbn: '9780000000000',
      title: 'Clean Code',
      area: 'Engineering',
      totalCopies: 5,
      availableCopies: 3,
      createdAt: new Date(),
    });

    const result = await useCase.execute('9780000000000');

    expect(result.isbn).toBe('9780000000000');
    expect(result.title).toBe('Clean Code');
    expect(result.availableCopies).toBe(3);
    expect(result.isAvailable).toBe(true);
  });

  it('returns isAvailable=false when no copies are available', async () => {
    bookRepository.seed({
      isbn: '9780000000001',
      title: 'Domain-Driven Design',
      area: 'Engineering',
      totalCopies: 2,
      availableCopies: 0,
      createdAt: new Date(),
    });

    const result = await useCase.execute('9780000000001');

    expect(result.isAvailable).toBe(false);
    expect(result.availableCopies).toBe(0);
  });

  it('throws BookNotFoundError for unknown isbn', async () => {
    await expect(useCase.execute('9789999999999')).rejects.toThrow(BookNotFoundError);
  });
});
