import {
	ArrayNotEmpty,
	IsArray,
	IsNumber,
	IsOptional,
	IsString,
} from "class-validator";
import type { dutiesTable } from "../../../drizzle/schema";

type Duty = typeof dutiesTable.$inferSelect;
type DutyUpdate = Pick<Duty, "id"> & Partial<Omit<Duty, "id">>;

export class UpdateDutyDto implements DutyUpdate {
	@IsNumber()
	id: number;

	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	users: string[];

	@IsString()
	@IsOptional()
	name?: string | undefined;

	@IsNumber()
	@IsOptional()
	enabled?: number | undefined;

	@IsString()
	@IsOptional()
	receiveId?: string | undefined;

	@IsString()
	@IsOptional()
	templateId?: string | undefined;

	@IsString()
	@IsOptional()
	cronSchedule?: string | undefined;

	@IsString()
	@IsOptional()
	lastRunTime?: string | null | undefined;

	@IsString()
	@IsOptional()
	createAt?: string | undefined;

	@IsString()
	@IsOptional()
	updateAt?: string | undefined;

	@IsNumber()
	@IsOptional()
	personIndex?: number | undefined;

	@IsNumber()
	@IsOptional()
	startTimeHour?: number | undefined;

	@IsNumber()
	@IsOptional()
	startTimeMinute?: number | undefined;

	@IsNumber()
	@IsOptional()
	endTimeMinute?: number | undefined;

	@IsNumber()
	@IsOptional()
	endTimeHour?: number | undefined;

	@IsNumber()
	@IsOptional()
	dayOfWeek?: number | undefined;

	@IsString()
	@IsOptional()
	creatorId?: string | undefined;
}
