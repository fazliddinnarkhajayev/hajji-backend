import { Injectable, NotFoundException } from '@nestjs/common';
import { RitualSessionsDao, RitualType } from 'src/shared/dao/ritual-sessions.dao';

@Injectable()
export class AdminRitualSessionsService {
  constructor(private readonly dao: RitualSessionsDao) {}

  findAllPaginated(type: RitualType | undefined, pageIndex?: number, pageSize?: number) {
    return this.dao.listWithPilgrims({ type }, pageIndex, pageSize);
  }

  /** The run with its laps / trips and the walked path ([timestamp_ms, lat, lng, accuracy, accepted]). */
  async findOne(id: string) {
    const session = await this.dao.findDetail(id);
    if (!session) throw new NotFoundException('Ritual session not found');
    const [laps, points] = await Promise.all([this.dao.findLaps(id), this.dao.findPoints(id)]);
    return {
      ...session,
      laps,
      points: points.map((p) => [new Date(p.recorded_at).getTime(), p.lat, p.lng, p.accuracy, p.accepted ? 1 : 0]),
    };
  }
}
