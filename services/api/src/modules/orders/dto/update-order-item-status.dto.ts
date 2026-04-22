import { IsString } from 'class-validator'

export class UpdateOrderItemStatusDto {
  @IsString()
  orderItemId!: string

  @IsString()
  status!: string
}
