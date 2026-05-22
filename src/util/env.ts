import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  PORT: z
    .string()
    .regex(/^\d+$/, 'PORT must be a numeric string')
    .transform(Number)
    .refine((n) => n > 0 && n < 65536, 'PORT must be between 1 and 65535'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEFAULT_LOAN_DAYS: z
    .string()
    .regex(/^\d+$/, 'DEFAULT_LOAN_DAYS must be a numeric string')
    .transform(Number)
    .refine((n) => n > 0, 'DEFAULT_LOAN_DAYS must be a positive integer'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.errors
    .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
    .join('\n');

  throw new Error(
    `❌ Invalid environment variables:\n${errors}\n\nPlease check your .env file.`,
  );
}

export const env = parsed.data;
export type Env = typeof env;
