import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateProductDto {
  @IsString()
  code!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  @Min(0)
  price!: number

  @IsString()
  categoryId!: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
