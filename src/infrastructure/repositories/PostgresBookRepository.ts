import { eq } from 'drizzle-orm';
import { Database } from '../../configuration/database.js';
import { IBookRepository } from '../../domain/repository/IBookRepository.js';
import { Book } from '../../domain/entities/Book.js';
import { books } from './schema.js';

export class PostgresBookRepository implements IBookRepository {
  constructor(private readonly db: Database) {}

  async findByIsbn(isbn: string): Promise<Book | null> {
    const [row] = await this.db
      .select()
      .from(books)
      .where(eq(books.isbn, isbn))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async save(book: Book): Promise<Book> {
    const [row] = await this.db
      .insert(books)
      .values({
        isbn: book.isbn,
        title: book.title,
        area: book.area,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        createdAt: book.createdAt,
      })
      .onConflictDoUpdate({
        target: books.isbn,
        set: {
          title: book.title,
          area: book.area,
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
        },
      })
      .returning();

    return this.toDomain(row);
  }

  async updateAvailability(isbn: string, delta: number): Promise<void> {
    await this.db
      .update(books)
      .set({ availableCopies: delta })
      .where(eq(books.isbn, isbn));
  }

  private toDomain(row: typeof books.$inferSelect): Book {
    return {
      isbn: row.isbn,
      title: row.title,
      area: row.area,
      totalCopies: row.totalCopies,
      availableCopies: row.availableCopies,
      createdAt: row.createdAt,
    };
  }
}
