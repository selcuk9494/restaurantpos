import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreateModifierGroupDto {
  @IsString()
  code!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelect?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelect?: number

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsInt()
  sortOrder?: number
}
