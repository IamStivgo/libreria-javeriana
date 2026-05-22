import { eq, lt, and, sql } from 'drizzle-orm';
import { Database } from '../../configuration/database.js';
import { ILoanRepository } from '../../domain/repository/ILoanRepository.js';
import { Loan } from '../../domain/entities/Loan.js';
import { LoanStatus } from '../../domain/models/LoanStatus.js';
import { NoAvailableCopiesError } from '../../domain/exceptions/NoAvailableCopiesError.js';
import { loans, books } from './schema.js';

export class PostgresLoanRepository implements ILoanRepository {
  constructor(private readonly db: Database) {}

  /**
   * Atomically decrements available_copies and inserts the loan in a transaction.
   * Uses UPDATE ... WHERE available_copies > 0 RETURNING * — no separate SELECT.
   */
  async save(loan: Omit<Loan, 'id'>): Promise<Loan> {
    return this.db.transaction(async (tx) => {
      // Atomic decrement — throws if no rows returned (0 copies available)
      const [updatedBook] = await tx
        .update(books)
        .set({ availableCopies: sql`${books.availableCopies} - 1` })
        .where(and(eq(books.isbn, loan.isbn), sql`${books.availableCopies} > 0`))
        .returning();

      if (!updatedBook) {
        throw new NoAvailableCopiesError(loan.isbn);
      }

      const [row] = await tx
        .insert(loans)
        .values({
          isbn: loan.isbn,
          userId: loan.userId,
          loanDate: loan.loanDate,
          dueDate: loan.dueDate,
          returnedAt: loan.returnedAt,
          status: loan.status,
        })
        .returning();

      return this.toDomain(row);
    });
  }

  async findById(id: string): Promise<Loan | null> {
    const [row] = await this.db
      .select()
      .from(loans)
      .where(eq(loans.id, id))
      .limit(1);

    return row ? this.toDomain(row) : null;
  }

  async findOverdue(): Promise<Loan[]> {
    const rows = await this.db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.status, 'ACTIVE'),
          lt(loans.dueDate, new Date()),
        ),
      );

    return rows.map((row) => this.toDomain(row));
  }

  /**
   * Atomically updates loan status and increments available_copies in a transaction.
   */
  async updateStatus(id: string, status: LoanStatus, returnedAt?: Date): Promise<Loan> {
    return this.db.transaction(async (tx) => {
      const [updatedLoan] = await tx
        .update(loans)
        .set({
          status,
          returnedAt: returnedAt ?? null,
        })
        .where(eq(loans.id, id))
        .returning();

      if (!updatedLoan) {
        throw new Error(`Loan ${id} not found during status update`);
      }

      // Increment available copies when book is returned
      if (status === LoanStatus.RETURNED) {
        await tx
          .update(books)
          .set({ availableCopies: sql`${books.availableCopies} + 1` })
          .where(eq(books.isbn, updatedLoan.isbn));
      }

      return this.toDomain(updatedLoan);
    });
  }

  private toDomain(row: typeof loans.$inferSelect): Loan {
    return {
      id: row.id,
      isbn: row.isbn,
      userId: row.userId,
      loanDate: row.loanDate,
      dueDate: row.dueDate,
      returnedAt: row.returnedAt ?? null,
      status: row.status as LoanStatus,
    };
  }
}
