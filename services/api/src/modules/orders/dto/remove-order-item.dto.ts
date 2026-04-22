import { IsString } from 'class-validator'

export class RemoveOrderItemDto {
  @IsString()
  orderItemId!: string
}
