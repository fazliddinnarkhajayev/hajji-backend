import { Injectable } from '@nestjs/common';
import { LocationsDao, Location } from './locations.dao';
import { BaseService } from 'src/shared/services/base.service';

@Injectable()
export class LocationsService extends BaseService<Location, LocationsDao> {
  constructor(private readonly locationsDao: LocationsDao) {
    super(locationsDao);
  }
}
