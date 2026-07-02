import { IsString, MaxLength, MinLength } from 'class-validator';

export class FlagTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  issue_comment!: string;
}
