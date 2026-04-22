import { IsEmail, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreateCustomerDto {
  @IsString()
  @MaxLength(64)
  code!: string

  @IsString()
  @MaxLength(120)
  fullName!: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  loyaltyPoints?: number
}
