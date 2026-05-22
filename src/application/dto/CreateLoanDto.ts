import { z } from 'zod';

export const CreateLoanDtoSchema = z.object({
  isbn: z
    .string()
    .min(1, 'ISBN is required')
    .regex(
      /^(97(8|9))?\d{9}(\d|X)$/,
      'ISBN must be a valid ISBN-10 or ISBN-13 (no hyphens)',
    ),
  userId: z.string().min(1, 'userId is required'),
  dueDays: z
    .number()
    .int('dueDays must be an integer')
    .positive('dueDays must be a positive number')
    .optional(),
});

export type CreateLoanDto = z.infer<typeof CreateLoanDtoSchema>;
