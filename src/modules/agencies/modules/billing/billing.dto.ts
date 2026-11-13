import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { ACTIVATION_STATUSES, REFUND_REASONS, TRANSACTION_TYPES } from 'src/shared/services/billing.service';

export class AgencyTransactionsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(TRANSACTION_TYPES as unknown as string[])
  type?: string;
}

export class ActivationsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(ACTIVATION_STATUSES as unknown as string[])
  status?: string;

  /** 'true': only activations a refund can be asked for (IN_USE or FREE, paid). */
  @IsOptional() @IsIn(['true', 'false'])
  refundable?: string;

  @IsOptional() @IsString() @MaxLength(100)
  q?: string;
}

export class AgencyRefundRequestsQueryDto extends PaginationDto {
  @IsOptional() @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: string;
}

export class CreateRefundRequestDto {
  @IsUUID()
  activation_id: string;

  @IsIn(REFUND_REASONS as unknown as string[])
  reason: string;

  @IsOptional() @IsString() @MaxLength(1000)
  comment?: string;
}
