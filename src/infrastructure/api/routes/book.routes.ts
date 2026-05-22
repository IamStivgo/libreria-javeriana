import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { RegisterBookBodySchema, IsbnParamSchema } from '../schemas/book.schema.js';
import { successResponse } from '../../../domain/response/ApiResponse.js';

export const bookRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * POST /books
   * Register a new book in the system.
   */
  app.post('/', async (request, reply) => {
    const body = RegisterBookBodySchema.parse(request.body);

    const { registerBookUseCase } = request.diScope.cradle;
    const book = await registerBookUseCase.execute(body);

    return reply.status(201).send(successResponse(book));
  });

  /**
   * GET /books/:isbn/availability
   * Check how many copies of a book are available.
   */
  app.get('/:isbn/availability', async (request, reply) => {
    const { isbn } = IsbnParamSchema.parse(request.params);

    const { checkAvailabilityUseCase } = request.diScope.cradle;
    const result = await checkAvailabilityUseCase.execute(isbn);

    return reply.status(200).send(successResponse(result));
  });
};
