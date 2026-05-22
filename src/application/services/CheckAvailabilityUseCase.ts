import { IBookRepository } from '../../domain/repository/IBookRepository.js';
import { BookNotFoundError } from '../../domain/exceptions/BookNotFoundError.js';

export interface CheckAvailabilityDependencies {
  bookRepository: IBookRepository;
}

export interface AvailabilityResult {
  isbn: string;
  title: string;
  availableCopies: number;
  isAvailable: boolean;
}

export class CheckAvailabilityUseCase {
  private readonly bookRepository: IBookRepository;

  constructor(deps: CheckAvailabilityDependencies) {
    this.bookRepository = deps.bookRepository;
  }

  async execute(isbn: string): Promise<AvailabilityResult> {
    const book = await this.bookRepository.findByIsbn(isbn);
    if (!book) {
      throw new BookNotFoundError(isbn);
    }

    return {
      isbn: book.isbn,
      title: book.title,
      availableCopies: book.availableCopies,
      isAvailable: book.availableCopies > 0,
    };
  }
}
