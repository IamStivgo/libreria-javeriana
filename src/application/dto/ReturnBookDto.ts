import { z } from 'zod';

export const ReturnBookDtoSchema = z.object({
  loanId: z.string().uuid('loanId must be a valid UUID'),
});

export type ReturnBookDto = z.infer<typeof ReturnBookDtoSchema>;
