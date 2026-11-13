import { Type } from 'class-transformer';
import {
  IsBoolean, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Length, Matches, MaxLength, Min, NotEquals,
} from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { TRANSACTION_TYPES } from 'src/shared/services/billing.service';

export class CreateCurrencyDto {
  @Matches(/^[A-Z]{3}$/, { message: 'code must be 3 capital letters, e.g. UZS' })
  code: string;

  @IsString() @IsNotEmpty() @MaxLength(60)
  name: string;

  @IsString() @IsNotEmpty() @MaxLength(10)
  symbol: string;

  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  coin_price: number;
}

export class UpdateCurrencyDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(60)
  name?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(10)
  symbol?: string;

  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive()
  coin_price?: number;

  @IsOptional() @IsBoolean()
  is_active?: boolean;
}

export class SetAgencyCurrencyDto {
  @Matches(/^[A-Z]{3}$/)
  currency_code: string;
}

export class TopupDto {
  @Type(() => Number) @IsInt() @Min(1)
  coins: number;

  /** Defaults to coins × the agency currency's coin price; set it for a discount. */
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  paid_amount?: number;

  @IsOptional() @IsString() @MaxLength(100)
  reference?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  note?: string;
}

export class AdjustDto {
  @Type(() => Number) @IsInt() @NotEquals(0)
  coins: number;

  @IsString() @Length(3, 1000)
  note: string;
}

export class TransactionsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(TRANSACTION_TYPES as unknown as string[])
  type?: string;
}

export class RefundRequestsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: string;

  @IsOptional() @IsString()
  agency_id?: string;
}

export class DecideRefundDto {
  @IsOptional() @IsString() @MaxLength(1000)
  admin_comment?: string;
}
