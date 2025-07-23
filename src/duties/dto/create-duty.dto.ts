import { dutiesTable } from '../../../drizzle/schema';
import {
  ArrayNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

type duty = typeof dutiesTable.$inferInsert;

export class CreateDutyDto implements duty {
  @IsNumber()
  startTimeHour: number;

  @IsNumber()
  startTimeMinute: number;

  @IsNumber()
  endTimeMinute: number;

  @IsNumber()
  endTimeHour: number;

  @IsNumber()
  dayOfWeek: number;

  @IsString()
  name: string;

  @IsString()
  receiveId: string;

  @IsString()
  templateId: string;

  @IsString()
  cronSchedule: string;

  @IsNumber()
  personIndex: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  users: string[];

  @IsNumber()
  @IsOptional()
  id?: number | undefined;

  @IsString()
  @IsOptional()
  createAt?: string | undefined;

  @IsString()
  creatorId: string;
  @IsString()
  @IsOptional()
  updateAt?: string | undefined;

  @IsNumber()
  @IsOptional()
  enabled?: number | undefined;

  @IsString()
  @IsOptional()
  lastRunTime?: string | null | undefined;
}
