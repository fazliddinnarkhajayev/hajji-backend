import { IsPhoneNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendOtpDto {
  @IsPhoneNumber()
  phone!: string;

  @Transform(({ value }) => value?.toUpperCase?.())
  @IsIn(['SMS', 'TELEGRAM'])
  method!: 'SMS' | 'TELEGRAM';
}
