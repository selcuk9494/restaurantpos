import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class AddOrderItemDto {
  @IsString()
  orderId!: string

  @IsString()
  productId!: string

  @IsOptional()
  @IsString()
  variantId?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number

  @IsOptional()
  @IsString()
  note?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifierOptionIds?: string[]
}
