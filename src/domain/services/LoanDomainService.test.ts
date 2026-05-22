import { describe, it, expect, beforeEach } from 'vitest';
import { LoanDomainService } from './LoanDomainService.js';
import { LoanStatus } from '../models/LoanStatus.js';
import { Loan } from '../entities/Loan.js';
import { Book } from '../entities/Book.js';

describe('LoanDomainService', () => {
  let service: LoanDomainService;

  beforeEach(() => {
    service = new LoanDomainService();
  });

  // ─── calculateDueDate ────────────────────────────────────────────────────

  describe('calculateDueDate', () => {
    it('adds the specified number of days to loanDate', () => {
      const loanDate = new Date('2024-01-01T10:00:00.000Z');
      const dueDate = service.calculateDueDate(loanDate, 14);
      expect(dueDate).toEqual(new Date('2024-01-15T10:00:00.000Z'));
    });

    it('handles month boundaries correctly', () => {
      const loanDate = new Date('2024-01-28T00:00:00.000Z');
      const dueDate = service.calculateDueDate(loanDate, 14);
      expect(dueDate).toEqual(new Date('2024-02-11T00:00:00.000Z'));
    });

    it('handles leap year correctly', () => {
      const loanDate = new Date('2024-02-15T00:00:00.000Z');
      const dueDate = service.calculateDueDate(loanDate, 14);
      expect(dueDate).toEqual(new Date('2024-02-29T00:00:00.000Z'));
    });

    it('does not mutate the original loanDate', () => {
      const loanDate = new Date('2024-01-01T00:00:00.000Z');
      const originalTime = loanDate.getTime();
      service.calculateDueDate(loanDate, 14);
      expect(loanDate.getTime()).toBe(originalTime);
    });

    it('handles 1 day correctly', () => {
      const loanDate = new Date('2024-03-31T12:00:00.000Z');
      const dueDate = service.calculateDueDate(loanDate, 1);
      expect(dueDate).toEqual(new Date('2024-04-01T12:00:00.000Z'));
    });
  });

  // ─── isOverdue ──────────────────────────────────────────────────────────

  describe('isOverdue', () => {
    const makeLoan = (dueDate: Date, status: LoanStatus = LoanStatus.ACTIVE): Loan => ({
      id: 'loan-1',
      isbn: '978-0-000000-00-0',
      userId: 'user-1',
      loanDate: new Date('2024-01-01T00:00:00.000Z'),
      dueDate,
      returnedAt: null,
      status,
    });

    it('returns true when loan is ACTIVE and dueDate is in the past', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(service.isOverdue(makeLoan(yesterday))).toBe(true);
    });

    it('returns false when loan is ACTIVE and dueDate is in the future', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(service.isOverdue(makeLoan(tomorrow))).toBe(false);
    });

    it('returns false when loan is RETURNED even if dueDate is in the past', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const returned = makeLoan(yesterday, LoanStatus.RETURNED);
      expect(service.isOverdue(returned)).toBe(false);
    });

    it('returns false when dueDate is exactly now (boundary: not yet strictly before)', () => {
      // We use a date slightly in the future to simulate "due today, not yet passed"
      const slightlyInFuture = new Date(Date.now() + 1000);
      expect(service.isOverdue(makeLoan(slightlyInFuture))).toBe(false);
    });

    it('returns true when loan was due yesterday (1 day overdue)', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(service.isOverdue(makeLoan(yesterday))).toBe(true);
    });

    it('returns false when loan was due tomorrow (1 day remaining)', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(service.isOverdue(makeLoan(tomorrow))).toBe(false);
    });
  });

  // ─── canBorrow ──────────────────────────────────────────────────────────

  describe('canBorrow', () => {
    const makeBook = (availableCopies: number): Book => ({
      isbn: '978-0-000000-00-0',
      title: 'Test Book',
      area: 'Technology',
      totalCopies: 5,
      availableCopies,
      createdAt: new Date(),
    });

    it('returns true when book has available copies', () => {
      expect(service.canBorrow(makeBook(3))).toBe(true);
    });

    it('returns true when book has exactly 1 available copy', () => {
      expect(service.canBorrow(makeBook(1))).toBe(true);
    });

    it('returns false when book has 0 available copies', () => {
      expect(service.canBorrow(makeBook(0))).toBe(false);
    });
  });
});
