import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { CreateLoanBodySchema, LoanIdParamSchema } from '../schemas/loan.schema.js';
import { successResponse } from '../../../domain/response/ApiResponse.js';

export const loanRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * POST /loans
   * Create a new loan for a book.
   */
  app.post('/', async (request, reply) => {
    const body = CreateLoanBodySchema.parse(request.body);

    const { createLoanUseCase } = request.diScope.cradle;
    const loan = await createLoanUseCase.execute(body);

    return reply.status(201).send(successResponse(loan));
  });

  /**
   * PATCH /loans/:id/return
   * Mark a loan as returned.
   */
  app.patch('/:id/return', async (request, reply) => {
    const { id } = LoanIdParamSchema.parse(request.params);

    const { returnBookUseCase } = request.diScope.cradle;
    const loan = await returnBookUseCase.execute({ loanId: id });

    return reply.status(200).send(successResponse(loan));
  });

  /**
   * GET /loans/overdue
   * List all active loans past their due date.
   */
  app.get('/overdue', async (_request, reply) => {
    const { listOverdueLoansUseCase } = _request.diScope.cradle;
    const loans = await listOverdueLoansUseCase.execute();

    return reply.status(200).send(successResponse(loans));
  });
};
