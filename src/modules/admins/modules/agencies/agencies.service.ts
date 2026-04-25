import { Injectable } from '@nestjs/common';
import { AgenciesDao, Agency } from './agencies.dao';
import { BaseService } from 'src/shared/services/base.service';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';

@Injectable()
export class AgenciesService extends BaseService<Agency, AgenciesDao> {
  constructor(
    private readonly agenciesDao: AgenciesDao,
    private readonly pilgrimsDao: PilgrimsDao,
  ) {
    super(agenciesDao);
  }

  async create(dto: Partial<Agency>) {
    return this.agenciesDao.insert({ ...dto, status: 'ACTIVE' } as Partial<Agency>);
  }

  async findRequests(pageIndex: number = 1, pageSize: number = 10) {
    return this.agenciesDao.findManyPaginated({ status: 'PENDING' } as Partial<Agency>, pageIndex, pageSize);
  }

  async approve(id: string) {
    return this.agenciesDao.updateById(id, { status: 'APPROVED' } as Partial<Agency>);
  }

  async reject(id: string) {
    return this.agenciesDao.updateById(id, { status: 'REJECTED' } as Partial<Agency>);
  }

  async findAllReference() {
    return this.agenciesDao.findAllReference();
  }

  async findGuidesByAgency(agencyId: string, hasGroup?: boolean) {
    return this.pilgrimsDao.findGuidesByAgency(agencyId, hasGroup);
  }
}
