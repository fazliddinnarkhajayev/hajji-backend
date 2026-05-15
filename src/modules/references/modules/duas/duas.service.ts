import { Injectable } from '@nestjs/common';
import { DuasDao, Dua } from './duas.dao';
import { BaseService } from 'src/shared/services/base.service';

@Injectable()
export class DuasService extends BaseService<Dua, DuasDao> {
  constructor(private readonly duasDao: DuasDao) {
    super(duasDao);
  }
}
