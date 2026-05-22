import {
  pgTable,
  pgEnum,
  varchar,
  integer,
  timestamp,
  uuid,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Enum ──────────────────────────────────────────────────────────────────

export const loanStatusEnum = pgEnum('loan_status', ['ACTIVE', 'RETURNED']);

// ─── books ─────────────────────────────────────────────────────────────────

export const books = pgTable(
  'books',
  {
    isbn: varchar('isbn', { length: 20 }).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    area: varchar('area', { length: 100 }).notNull(),
    totalCopies: integer('total_copies').notNull(),
    availableCopies: integer('available_copies').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('chk_copies_positive', sql`${table.totalCopies} > 0`),
    check('chk_available_non_neg', sql`${table.availableCopies} >= 0`),
    check(
      'chk_available_lte_total',
      sql`${table.availableCopies} <= ${table.totalCopies}`,
    ),
  ],
);

// ─── loans ─────────────────────────────────────────────────────────────────

export const loans = pgTable(
  'loans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    isbn: varchar('isbn', { length: 20 })
      .notNull()
      .references(() => books.isbn),
    userId: varchar('user_id', { length: 255 }).notNull(),
    loanDate: timestamp('loan_date', { withTimezone: true }).notNull().defaultNow(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    returnedAt: timestamp('returned_at', { withTimezone: true }),
    status: loanStatusEnum('status').notNull().default('ACTIVE'),
  },
  (table) => [
    check('chk_due_after_loan', sql`${table.dueDate} > ${table.loanDate}`),
    index('idx_loans_isbn').on(table.isbn),
    index('idx_loans_user').on(table.userId),
    index('idx_loans_status').on(table.status),
    index('idx_loans_active_due').on(table.dueDate).where(sql`${table.status} = 'ACTIVE'`),
  ],
);

// ─── Types ─────────────────────────────────────────────────────────────────

export type BookRow = typeof books.$inferSelect;
export type NewBookRow = typeof books.$inferInsert;
export type LoanRow = typeof loans.$inferSelect;
export type NewLoanRow = typeof loans.$inferInsert;
