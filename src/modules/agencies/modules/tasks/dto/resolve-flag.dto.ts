import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class ResolveFlagDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  comment!: string;

  @IsIn(['cancel', 'continue'])
  action!: 'cancel' | 'continue';
}
