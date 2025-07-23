import { IsEnum, IsNumber } from 'class-validator';

export enum StatusEnum {
  enabled = 1,
  disabled = 0,
}

export class SwitchStatusDto {
  @IsNumber()
  id: number;

  @IsEnum(StatusEnum)
  status: number;
}
