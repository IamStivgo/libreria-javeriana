import { ILoanRepository } from '../../domain/repository/ILoanRepository.js';
import { LoanNotFoundError } from '../../domain/exceptions/LoanNotFoundError.js';
import { Loan } from '../../domain/entities/Loan.js';
import { LoanStatus } from '../../domain/models/LoanStatus.js';
import { ReturnBookDto } from '../dto/ReturnBookDto.js';

export interface ReturnBookDependencies {
  loanRepository: ILoanRepository;
}

export class ReturnBookUseCase {
  private readonly loanRepository: ILoanRepository;

  constructor(deps: ReturnBookDependencies) {
    this.loanRepository = deps.loanRepository;
  }

  async execute(dto: ReturnBookDto): Promise<Loan> {
    const loan = await this.loanRepository.findById(dto.loanId);
    if (!loan) {
      throw new LoanNotFoundError(dto.loanId);
    }

    const returnedAt = new Date();
    const updatedLoan = await this.loanRepository.updateStatus(
      dto.loanId,
      LoanStatus.RETURNED,
      returnedAt,
    );

    return updatedLoan;
  }
}
