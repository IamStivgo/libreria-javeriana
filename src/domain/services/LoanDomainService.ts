import { Book } from '../entities/Book.js';
import { Loan } from '../entities/Loan.js';
import { LoanStatus } from '../models/LoanStatus.js';

export class LoanDomainService {
  /**
   * Calculates the due date by adding `days` to `loanDate`.
   * Time component is preserved from loanDate.
   */
  calculateDueDate(loanDate: Date, days: number): Date {
    const dueDate = new Date(loanDate);
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  }

  /**
   * Returns true if the loan is ACTIVE and its dueDate is strictly before now.
   * A loan due exactly today (same millisecond) is NOT overdue.
   */
  isOverdue(loan: Loan): boolean {
    if (loan.status !== LoanStatus.ACTIVE) {
      return false;
    }
    return loan.dueDate < new Date();
  }

  /**
   * Returns true if the book has at least one available copy.
   */
  canBorrow(book: Book): boolean {
    return book.availableCopies > 0;
  }
}
