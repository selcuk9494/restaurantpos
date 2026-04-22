import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreateTableDto {
  @IsString()
  code!: string

  @IsString()
  name!: string

  @IsInt()
  @Min(1)
  capacity!: number

  @IsString()
  areaId!: string

  @IsOptional()
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
