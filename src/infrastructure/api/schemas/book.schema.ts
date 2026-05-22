import { z } from 'zod';

export const RegisterBookBodySchema = z.object({
  isbn: z
    .string()
    .min(1, 'ISBN is required')
    .regex(/^(97(8|9))?\d{9}(\d|X)$/, 'ISBN must be a valid ISBN-10 or ISBN-13'),
  title: z.string().min(1, 'Title is required').max(255),
  area: z.string().min(1, 'Area is required').max(100),
  totalCopies: z
    .number()
    .int('totalCopies must be an integer')
    .positive('totalCopies must be greater than 0'),
});

export type RegisterBookBody = z.infer<typeof RegisterBookBodySchema>;

export const IsbnParamSchema = z.object({
  isbn: z.string().min(1, 'ISBN param is required'),
});

export type IsbnParam = z.infer<typeof IsbnParamSchema>;
