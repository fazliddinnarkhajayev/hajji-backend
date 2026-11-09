import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * One Tawaf / Sa'y run as recorded by the app — sent while it goes on and
 * again when it ends; every upload continues the same server record.
 * `laps`, `events` and `points` are checked and normalised by the service
 * (see MobileRitualSessionsService).
 *
 *   laps / events  the run's full current list (replaces the stored one)
 *   points         only the fixes from index `points_from` on (appended)
 *
 *   laps    [{ number, started_at?, completed_at, crossed_at?, duration_ms?, distance_m?,
 *              mean_radius_m?, confidence?, samples?, manual, from?, to? }]
 *   events  [{ type, at, value? }]           (times as ISO strings)
 *   points  [[timestamp_ms, lat, lng, accuracy, accepted 0|1], …]
 */
export class RitualSessionDto {
  @IsUUID()
  client_id: string;

  @IsIn(['TAWAF', 'SAI'])
  type: 'TAWAF' | 'SAI';

  @IsIn(['IN_PROGRESS', 'PAUSED', 'COMPLETED', 'INTERRUPTED'])
  status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'INTERRUPTED';

  @IsOptional()
  @IsString()
  @MaxLength(20)
  floor?: string;

  @IsInt()
  @Min(1)
  @Max(50)
  target_count: number;

  @IsInt()
  @Min(0)
  @Max(50)
  completed_count: number;

  @IsOptional() @IsInt() @Min(0) manual_count?: number;
  @IsOptional() @IsInt() @Min(0) adjust_plus?: number;
  @IsOptional() @IsInt() @Min(0) adjust_minus?: number;
  @IsOptional() @IsInt() @Min(0) pause_count?: number;

  @IsISO8601()
  started_at: string;

  @IsOptional()
  @IsISO8601()
  completed_at?: string;

  @IsInt() @Min(0) duration_ms: number;
  @IsOptional() @IsInt() @Min(0) paused_ms?: number;

  @IsOptional() @IsNumber() distance_m?: number;
  @IsOptional() @IsNumber() avg_accuracy_m?: number;
  @IsOptional() @IsInt() @Min(0) accepted_fixes?: number;
  @IsOptional() @IsInt() @Min(0) rejected_fixes?: number;

  @IsOptional() @IsString() @MaxLength(10) confidence_level?: string;
  @IsOptional() @IsNumber() confidence?: number;
  @IsOptional() @IsString() @MaxLength(20) direction?: string;

  @IsOptional()
  @IsBoolean()
  is_test?: boolean;

  @IsOptional()
  @IsObject()
  centre?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  diagnostics?: Record<string, unknown>;

  @IsArray()
  @ArrayMaxSize(50)
  laps: Record<string, unknown>[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2000)
  events?: Record<string, unknown>[];

  /** Index (seq) of points[0] in the run's path: the fixes the server already has. */
  @IsOptional()
  @IsInt()
  @Min(0)
  points_from?: number;

  /** About one fix a second: 20 000 is well over five hours of tracking. */
  @IsArray()
  @ArrayMaxSize(20000)
  points: unknown[];

  @IsOptional() @IsString() @MaxLength(50) app_version?: string;
  @IsOptional() @IsString() @MaxLength(20) platform?: string;
  @IsOptional() @IsString() @MaxLength(500) device_info?: string;

  /** When the device last changed the run. */
  @IsOptional()
  @IsISO8601()
  updated_at?: string;
}

export class SyncRitualSessionsDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RitualSessionDto)
  sessions: RitualSessionDto[];
}
