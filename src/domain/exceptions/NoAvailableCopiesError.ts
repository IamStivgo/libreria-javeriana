import { DomainError } from './DomainError.js';

export class NoAvailableCopiesError extends DomainError {
  readonly code = 'NO_AVAILABLE_COPIES';

  constructor(isbn: string) {
    super(`No available copies for book with ISBN "${isbn}".`);
  }
}
