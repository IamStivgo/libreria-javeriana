import { DomainError } from './DomainError.js';

export class BookNotFoundError extends DomainError {
  readonly code = 'BOOK_NOT_FOUND';

  constructor(isbn: string) {
    super(`Book with ISBN "${isbn}" was not found.`);
  }
}
