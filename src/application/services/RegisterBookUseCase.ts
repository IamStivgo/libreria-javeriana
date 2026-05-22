import { IBookRepository } from '../../domain/repository/IBookRepository.js';
import { Book } from '../../domain/entities/Book.js';

export interface RegisterBookDto {
  isbn: string;
  title: string;
  area: string;
  totalCopies: number;
}

export interface RegisterBookDependencies {
  bookRepository: IBookRepository;
}

export class RegisterBookUseCase {
  private readonly bookRepository: IBookRepository;

  constructor(deps: RegisterBookDependencies) {
    this.bookRepository = deps.bookRepository;
  }

  async execute(dto: RegisterBookDto): Promise<Book> {
    const book: Book = {
      isbn: dto.isbn,
      title: dto.title,
      area: dto.area,
      totalCopies: dto.totalCopies,
      availableCopies: dto.totalCopies,
      createdAt: new Date(),
    };

    return this.bookRepository.save(book);
  }
}
