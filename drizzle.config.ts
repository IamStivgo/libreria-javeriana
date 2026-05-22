import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infrastructure/repositories/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://localhost:5432/library',
  },
  verbose: true,
  strict: true,
});
