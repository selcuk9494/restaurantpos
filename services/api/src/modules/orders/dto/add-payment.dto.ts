import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class AddPaymentDto {
  @IsString()
  orderId!: string

  @IsString()
  method!: string

  @IsNumber()
  @Min(0.01)
  amount!: number

  @IsOptional()
  @IsString()
  note?: string
}
