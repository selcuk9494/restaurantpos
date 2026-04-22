import { Type } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateReservationDto {
  @IsOptional()
  @IsString()
  customerId?: string

  @IsOptional()
  @IsString()
  tableId?: string

  @IsString()
  @MaxLength(120)
  fullName!: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount!: number

  @IsDateString()
  reservedAt!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string
}
