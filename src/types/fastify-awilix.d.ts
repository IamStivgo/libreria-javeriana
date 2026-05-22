import type { PostgresBookRepository } from '../infrastructure/repositories/PostgresBookRepository.js';
import type { PostgresLoanRepository } from '../infrastructure/repositories/PostgresLoanRepository.js';
import type { LoanDomainService } from '../domain/services/LoanDomainService.js';
import type { RegisterBookUseCase } from '../application/services/RegisterBookUseCase.js';
import type { CreateLoanUseCase } from '../application/services/CreateLoanUseCase.js';
import type { ReturnBookUseCase } from '../application/services/ReturnBookUseCase.js';
import type { ListOverdueLoansUseCase } from '../application/services/ListOverdueLoansUseCase.js';
import type { CheckAvailabilityUseCase } from '../application/services/CheckAvailabilityUseCase.js';
import type { getDatabase } from '../configuration/database.js';

declare module '@fastify/awilix' {
  interface Cradle {
    db: ReturnType<typeof getDatabase>;
    defaultLoanDays: number;

    bookRepository: PostgresBookRepository;
    loanRepository: PostgresLoanRepository;

    loanDomainService: LoanDomainService;

    registerBookUseCase: RegisterBookUseCase;
    createLoanUseCase: CreateLoanUseCase;
    returnBookUseCase: ReturnBookUseCase;
    listOverdueLoansUseCase: ListOverdueLoansUseCase;
    checkAvailabilityUseCase: CheckAvailabilityUseCase;
  }
}
