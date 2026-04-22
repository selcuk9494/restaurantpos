import { IsOptional, IsString } from 'class-validator'

export class CloseOrderDto {
  @IsString()
  orderId!: string

  @IsOptional()
  @IsString()
  note?: string
}
