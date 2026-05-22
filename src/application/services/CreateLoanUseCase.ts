import { IBookRepository } from '../../domain/repository/IBookRepository.js';
import { ILoanRepository } from '../../domain/repository/ILoanRepository.js';
import { LoanDomainService } from '../../domain/services/LoanDomainService.js';
import { BookNotFoundError } from '../../domain/exceptions/BookNotFoundError.js';
import { NoAvailableCopiesError } from '../../domain/exceptions/NoAvailableCopiesError.js';
import { Loan } from '../../domain/entities/Loan.js';
import { LoanStatus } from '../../domain/models/LoanStatus.js';
import { CreateLoanDto } from '../dto/CreateLoanDto.js';

export interface CreateLoanDependencies {
  bookRepository: IBookRepository;
  loanRepository: ILoanRepository;
  loanDomainService: LoanDomainService;
  defaultLoanDays: number;
}

export class CreateLoanUseCase {
  private readonly bookRepository: IBookRepository;
  private readonly loanRepository: ILoanRepository;
  private readonly loanDomainService: LoanDomainService;
  private readonly defaultLoanDays: number;

  constructor(deps: CreateLoanDependencies) {
    this.bookRepository = deps.bookRepository;
    this.loanRepository = deps.loanRepository;
    this.loanDomainService = deps.loanDomainService;
    this.defaultLoanDays = deps.defaultLoanDays;
  }

  async execute(dto: CreateLoanDto): Promise<Loan> {
    const book = await this.bookRepository.findByIsbn(dto.isbn);
    if (!book) {
      throw new BookNotFoundError(dto.isbn);
    }

    if (!this.loanDomainService.canBorrow(book)) {
      throw new NoAvailableCopiesError(dto.isbn);
    }

    const loanDate = new Date();
    const days = dto.dueDays ?? this.defaultLoanDays;
    const dueDate = this.loanDomainService.calculateDueDate(loanDate, days);

    const loan = await this.loanRepository.save({
      isbn: dto.isbn,
      userId: dto.userId,
      loanDate,
      dueDate,
      returnedAt: null,
      status: LoanStatus.ACTIVE,
    });

    return loan;
  }
}
