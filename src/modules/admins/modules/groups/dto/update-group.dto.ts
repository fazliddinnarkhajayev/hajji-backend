export class UpdateGroupDto {
  agency_id?: string;
  name?: string;
  description?: string;
  departure_date?: Date;
  return_date?: Date;
  meeting_point?: string;
  guide_pilgrim_id?: string;
  status?: 'NEW' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}
