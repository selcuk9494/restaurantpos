import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class UpdateOrderItemDto {
  @IsString()
  orderItemId!: string

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
