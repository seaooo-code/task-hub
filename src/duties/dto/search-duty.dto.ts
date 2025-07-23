import { IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchDutyDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  pageSize?: number;
}
