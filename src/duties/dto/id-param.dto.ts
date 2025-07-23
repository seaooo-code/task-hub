import { IsInt, Min } from 'class-validator';

export class IdParamDto {
  @IsInt({ message: 'ID must be an integer' })
  @Min(1, { message: 'ID must be greater than 0' })
  id: number;
}
