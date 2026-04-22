import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateProductVariantDto {
  @IsString()
  code!: string

  @IsString()
  name!: string

  @IsNumber()
  @Min(0)
  price!: number

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
  productId!: string
}
