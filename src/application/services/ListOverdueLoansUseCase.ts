import { ILoanRepository } from '../../domain/repository/ILoanRepository.js';
import { Loan } from '../../domain/entities/Loan.js';

export interface ListOverdueLoansDependencies {
  loanRepository: ILoanRepository;
}

export class ListOverdueLoansUseCase {
  private readonly loanRepository: ILoanRepository;

  constructor(deps: ListOverdueLoansDependencies) {
    this.loanRepository = deps.loanRepository;
  }

  async execute(): Promise<Loan[]> {
    return this.loanRepository.findOverdue();
  }
}
