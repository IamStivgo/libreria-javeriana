import { Book } from '../entities/Book.js';

export interface IBookRepository {
  findByIsbn(isbn: string): Promise<Book | null>;
  save(book: Book): Promise<Book>;
  updateAvailability(isbn: string, delta: number): Promise<void>;
}
