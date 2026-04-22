import { IsInt, IsOptional, IsString } from 'class-validator'

export class AttachModifierGroupDto {
  @IsString()
  productId!: string

  @IsString()
  modifierGroupId!: string

  @IsOptional()
  @IsInt()
  sortOrder?: number
}
