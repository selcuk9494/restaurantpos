import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class OpenTableSessionDto {
  @IsString()
  tableId!: string

  @IsOptional()
  @IsInt()
  @Min(1)
  guestCount?: number

  @IsOptional()
  @IsString()
  note?: string
}
