import Fastify, { FastifyInstance } from 'fastify';
import { fastifyAwilixPlugin, diContainer } from '@fastify/awilix';
import { ZodError } from 'zod';
import { DomainError } from '../../domain/exceptions/DomainError.js';
import { BookNotFoundError } from '../../domain/exceptions/BookNotFoundError.js';
import { LoanNotFoundError } from '../../domain/exceptions/LoanNotFoundError.js';
import { NoAvailableCopiesError } from '../../domain/exceptions/NoAvailableCopiesError.js';
import { bookRoutes } from './routes/book.routes.js';
import { loanRoutes } from './routes/loan.routes.js';
import { env } from '../../util/env.js';
import { buildContainer } from '../../configuration/container.js';

export function buildServer(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
  });

  // ─── Dependency injection ────────────────────────────────────────────────
  app.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
  });

  app.addHook('onRegister', () => {
    const container = buildContainer();
    // Merge registrations into the diContainer managed by the plugin
    diContainer.register(container.registrations);
  });

  // ─── Global error handler ──────────────────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    // Zod validation errors → 400
    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.issues,
        },
      });
    }

    // Domain errors → mapped HTTP codes
    if (error instanceof DomainError) {
      const statusCode = domainErrorToHttpStatus(error);
      return reply.status(statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    // Unexpected errors → 500
    app.log.error(error);
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  // ─── Routes ─────────────────────────────────────────────────────────────
  app.register(bookRoutes, { prefix: '/books' });
  app.register(loanRoutes, { prefix: '/loans' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}

export async function startServer(): Promise<void> {
  const app = buildServer();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function domainErrorToHttpStatus(error: DomainError): number {
  if (error instanceof BookNotFoundError) return 404;
  if (error instanceof LoanNotFoundError) return 404;
  if (error instanceof NoAvailableCopiesError) return 409;
  return 400;
}
