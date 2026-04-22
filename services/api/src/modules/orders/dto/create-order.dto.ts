import { IsOptional, IsString } from 'class-validator'

export class CreateOrderDto {
  @IsString()
  sessionId!: string

  @IsOptional()
  @IsString()
  note?: string
}
