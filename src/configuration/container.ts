import {
  createContainer,
  asClass,
  asValue,
  InjectionMode,
  AwilixContainer,
} from 'awilix';
import { env } from '../util/env.js';
import { getDatabase } from './database.js';

// ─── Infrastructure ──────────────────────────────────────────────────────
import { PostgresBookRepository } from '../infrastructure/repositories/PostgresBookRepository.js';
import { PostgresLoanRepository } from '../infrastructure/repositories/PostgresLoanRepository.js';

// ─── Domain services ─────────────────────────────────────────────────────
import { LoanDomainService } from '../domain/services/LoanDomainService.js';

// ─── Application use cases ───────────────────────────────────────────────
import { RegisterBookUseCase } from '../application/services/RegisterBookUseCase.js';
import { CreateLoanUseCase } from '../application/services/CreateLoanUseCase.js';
import { ReturnBookUseCase } from '../application/services/ReturnBookUseCase.js';
import { ListOverdueLoansUseCase } from '../application/services/ListOverdueLoansUseCase.js';
import { CheckAvailabilityUseCase } from '../application/services/CheckAvailabilityUseCase.js';

// ─── Container cradle type ───────────────────────────────────────────────

export interface Cradle {
  // Values
  db: ReturnType<typeof getDatabase>;
  defaultLoanDays: number;

  // Repositories (singletons)
  bookRepository: PostgresBookRepository;
  loanRepository: PostgresLoanRepository;

  // Domain services (singletons)
  loanDomainService: LoanDomainService;

  // Use cases (transient)
  registerBookUseCase: RegisterBookUseCase;
  createLoanUseCase: CreateLoanUseCase;
  returnBookUseCase: ReturnBookUseCase;
  listOverdueLoansUseCase: ListOverdueLoansUseCase;
  checkAvailabilityUseCase: CheckAvailabilityUseCase;
}

export function buildContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
  });

  container.register({
    // ─── Values ───────────────────────────────────────────────────────────
    db: asValue(getDatabase()),
    defaultLoanDays: asValue(env.DEFAULT_LOAN_DAYS),

    // ─── Repositories (singleton — one instance for the app lifetime) ─────
    bookRepository: asClass(PostgresBookRepository).singleton(),
    loanRepository: asClass(PostgresLoanRepository).singleton(),

    // ─── Domain services (singleton — stateless, safe to share) ──────────
    loanDomainService: asClass(LoanDomainService).singleton(),

    // ─── Use cases (transient — fresh instance per request) ───────────────
    registerBookUseCase: asClass(RegisterBookUseCase).transient(),
    createLoanUseCase: asClass(CreateLoanUseCase).transient(),
    returnBookUseCase: asClass(ReturnBookUseCase).transient(),
    listOverdueLoansUseCase: asClass(ListOverdueLoansUseCase).transient(),
    checkAvailabilityUseCase: asClass(CheckAvailabilityUseCase).transient(),
  });

  return container;
}
