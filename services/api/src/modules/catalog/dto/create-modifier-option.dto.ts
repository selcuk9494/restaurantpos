import { IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator'

export class CreateModifierOptionDto {
  @IsString()
  code!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsNumber()
  priceDelta?: number

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsInt()
  sortOrder?: number

  @IsString()
  modifierGroupId!: string
}
