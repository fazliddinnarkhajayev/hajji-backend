import { IsIn } from 'class-validator';

export class ChangeAgencyUserStatusDto {
  @IsIn(['ACTIVE', 'BLOCKED'])
  status!: 'ACTIVE' | 'BLOCKED';
}
