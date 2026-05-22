import { DomainError } from './DomainError.js';

export class LoanNotFoundError extends DomainError {
  readonly code = 'LOAN_NOT_FOUND';

  constructor(loanId: string) {
    super(`Loan with ID "${loanId}" was not found.`);
  }
}
