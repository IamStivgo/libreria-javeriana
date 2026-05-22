import { z } from 'zod';

export const CreateLoanBodySchema = z.object({
  isbn: z
    .string()
    .min(1, 'ISBN is required')
    .regex(/^(97(8|9))?\d{9}(\d|X)$/, 'ISBN must be a valid ISBN-10 or ISBN-13'),
  userId: z.string().min(1, 'userId is required'),
  dueDays: z
    .number()
    .int('dueDays must be an integer')
    .positive('dueDays must be positive')
    .optional(),
});

export type CreateLoanBody = z.infer<typeof CreateLoanBodySchema>;

export const LoanIdParamSchema = z.object({
  id: z.string().uuid('Loan ID must be a valid UUID'),
});

export type LoanIdParam = z.infer<typeof LoanIdParamSchema>;
